import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js'; // Thay đường dẫn import cho khớp dự án của bạn
import { 
    getChatHistory, 
    getChatSession, 
    deleteChatSession, 
    sendMessage 
} from '../controllers/chatsControllers.js';

const router = express.Router();

// Tất cả các route chat đều yêu cầu đăng nhập
router.use(protectedRoute);

// Các endpoint quản lý ChatHistory
router.get('/', getChatHistory);                   // Lấy danh sách chat bên cột trái
router.get('/:sessionId', getChatSession);         // Tải nội dung tin nhắn của 1 chat
router.delete('/:sessionId', deleteChatSession);   // Xóa/Ẩn chat
router.post('/send', sendMessage);                 // Gửi tin nhắn & Nhận phản hồi từ AI

export default router;