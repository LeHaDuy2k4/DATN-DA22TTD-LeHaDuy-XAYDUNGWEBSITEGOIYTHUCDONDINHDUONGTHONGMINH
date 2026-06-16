import express from 'express';
import { 
    getUserNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
} from '../controllers/notificationsControllers.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router();

// 🎯 Kích hoạt bảo vệ cho TẤT CẢ các API thông báo ở dưới
router.use(protectedRoute);

// Lấy danh sách thông báo & số lượng chưa đọc
router.get('/', getUserNotifications);

// Đánh dấu TẤT CẢ là đã đọc (Lưu ý: Phải đặt trên route có /:id để không bị nhầm lẫn tham số)
router.put('/read-all', markAllAsRead);

// Đánh dấu 1 thông báo cụ thể là đã đọc
router.put('/:id/read', markAsRead);

// Xóa 1 thông báo
router.delete('/:id', deleteNotification);

export default router;