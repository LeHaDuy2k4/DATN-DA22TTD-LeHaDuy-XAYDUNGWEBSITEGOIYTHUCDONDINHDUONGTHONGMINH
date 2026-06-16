import express from 'express';
import { generateDailyPlan } from '../controllers/aiControllers.js';
import { protectedRoute } from '../middlewares/authMiddleware.js';

const router = express.Router(); 

// API sinh thực đơn cá nhân hóa (Chỉ user đăng nhập mới được dùng)
router.post("/generate-plan", protectedRoute, generateDailyPlan);

export default router;