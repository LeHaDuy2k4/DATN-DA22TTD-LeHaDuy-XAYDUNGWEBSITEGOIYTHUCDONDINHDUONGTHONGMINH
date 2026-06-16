import express from "express";
import { generateMealPlan, getCurrentMealPlan } from "../controllers/mealplansControllers.js";
// Đã sửa import từ verifyToken thành protectedRoute cho khớp với hệ thống của bạn
import { protectedRoute } from "../middlewares/authMiddleware.js"; 

const router = express.Router();

/**
 * 🔐 TẤT CẢ CÁC ĐƯỜNG DẪN DƯỚI ĐÂY ĐỀU YÊU CẦU ĐIỀU KIỆN TIÊN QUYẾT LÀ ĐĂNG NHẬP
 */

// Endpoint tiếp nhận yêu cầu phân tích dữ liệu thể chất và sinh thực đơn tuần mới bằng AI / Fallback
router.post("/generate", protectedRoute, generateMealPlan);

// Endpoint phục vụ dữ liệu trực quan cho giao diện Lịch tuần trên giao diện người dùng
router.get("/current", protectedRoute, getCurrentMealPlan);

export default router;