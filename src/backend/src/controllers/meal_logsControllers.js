import MealLog from "../models/Meal_log.js";

// ==========================================
// CÁC API DÀNH CHO NGƯỜI DÙNG (USER)
// ==========================================

// 1. Thêm nhật ký bữa ăn
export const createMealLog = async (req, res) => {
    try {
        const { mealId, foodName, mealType, servingsConsumed, consumedAt, notes, nutritionSnapshot } = req.body;
        const userId = req.user._id || req.user.id;

        const newLog = new MealLog({
            userId,
            mealId: mealId || null, 
            foodName,
            mealType,
            servingsConsumed,
            consumedAt: consumedAt ? new Date(consumedAt) : new Date(), // Đảm bảo format chuẩn ISO
            notes,
            nutritionSnapshot: nutritionSnapshot || undefined 
        });

        const savedLog = await newLog.save();
        res.status(201).json({ success: true, message: "Đã ghi nhận bữa ăn", log: savedLog });
    } catch (error) {
        console.error("🔥 Lỗi createMealLog:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi tạo nhật ký." });
    }
};

// 2. Lấy nhật ký ăn uống theo ngày cụ thể (Báo cáo hàng ngày)
export const getDailyMealLogs = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const targetDate = req.query.date ? new Date(req.query.date) : new Date();

        // Tạo khoảng thời gian từ 00:00:00 đến 23:59:59 của ngày đó
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        const logs = await MealLog.find({
            userId,
            consumedAt: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ consumedAt: 1 });

        // Tính tổng dinh dưỡng trong ngày để Frontend vẽ biểu đồ
        let dailyTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
        logs.forEach(log => {
            if (log.nutritionSnapshot) {
                dailyTotals.calories += log.nutritionSnapshot.calories || 0;
                dailyTotals.protein += log.nutritionSnapshot.protein || 0;
                dailyTotals.carbs += log.nutritionSnapshot.carbs || 0;
                dailyTotals.fat += log.nutritionSnapshot.fat || 0;
            }
        });

        // Làm tròn số tránh số thập phân quá dài
        dailyTotals = {
            calories: Math.round(dailyTotals.calories),
            protein: parseFloat(dailyTotals.protein.toFixed(1)),
            carbs: parseFloat(dailyTotals.carbs.toFixed(1)),
            fat: parseFloat(dailyTotals.fat.toFixed(1))
        };

        res.status(200).json({
            success: true,
            date: startOfDay,
            logs,
            dailyTotals
        });
    } catch (error) {
        console.error("Lỗi lấy nhật ký hàng ngày:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

// 3. Xóa một bản ghi nhật ký
export const deleteMealLog = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id || req.user.id;

        const deletedLog = await MealLog.findOneAndDelete({ _id: id, userId });

        if (!deletedLog) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bản ghi hoặc không có quyền xóa" });
        }

        res.status(200).json({ success: true, message: "Đã xóa nhật ký bữa ăn" });
    } catch (error) {
        console.error("Lỗi xóa nhật ký:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống" });
    }
};

// 4. Lấy TOÀN BỘ nhật ký ăn uống của User
export const getMyMealLogs = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const myLogs = await MealLog.find({ userId: userId }).sort({ consumedAt: -1 });

        res.status(200).json({ success: true, data: myLogs });
    } catch (error) {
        console.error("Lỗi khi gọi getMyMealLogs:", error);
        res.status(500).json({ success: false, message: "Lỗi hệ thống khi lấy tổng nhật ký ăn uống" });
    }
};

// ==========================================
// CÁC API DÀNH RIÊNG CHO QUẢN TRỊ VIÊN (ADMIN)
// ==========================================

// 5. Lấy toàn bộ nhật ký hệ thống (Admin)
export const getAllMealLogsForAdmin = async (req, res) => {
    try {
        const logs = await MealLog.find()
            .populate('userId', 'name displayName email')
            .sort({ consumedAt: -1 }); 
            
        res.status(200).json(logs); // Trả về mảng trực tiếp cho Frontend trang Admin xử lý
    } catch (error) {
        console.error("Lỗi lấy toàn bộ nhật ký cho Admin:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 6. Hàm xóa đặc quyền cho Admin
export const adminDeleteMealLog = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedLog = await MealLog.findByIdAndDelete(id);

        if (!deletedLog) {
            return res.status(404).json({ message: "Không tìm thấy bản ghi nhật ký" });
        }

        res.status(200).json({ message: "Admin đã xóa bản ghi nhật ký thành công" });
    } catch (error) {
        console.error("Lỗi Admin xóa nhật ký:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};