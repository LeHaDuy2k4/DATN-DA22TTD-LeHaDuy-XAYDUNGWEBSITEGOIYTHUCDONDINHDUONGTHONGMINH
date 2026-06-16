import bcrypt from 'bcrypt';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m'; // Thường là 15 - 30 phút
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 ngày

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body; 

        // 1. Kiểm tra tính toàn vẹn của dữ liệu đầu vào
        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "Vui lòng điền đầy đủ thông tin bắt buộc" });
        }

        // 2. Kiểm tra trùng lặp Username hoặc Email 
        const duplicate = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (duplicate) {
            if (duplicate.username === username) {
                return res.status(409).json({ message: "Username này đã tồn tại trên hệ thống" });
            }
            if (duplicate.email === email) {
                return res.status(409).json({ message: "Email này đã được sử dụng" });
            }
        }

        // 3. Mã hóa password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Tạo User mới và lưu vào MongoDB
        await User.create({
            username,
            email,
            displayName: `${firstName} ${lastName}`, 
            hashedPassword, 
        });

        // 5. Trả về phản hồi thành công (Sử dụng 201 Created thay vì 204 để trả được JSON)
        return res.status(201).json({ message: "Đăng ký tài khoản thành công!" });

    } catch (error) {
        console.error("Lỗi khi gọi signUp:", error);
        return res.status(500).json({ message: "Lỗi hệ thống máy chủ" });
    }
};

export const signIn = async (req, res) => {
    try {
        // Lấy inputs
        const {username, password} = req.body;

        if(!username || !password){
            return res.status(400).json({message:"Thiếu username hoặc password!"});
        }

        // Lấy hashPassword trong db để so với password input
        const user = await User.findOne({username});

        if(!user){
            return res.status(401).json({message:"Username hoặc mật khẩu không chính xác!"});
        }

        // Kiểm tra password
        const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

        if(!passwordCorrect){
             return res.status(401).json({message:"Username hoặc mật khẩu không chính xác!"});
        }

        // 🎯 ĐÃ SỬA: Đóng gói đầy đủ _id, role, username và displayName vào JWT Token
        const accessToken = jwt.sign(
            { 
                _id: user._id, 
                role: user.role || 'user',
                username: user.username,
                displayName: user.displayName
            }, 
            process.env.ACCESS_TOKEN_SECRET, 
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        // Tạo refresh token
        const refreshToken = crypto.randomBytes(64).toString("hex");

        // Tạo session mới để lưu refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expireAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });
        
        // Trả refresh token về trong cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: REFRESH_TOKEN_TTL,
        });
        
        // Trả access token về trong res
        return res.status(200).json({message: `User ${user.displayName} đã đăng nhập thành công!`, accessToken});
    } catch (error) {
        console.error("Lỗi khi gọi signIn:", error);
        return res.status(500).json({ message: "Lỗi hệ thống máy chủ" });
    }
};

export const signOut = async(req, res) =>{
  try {
    // Lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;

    if(token){
        // Xóa refresh token trong Session
        await Session.deleteOne({refreshToken: token});
        // Xóa cookie
        res.clearCookie("refreshToken");
    }
    return res.sendStatus(204);
 
  } catch (error) {
     console.error("Lỗi khi gọi signOut :", error);
     return res.status(500).json({ message: "Lỗi hệ thống máy chủ" });
  }
};