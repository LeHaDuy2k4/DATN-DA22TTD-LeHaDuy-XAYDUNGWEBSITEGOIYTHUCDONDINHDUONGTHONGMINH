import express from 'express';
import { 
    getAllMeals, 
    getMealById, 
    createMeal, 
    updateMeal, 
    deleteMeal,
    importMeals
} from '../controllers/mealsControllers.js';
import { isAdmin, protectedRoute } from '../middlewares/authMiddleware.js';
import { uploadLocal } from '../middlewares/upload.js'; // 🎯 Import middleware upload ảnh

const router = express.Router(); 

// Xem danh sách món ăn & chi tiết món ăn (Public - Ai cũng xem được)
router.get("/", getAllMeals);
router.get("/:id", getMealById);

// Import dữ liệu hàng loạt (Yêu cầu Admin)
router.post("/import", protectedRoute, isAdmin, importMeals);

// ==========================================
// CÁC ROUTE THAO TÁC DỮ LIỆU (YÊU CẦU ADMIN)
// ==========================================

// 🎯 Thêm món ăn mới: 
// Xác thực Admin -> Nhận file ảnh (bằng key 'image') -> Xử lý Controller
router.post("/", protectedRoute, isAdmin, uploadLocal.single('image'), createMeal);

// 🎯 Cập nhật món ăn: 
// Cấu trúc tương tự thêm mới để hỗ trợ Admin đổi ảnh khác
router.put("/:id", protectedRoute, isAdmin, uploadLocal.single('image'), updateMeal);

// Xóa món ăn
router.delete("/:id", protectedRoute, isAdmin, deleteMeal);

export default router;