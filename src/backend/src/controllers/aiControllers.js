import User from "../models/User.js";
import Meal from "../models/Meal.js"; 
import Notification from "../models/Notification.js"; // 🎯 ĐÃ IMPORT MODEL THÔNG BÁO
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo SDK một lần duy nhất
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateDailyPlan = async (req, res) => {
    let availableMeals = []; 

    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "Người dùng không tồn tại" });

        // Lấy danh sách món ăn từ Cơ sở dữ liệu (Kèm giá tiền để AI tính toán)
        availableMeals = await Meal.find().select('_id name totalNutrition totalEstimatedCost');
        
        if (availableMeals.length === 0) {
            // 🎯 GỌI CHUÔNG REO: Lỗi DB Trống
            try {
                await Notification.create({
                    userId: req.user._id,
                    type: 'SYSTEM',
                    title: 'Yêu cầu bị từ chối ❌',
                    content: 'Hệ thống không thể khởi tạo thực đơn do kho dữ liệu món ăn hiện đang trống.'
                });
            } catch (err) { console.error("Lỗi thông báo:", err.message); }
            
            return res.status(400).json({ message: "Chưa có món ăn nào trong hệ thống!" });
        }

        const menuString = availableMeals.map(meal => 
            `- ID: ${meal._id} | Tên món: ${meal.name} | Chi phí: ${meal.totalEstimatedCost || 0} VND | Calo: ${meal.totalNutrition?.calories || 0}`
        ).join('\n');

        // 🎯 ĐÃ TÍCH HỢP ĐIỀU KIỆN GIÁ RẺ VÀO PROMPT
        const prompt = `
            Bạn là chuyên gia dinh dưỡng của hệ thống NutriFood. Thiết kế thực đơn 1 ngày (Sáng, Trưa, Tối) cho khách hàng:
            - Mục tiêu: ${user.healthGoal || 'Duy trì sức khỏe'}
            - BMI: ${user.bmi > 0 ? user.bmi : 'Bình thường'}
            
            🟢 YÊU CẦU CỐT LÕI VỀ TÀI CHÍNH:
            Ưu tiên các món ăn thân thiện với túi tiền sinh viên/người đi làm. Hãy thiết kế sao cho chi phí các món nằm trong khoảng bình dân (chọn các món ≤ 20.000 VND hoặc ≤ 50.000 VND).

            🛑 BẮT BUỘC CHỌN MÓN TỪ DANH SÁCH DƯỚI ĐÂY (Sử dụng đúng ID của món ăn):
            ${menuString}

            Trả về ĐÚNG 1 mảng JSON chứa 3 object đại diện cho 3 bữa ăn theo cấu trúc sau:
            [{"mealId": "id_món_ăn", "mealType": "Sáng", "foodName": "Tên món", "calories": 400, "protein": 20, "carbs": 45, "fat": 15}]
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const textResponse = result.response.text();
        const mealPlan = JSON.parse(textResponse); 

        const formattedPlan = mealPlan.map((meal, index) => ({
            ...meal,
            _id: `ai_${Date.now()}_${index}`
        }));

        // 🎯 GỌI CHUÔNG REO: AI tạo thành công
        try {
            await Notification.create({
                userId: user._id,
                type: 'AI_COMPLETED',
                title: 'Thực đơn của bạn đã sẵn sàng! 🎉',
                content: 'Trợ lý AI đã thiết kế xong lộ trình ăn uống tiết kiệm và tối ưu cho bạn. Bấm vào đây để xem ngay!'
            });
        } catch (err) { console.error("Lỗi thông báo:", err.message); }

        return res.status(200).json(formattedPlan);

    } catch (error) {
        console.warn("⚠️ AI quá tải hoặc phản hồi lỗi, kích hoạt hệ thống sinh thực đơn dự phòng...");
        
        // =================================================================
        // 🛡️ PHƯƠNG ÁN DỰ PHÒNG (FALLBACK)
        // =================================================================
        if (availableMeals && availableMeals.length >= 3) {
            const shuffled = availableMeals.sort(() => 0.5 - Math.random());
            const mealTypes = ["Sáng", "Trưa", "Tối"];
            
            const fallbackPlan = mealTypes.map((type, index) => {
                const meal = shuffled[index];
                return {
                    _id: `fallback_${Date.now()}_${index}`,
                    mealId: meal._id,
                    mealType: type,
                    foodName: meal.name,
                    calories: meal.totalNutrition?.calories || 0,
                    protein: meal.totalNutrition?.protein || 0,
                    carbs: meal.totalNutrition?.carbs || 0,
                    fat: meal.totalNutrition?.fat || 0
                };
            });

            // 🎯 GỌI CHUÔNG REO: Kích hoạt dự phòng
            try {
                await Notification.create({
                    userId: req.user._id,
                    type: 'SYSTEM',
                    title: 'Gợi ý thực đơn ngẫu nhiên 🍲',
                    content: 'Hệ thống AI hiện đang bận. NutriFood đã tự động chọn ngẫu nhiên một số món ăn bình dân, tiết kiệm cho bạn hôm nay!'
                });
            } catch (err) { console.error("Lỗi thông báo:", err.message); }

            return res.status(200).json(fallbackPlan);
        }

        // 🎯 GỌI CHUÔNG REO: Lỗi toàn hệ thống (AI sập + DB trống)
        try {
            await Notification.create({
                userId: req.user._id,
                type: 'SYSTEM',
                title: 'Tạo thực đơn thất bại ❌',
                content: 'Hệ thống dịch vụ AI đang quá tải và kho dữ liệu dự phòng không đủ điều kiện khởi tạo. Vui lòng thử lại sau!'
            });
        } catch (err) { console.error("Lỗi thông báo:", err.message); }

        return res.status(503).json({ message: "Hệ thống AI đang quá tải và Cơ sở dữ liệu chưa đủ món ăn. Vui lòng thử lại sau!" });
    }
};