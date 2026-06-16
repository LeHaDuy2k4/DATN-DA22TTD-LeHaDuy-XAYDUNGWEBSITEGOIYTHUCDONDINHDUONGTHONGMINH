import express from 'express';
import { 
    getAllCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    importCategories // 🎯 Bổ sung hàm này
} from '../controllers/categoriesControllers.js';
import { isAdmin, protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router(); 

// Lấy danh sách (Public)
router.get("/", getAllCategories);

// 🎯 BỔ SUNG: Import hàng loạt (Phải đặt trước /:id)
router.post("/import", protectedRoute, isAdmin, importCategories);

// Thêm, Sửa, Xóa (Yêu cầu Admin)
router.post("/", protectedRoute, isAdmin, createCategory);
router.put("/:id", protectedRoute, isAdmin, updateCategory);
router.delete("/:id", protectedRoute, isAdmin, deleteCategory);

export default router;