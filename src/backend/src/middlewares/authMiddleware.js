import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Xác thực người dùng (Authentication)
export const protectedRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Vui lòng đăng nhập để tiếp tục." });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
            }

            try {
                // 🎯 FIX CHÍNH LÀ Ở ĐÂY: Hỗ trợ đọc linh hoạt cả Token phiên bản cũ (userId) và mới (_id)
                const targetId = decoded._id || decoded.userId;

                const user = await User.findById(targetId).select('-hashedPassword');

                if (!user) {
                    return res.status(404).json({ message: "Tài khoản không tồn tại." });
                }

                req.user = user; // Gán đối tượng user vào req để middleware isAdmin sử dụng
                next();
            } catch (dbError) {
                console.error('Lỗi Database:', dbError);
                return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
            }
        });
    } catch (error) {
        console.error('Lỗi Middleware:', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

// 2. Kiểm tra quyền Admin (Authorization)
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Chưa xác thực người dùng!" });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Bạn không có quyền truy cập chức năng này!" });
    }

    next();
};