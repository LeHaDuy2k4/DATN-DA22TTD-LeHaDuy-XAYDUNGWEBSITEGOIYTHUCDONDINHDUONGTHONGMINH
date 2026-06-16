import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStores';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const ChatbotPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // --- STATES QUẢN LÝ LỊCH SỬ VÀ PHIÊN CHAT ---
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  
  // --- STATES QUẢN LÝ TIN NHẮN ---
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // 1. TẢI DANH SÁCH LỊCH SỬ TRÒ CHUYỆN (Sidebar)
  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('nutrifood_token');
      const res = await axios.get('http://localhost:5001/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatSessions(res.data.data || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử chat:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để sử dụng Trợ lý AI!");
      navigate('/signin');
      return;
    }
    fetchChatHistory();
  }, [user, navigate]);

  // 2. CHUYỂN ĐỔI PHIÊN CHAT & TẢI CHI TIẾT TIN NHẮN
  const handleSelectSession = async (sessionId) => {
    setCurrentSessionId(sessionId);
    try {
      const token = localStorage.getItem('nutrifood_token');
      const res = await axios.get(`http://localhost:5001/api/chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.data.messages || []);
    } catch (error) {
      toast.error("Không thể tải nội dung đoạn hội thoại.");
    }
  };

  // 3. TẠO PHIÊN CHAT MỚI
  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setInputMessage('');
  };

  // 4. XÓA / ẨN PHIÊN CHAT (Cập nhật isActive = false)
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài thẻ cha
    if (!window.confirm("Bạn muốn xóa đoạn hội thoại này?")) return;
    
    try {
      const token = localStorage.getItem('nutrifood_token');
      await axios.delete(`http://localhost:5001/api/chat/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success("Đã xóa đoạn hội thoại.");
      if (currentSessionId === sessionId) handleNewChat();
      fetchChatHistory();
    } catch (error) {
      toast.error("Lỗi khi xóa đoạn hội thoại.");
    }
  };

  // 5. GỬI TIN NHẮN CHO AI (Tương thích hoàn hảo với cơ chế Fallback ở Backend)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;

    const userText = inputMessage.trim();
    setInputMessage(''); 
    
    // Thêm tin nhắn của User vào UI ngay lập tức (Optimistic UI)
    const newUserMsg = { sender: 'user', content: userText, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const token = localStorage.getItem('nutrifood_token');
      
      const payload = {
        sessionId: currentSessionId, 
        message: userText
      };

      const res = await axios.post('http://localhost:5001/api/chat/send', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Nếu đây là chat mới, cập nhật lại Session ID và fetch lại Lịch sử bên Sidebar
      if (!currentSessionId && res.data.data.sessionId) {
        setCurrentSessionId(res.data.data.sessionId);
        fetchChatHistory(); 
      }

      // Thêm phản hồi của AI (Bao gồm cả phản hồi thực tế từ Gemini 2.5 hoặc phản hồi Fallback) vào UI
      const aiResponse = { sender: 'ai', content: res.data.data.reply, timestamp: new Date().toISOString() };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      // Chỉ rơi vào khối catch này khi Backend chết hoàn toàn (Node.js sập) hoặc rớt mạng Internet
      toast.error("Hệ thống máy chủ không phản hồi, vui lòng thử lại sau.");
      setMessages(prev => prev.slice(0, -1)); // Hoàn tác tin nhắn của User khỏi màn hình
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="font-sans text-slate-800 selection:bg-green-200 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-28 pb-10 px-4 sm:px-6 lg:px-8 flex flex-col h-[calc(100vh-80px)] max-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col md:flex-row gap-6 h-full overflow-hidden">
          
          {/* CỘT TRÁI: SIDEBAR LỊCH SỬ CHAT */}
          <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden shrink-0">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <button 
                onClick={handleNewChat}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Trò Chuyện Mới
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {chatSessions.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <span className="text-3xl block mb-2">💬</span>
                  <p className="text-sm font-medium text-slate-500">Chưa có lịch sử trò chuyện</p>
                </div>
              ) : (
                chatSessions.map((session) => (
                  <div 
                    key={session._id} 
                    onClick={() => handleSelectSession(session._id)}
                    className={`group cursor-pointer p-3 rounded-xl transition border ${currentSessionId === session._id ? 'bg-green-50 border-green-200' : 'hover:bg-slate-50 border-transparent'} flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <svg className={`w-5 h-5 shrink-0 ${currentSessionId === session._id ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                      <div className="truncate text-left">
                        <p className={`text-sm font-bold truncate ${currentSessionId === session._id ? 'text-green-800' : 'text-slate-700'}`}>
                          {session.title || "Cuộc trò chuyện mới"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date(session.updatedAt || session.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={(e) => handleDeleteSession(e, session._id)}
                      className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0"
                      title="Xóa đoạn chat"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* CỘT PHẢI: KHU VỰC TRÒ CHUYỆN CHÍNH */}
          <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden relative">
            
            {/* Vùng hiển thị tin nhắn */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-50/30">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto animate-fadeIn">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner border border-green-200">
                    <span className="text-4xl">🤖</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-800 mb-2">Xin chào {user?.displayName || user?.username}!</h2>
                  <p className="text-slate-500 font-medium text-sm leading-relaxed">
                    Tôi là Trợ lý dinh dưỡng AI của hệ thống. Tôi có thể giúp bạn tra cứu lượng calo, tư vấn thay thế nguyên liệu món ăn, hoặc phân tích thực đơn. Hãy hỏi tôi bất cứ điều gì!
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                    
                    {/* Avatar AI */}
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-sm">
                        <span className="text-sm">🤖</span>
                      </div>
                    )}
                    
                    {/* Bong bóng tin nhắn */}
                    <div 
                      className={`max-w-[80%] px-5 py-3.5 text-sm leading-relaxed ${
                        msg.sender === 'user' 
                          ? 'bg-slate-900 text-white rounded-2xl rounded-br-none shadow-md font-medium' 
                          : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-none shadow-sm font-medium'
                      }`}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}

              {/* Hiệu ứng AI đang gõ chữ */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mr-3 shrink-0 mt-1 shadow-sm">
                    <span className="text-sm">🤖</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-5 py-4 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Khung nhập liệu (Chat Input) */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative flex items-end gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Nhập câu hỏi của bạn về dinh dưỡng (Nhấn Enter để gửi)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-14 text-sm font-bold focus:outline-none focus:border-green-500 focus:bg-white transition-all resize-none custom-scrollbar shadow-inner"
                  rows="1"
                  style={{ minHeight: '52px', maxHeight: '120px' }}
                />
                <button 
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="absolute right-2 bottom-2 p-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
              <p className="text-center text-[10px] text-slate-400 font-bold mt-3">
                AI có thể đưa ra thông tin không chính xác. Hãy tự kiểm chứng trước khi áp dụng vào chế độ y khoa.
              </p>
            </div>
          </div>

        </div>
      </main>
      
      {/* CSS cho thanh cuộn mảnh mai tinh tế */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
      `}} />
    </div>
  );
};

export default ChatbotPage;