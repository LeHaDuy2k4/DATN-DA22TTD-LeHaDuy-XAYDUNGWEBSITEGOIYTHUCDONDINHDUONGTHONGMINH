// 🎯 BẮT BUỘC Ở DÒNG 1: Load file .env trước khi bất kỳ file nào khác được import
import 'dotenv/config'; 

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'; 
import path from 'path'; // 🎯 MỚI THÊM: Import thư viện xử lý đường dẫn

// Import cấu hình cơ sở dữ liệu
import { connectDB } from './config/db.js';

// Import Middleware xác thực và phân quyền
import { protectedRoute, isAdmin } from './middlewares/authMiddleware.js';

// Import các file định tuyến (Routes)
import authRoute from './routes/authsRouters.js';
import userRoute from './routes/usersRouters.js';
import categoryRoute from './routes/categoriesRouters.js';
import ingredientRoute from './routes/ingredientsRouters.js';
import mealRoute from './routes/mealsRouters.js';
import favoriteRoute from './routes/favorite_mealsRouters.js';
import mealLogRoute from './routes/meal_logsRouters.js';
import aiRoute from './routes/aiRouters.js';
import mealplanRoute from './routes/mealplansRouters.js';
import chatRoute from './routes/chatRouters.js'; // 🎯 MỚI THÊM: Import Router của Trợ lý ảo Chatbot
import notificationRoute from './routes/notificationRouters.js'; // 🎯 MỚI THÊM: Import Router của Thông báo (Notification)

const PORT = process.env.PORT || 5001;
const app = express();

// ==========================================
// 1. CẤU HÌNH CÁC MIDDLEWARES HỆ THỐNG
// ==========================================

// Cấu hình CORS (Mở cửa kết nối an toàn cho Frontend React Vite)
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,               // BẮT BUỘC: Cho phép Frontend gửi kèm Token/Cookie sang
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Ép kiểu dữ liệu request body sang JSON (Giới hạn dung lượng bảo vệ server)
app.use(express.json({ limit: "10mb" }));

// Đọc dữ liệu Cookie từ request gửi lên
app.use(cookieParser());

// 🎯 MỚI THÊM: Cấp quyền truy cập công khai cho thư mục chứa ảnh upload
// Đảm bảo Frontend gọi http://localhost:5001/uploads/... sẽ tải được ảnh
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));


// ==========================================
// 2. ĐỊNH TUYẾN CÁC API (ROUTES)
// ==========================================

// 🟢 Nhóm 1: Public Routes (Không cần đăng nhập)
app.use("/api/auth", authRoute);

// 🔵 Nhóm 2: Core Data Routes (Tự quản lý phân quyền bên trong Route)
app.use("/api/categories", categoryRoute);
app.use("/api/ingredients", ingredientRoute);
app.use("/api/meals", mealRoute);

// 🟠 Nhóm 3: User Routes (Bắt buộc phải đăng nhập hệ thống)
app.use("/api/users", protectedRoute, userRoute);

// 🟣 Nhóm 4: Personalization & Logging (Đã có middleware bảo vệ bên trong file router)
app.use("/api/favorites", favoriteRoute);
app.use("/api/meal-logs", mealLogRoute);
app.use("/api/notifications", notificationRoute); // 🎯 MỚI THÊM: Kích hoạt định tuyến cho Thông báo (Notifications)

// 🔴 Nhóm 5: AI Integration, Lộ trình & Chatbot LLM
app.use('/api/ai', aiRoute);
app.use('/api/meal-plans', mealplanRoute); 
app.use('/api/chat', chatRoute); // 🎯 MỚI THÊM: Kích hoạt định tuyến cho Trợ lý ảo Chatbot


// ==========================================
// 3. MIDDLEWARE XỬ LÝ LỖI TOÀN CỤC (GLOBAL ERROR HANDLER)
// ==========================================
// Bắt các lỗi không mong muốn để server không bị sập (crash)
app.use((err, req, res, next) => {
    console.error("🔥 Lỗi hệ thống Server:", err.message);
    res.status(500).json({ 
        message: "Hệ thống đang gặp sự cố, vui lòng thử lại sau!",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ==========================================
// 4. KHỔI CHẠY HỆ THỐNG CƠ SỞ DỮ LIỆU & SERVER
// ==========================================
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 Server NutriFood đang chạy cực kỳ ổn định trên cổng ${PORT}`);
            console.log(`🧠 Gemini AI Configured: ${process.env.GEMINI_API_KEY ? "SUCCESS ✅" : "FAILED ❌ (Missing API Key)"}`);
        });
    })
    .catch((error) => {
        console.error("❌ Không thể kết nối cơ sở dữ liệu MongoDB. Server không khởi động.", error);
        process.exit(1); // Tắt tiến trình hệ thống nếu kết nối DB thất bại
    });