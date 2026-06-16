import express from 'express';
import { 
    toggleFavorite, 
    getUserFavorites, 
    checkIsFavorite,
    getMyFavorites, // 🎯 Đã import thêm hàm lấy danh sách cho thuật toán
    getAllFavoritesForAdmin,
    adminDeleteFavorite
} from '../controllers/favorite_mealsControllers.js';

// Nhập thêm middleware isAdmin để bảo vệ các route của quản trị viên
import { protectedRoute, isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router(); 

// ==========================================
// NHÓM 1: CÁC API DÀNH CHO NGƯỜI DÙNG (USER)
// ==========================================

// Thả tim hoặc hủy thả tim một món ăn
router.post("/toggle", protectedRoute, toggleFavorite);

// Lấy danh sách các món ăn mà user hiện tại đã thả tim (có kèm chi tiết món ăn)
router.get("/", protectedRoute, getUserFavorites);

// 🎯 API lấy danh sách ID món ăn yêu thích nhanh (Dùng cho Hybrid Recommendation)
router.get("/my-favorites", protectedRoute, getMyFavorites);

// Kiểm tra trạng thái thả tim của 1 món cụ thể (để tô màu trái tim trên UI)
router.get("/check/:mealId", protectedRoute, checkIsFavorite);


// ==========================================
// NHÓM 2: CÁC API DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN)
// ==========================================

// Lấy toàn bộ danh sách yêu thích của tất cả người dùng trên hệ thống
router.get("/all", protectedRoute, isAdmin, getAllFavoritesForAdmin);

// Admin gỡ bỏ bất kỳ lượt yêu thích nào
router.delete("/admin/:id", protectedRoute, isAdmin, adminDeleteFavorite);

export default router;