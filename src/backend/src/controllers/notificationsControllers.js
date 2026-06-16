import Notification from "../models/Notification.js";

// 1. Lấy danh sách thông báo của User đang đăng nhập
export const getUserNotifications = async (req, res) => {
    try {
        // Lấy thông báo, sắp xếp mới nhất lên đầu
        const notifications = await Notification.find({ userId: req.user._id })
                                              .sort({ createdAt: -1 });
        
        // Đếm số thông báo chưa đọc để hiển thị Badge đỏ
        const unreadCount = notifications.filter(n => !n.isRead).length;

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tải thông báo" });
    }
};

// 2. Đánh dấu 1 thông báo là đã đọc
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { new: true }
        );
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật trạng thái" });
    }
};

// 3. Đánh dấu TẤT CẢ là đã đọc (UX Bonus)
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ message: "Đã đọc tất cả" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi cập nhật" });
    }
};

// 4. Xóa 1 thông báo
export const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.status(200).json({ message: "Đã xóa thông báo" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa" });
    }
};