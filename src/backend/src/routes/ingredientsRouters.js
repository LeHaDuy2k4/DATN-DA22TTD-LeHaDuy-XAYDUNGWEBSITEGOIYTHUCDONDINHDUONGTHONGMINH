import express from 'express';
import { 
    getAllIngredients, 
    createIngredient, 
    updateIngredient, 
    deleteIngredient,
    importIngredients // 🎯 Bổ sung hàm này
} from '../controllers/ingredientsControllers.js';
import { isAdmin, protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router(); 

// Lấy danh sách nguyên liệu (Public)
router.get("/", getAllIngredients);

// 🎯 BỔ SUNG: Import hàng loạt (Phải đặt trước /:id)
router.post("/import", protectedRoute, isAdmin, importIngredients);

// Thêm, Sửa, Xóa nguyên liệu (Yêu cầu Admin)
router.post("/", protectedRoute, isAdmin, createIngredient);
router.put("/:id", protectedRoute, isAdmin, updateIngredient);
router.delete("/:id", protectedRoute, isAdmin, deleteIngredient);

export default router;