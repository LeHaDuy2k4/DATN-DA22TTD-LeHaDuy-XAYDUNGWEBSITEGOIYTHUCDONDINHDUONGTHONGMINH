import ChatHistory from '../models/ChatHistory.js';
import Meal from '../models/Meal.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo thực thể Google Gen AI từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Hàm tiện ích tạo độ trễ (Sleep) phục vụ cho cơ chế tự động Retry
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 🎯 1. TRUY XUẤT DANH SÁCH CÁC PHIÊN TRÒ CHUYỆN (SIDEBAR)
 * GET /api/chat
 */
export const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Yêu cầu không được xác thực." });
    }

    // Chỉ truy xuất các phiên đang hoạt động (isActive: true), xếp cuộc gọi mới nhất lên đầu
    const sessions = await ChatHistory.find({ userId, isActive: true })
                                      .select('_id title updatedAt createdAt')
                                      .sort({ updatedAt: -1 });
    
    return res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    console.error("🔥 Lỗi tại getChatHistory:", error.message);
    return res.status(500).json({ success: false, message: "Không thể tải danh sách lịch sử trò chuyện." });
  }
};

/**
 * 🎯 2. TRUY XUẤT CHI TIẾT NỘI DUNG MỘT PHIÊN TRÒ CHUYỆN
 * GET /api/chat/:sessionId
 */
export const getChatSession = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { sessionId } = req.params;

    const session = await ChatHistory.findOne({ _id: sessionId, userId, isActive: true });
    if (!session) {
      return res.status(404).json({ success: false, message: "Đoạn hội thoại không tồn tại hoặc đã bị ẩn." });
    }

    return res.status(200).json({ success: true, data: session });
  } catch (error) {
    console.error("🔥 Lỗi tại getChatSession:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải chi tiết tin nhắn." });
  }
};

/**
 * 🎯 3. ẨN/XÓA ĐOẠN HỘI THOẠI (CƠ CHẾ XÓA MỀM - SOFT DELETE)
 * DELETE /api/chat/:sessionId
 */
export const deleteChatSession = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { sessionId } = req.params;

    // Chuyển trạng thái hiển thị thành false để tối ưu hóa bộ dữ liệu phân tích sau này
    const session = await ChatHistory.findOneAndUpdate(
      { _id: sessionId, userId },
      { isActive: false },
      { returnDocument: 'after' } // Đã cập nhật theo chuẩn mới của Mongoose
    );

    if (!session) {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên trò chuyện yêu cầu." });
    }

    return res.status(200).json({ success: true, message: "Đã xóa đoạn hội thoại khỏi giao diện thành công." });
  } catch (error) {
    console.error("🔥 Lỗi tại deleteChatSession:", error.message);
    return res.status(500).json({ success: false, message: "Không thể thực hiện xóa đoạn hội thoại lúc này." });
  }
};

/**
 * 🎯 4. TIẾP NHẬN TIN NHẮN, TRÍCH XUẤT RAG TỪ DB & GIAO TIẾP MÔ HÌNH LLM (GEMINI 2.5 FLASH)
 * POST /api/chat/send
 */
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { sessionId, message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, message: "Nội dung tin nhắn từ người dùng không được để trống." });
    }

    let chatDoc;
    let historyForLLM = [];

    // KIỂM TRA PHIÊN CHAT CŨ HOẶC KHỞI TẠO MỚI
    if (sessionId) {
      chatDoc = await ChatHistory.findOne({ _id: sessionId, userId, isActive: true });
      if (!chatDoc) {
        return res.status(404).json({ success: false, message: "Không tìm thấy ngữ cảnh hội thoại tương ứng." });
      }
      
      // Định dạng mảng lịch sử trò chuyện khớp với cấu hình SDK của Google Gemini
      historyForLLM = chatDoc.messages.map(msg => ({
        role: msg.sender === 'ai' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    } else {
      // Tự động kiến tạo tiêu đề (Title) dựa trên 8 từ đầu tiên của câu hỏi đầu tiên
      const words = message.trim().split(/\s+/);
      const generatedTitle = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
      
      chatDoc = new ChatHistory({
        userId,
        title: generatedTitle,
        messages: []
      });
    }

    // Đẩy tin nhắn "Sạch" của người dùng vào cơ sở dữ liệu để hiển thị UI
    chatDoc.messages.push({ sender: 'user', content: message });

    // =================================================================
    // KỸ THUẬT RAG: TRÍCH XUẤT TOÀN BỘ CÔNG THỨC & DINH DƯỠNG TỪ DATABASE
    // =================================================================
    let dbContextString = "Hiện tại cơ sở dữ liệu hệ thống trống hoặc không có món ăn nào khả dụng.";
    try {
      // 🎯 NÂNG CẤP: Lấy thêm description, instructions, macros, thời gian nấu
      const activeMeals = await Meal.find({ isActive: true })
                                    .select('name description totalNutrition prepTime cookTime instructions')
                                    .limit(40); // Nâng limit lên 40 vì 2.5 Flash xử lý token rất tốt
      
      if (activeMeals && activeMeals.length > 0) {
        dbContextString = activeMeals.map(m => {
          // Xử lý tính toán thời gian và dinh dưỡng
          const totalTime = (m.prepTime || 0) + (m.cookTime || 0);
          const macros = `Calo: ${m.totalNutrition?.calories || 0}kcal | Protein: ${m.totalNutrition?.protein || 0}g | Carbs: ${m.totalNutrition?.carbs || 0}g | Fat: ${m.totalNutrition?.fat || 0}g`;
          
          // Xử lý mảng hướng dẫn nấu ăn thành chuỗi rõ ràng
          const steps = (m.instructions && m.instructions.length > 0) 
            ? m.instructions.map((step, idx) => `   Bước ${idx + 1}: ${step}`).join('\n')
            : "   Chưa cập nhật cách làm chi tiết.";

          // Đóng gói dữ liệu của 1 món ăn
          return `🍲 TÊN MÓN: ${m.name}\n- Mô tả: ${m.description || 'Không có'}\n- Dinh dưỡng: ${macros}\n- Thời gian thực hiện: ${totalTime} phút\n- CÁCH CHẾ BIẾN:\n${steps}`;
        }).join('\n\n-------------------------\n\n');
      }
    } catch (dbError) {
      console.error("⚠️ Cảnh báo RAG: Không thể trích xuất thực đơn từ MongoDB:", dbError.message);
    }

    // Gộp lệnh hướng dẫn hệ thống và dữ liệu RAG
    const systemInstructionPrompt = `
      Bạn là Đầu bếp ảo và Chuyên gia dinh dưỡng độc quyền của hệ thống NutriFood.
      Nhiệm vụ cốt lõi của bạn là giải đáp thắc mắc, hướng dẫn nấu ăn chi tiết, tính toán hàm lượng dinh dưỡng và đưa ra lời khuyên khoa học về sức khỏe bằng tiếng Việt chuẩn.
      
      🚨 KHO DỮ LIỆU ĐỘC QUYỀN (RAG) TỪ HỆ THỐNG:
      Dưới đây là danh sách đầy đủ công thức, hàm lượng dinh dưỡng và cách chế biến của các món ăn thực tế trong cơ sở dữ liệu hệ thống:
      
      ${dbContextString}
      
      QUY TẮC BẮT BUỘC TRẢ LỜI:
      1. Khi được hỏi về công thức/cách làm: Bạn PHẢI trích xuất chính xác phần "CÁCH CHẾ BIẾN" của món ăn tương ứng trong danh sách trên để hướng dẫn người dùng. Hãy trình bày rõ ràng từng bước.
      2. Khi được hỏi về dinh dưỡng: Đọc phần "Dinh dưỡng" để tư vấn chính xác chỉ số Calo, Protein, Carbs, Fat.
      3. Chống bịa đặt (Hallucination): Tuyệt đối KHÔNG TỰ BỊA ra công thức hoặc món ăn nếu nó không có trong kho dữ liệu trên. Nếu người dùng hỏi món ngoài danh sách, hãy khéo léo thông báo hệ thống chưa cập nhật và chủ động gợi ý một món ăn tương tự có sẵn trong danh sách để thay thế.
    `;

    let aiReply = "";
    let retryCount = 3; 
    let isSuccess = false;

    // VÒNG LẶP RETRY AUTOMATION & CƠ CHẾ DỰ PHÒNG (FALLBACK)
    while (retryCount > 0 && !isSuccess) {
      try {
        // 🎯 SỬ DỤNG MÔ HÌNH 2.5 FLASH
        const model = genAI.getGenerativeModel({ 
          model: "gemini-2.5-flash",
          systemInstruction: systemInstructionPrompt
        });

        const chat = model.startChat({ history: historyForLLM });
        const result = await chat.sendMessage(message);
        aiReply = result.response.text();
        
        isSuccess = true; 
      } catch (aiError) {
        retryCount--;
        console.warn(`[API WARNING] Lỗi kết nối Gemini AI. Đang thử lại... Còn ${retryCount} lần. Chi tiết: ${aiError.message}`);
        
        if (retryCount > 0) {
          await sleep(1500); 
        } else {
          console.error(`[SYSTEM ALERT] Kích hoạt cơ chế Chatbot dự phòng nội bộ thành công do lỗi: ${aiError.message}`);
          aiReply = `⚠️ **[Hệ thống kích hoạt cơ chế phản hồi dự phòng do máy chủ AI quá tải]**\n\nXin chào bạn, hiện tại kênh kết nối Trí tuệ nhân tạo (Generative AI) đang gặp sự cố nghẽn mạng cục bộ.\n\nTuy nhiên, tính năng **Bảng Điều Khiển Dinh Dưỡng** và hệ thống **Chọn món ăn tự động từ Cơ sở dữ liệu đồ án** của NutriFood vẫn đang hoạt động ổn định 100%. Bạn có thể xem trực tiếp công thức chế biến tại phần Thực đơn của hệ thống nhé!`;
        }
      }
    }

    // Cập nhật phản hồi cuối cùng vào mảng tin nhắn và lưu trữ an toàn xuống DB
    chatDoc.messages.push({ sender: 'ai', content: aiReply });
    await chatDoc.save();

    // Trả dữ liệu sạch về cho Frontend React hiển thị mượt mà
    return res.status(200).json({ 
      success: true, 
      data: { 
        sessionId: chatDoc._id, 
        reply: aiReply 
      }
    });

  } catch (error) {
    console.error("🔥 LỖI NGHIÊM TRỌNG TẠI CHAT CONTROLLER:", error.message);
    return res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ trong quá trình xử lý hội thoại.", error: error.message });
  }
};