import { create } from 'zustand';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import { jwtDecode } from 'jwt-decode'; 

// 🎯 Hàm lấy TOÀN BỘ thông tin user từ token lưu trong localStorage
const getUserFromStorage = () => {
    const token = localStorage.getItem('nutrifood_token');
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        // Trả về toàn bộ object (bao gồm _id, role, username...) thay vì chỉ chuỗi ký tự
        return decoded; 
    } catch (error) {
        console.error("Token lưu trữ không hợp lệ hoặc đã hết hạn:", error);
        localStorage.removeItem('nutrifood_token');
        return null;
    }
};

export const useAuthStore = create((set, get) => ({
    // =================================================================
    // TRẠNG THÁI MẶC ĐỊNH
    // =================================================================
    accessToken: localStorage.getItem('nutrifood_token') || null,
    
    // 🎯 user bây giờ sẽ là một Object: { _id: "...", role: "...", ... }
    user: getUserFromStorage(), 
    loading: false,

    // Hàm dọn dẹp bộ nhớ (Dùng khi đăng xuất)
    clearState: () => {
        set({ accessToken: null, user: null, loading: false });
        localStorage.removeItem('nutrifood_token'); // Xóa token khỏi ổ cứng trình duyệt
    },

    // =================================================================
    // CÁC CHỨC NĂNG LOGIC (ACTIONS)
    // =================================================================

    // 1. Chức năng Đăng ký tài khoản
    signUp: async (username, password, email, firstName, lastName) => {
        try {
            set({ loading: true });

            // Gọi API tạo tài khoản từ folder services
            await authService.signUp(username, password, email, firstName, lastName);
            
            toast.success("Đăng ký thành công! NutriFood chào mừng bạn."); 
            
        } catch (error) {
            console.error("Lỗi từ Backend khi đăng ký:", error);
            const errorMessage = error.response?.data?.message || "Đăng ký không thành công. Vui lòng thử lại!";
            toast.error(errorMessage);
            throw error; 
        } finally {
            set({ loading: false });
        }
    },

    // 2. Chức năng Đăng nhập
    signIn: async (username, password) => {
        try {
            set({ loading: true });

            // Gọi API đăng nhập, Backend trả về: { message: "...", accessToken: "..." }
            const data = await authService.signIn(username, password);
            
            if (data && data.accessToken) {
                // 🎯 GIẢI MÃ TOKEN ĐỂ LẤY TOÀN BỘ THÔNG TIN
                const decoded = jwtDecode(data.accessToken);

                // Cập nhật Token và toàn bộ Object User vào Zustand State
                set({ 
                    accessToken: data.accessToken, 
                    user: decoded // 🎯 Lưu nguyên Object để gọi được currentUser._id bên UI
                });

                // Lưu token cố định vào localStorage để lưu phiên làm việc
                localStorage.setItem('nutrifood_token', data.accessToken);

                // Hiển thị câu chào thông minh theo phân quyền
                if (decoded.role === 'admin') {
                    toast.success("Chào mừng Quản trị viên quay trở lại!");
                } else {
                    toast.success("Đăng nhập thành công!");
                }
                
                return data; // Trả dữ liệu về để trang cha thực hiện lệnh navigate('/')
            }

        } catch (error) {
            console.error("Lỗi đăng nhập hệ thống:", error);
            const errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại!";
            toast.error(errorMessage);
            throw error; 
        } finally {
            set({ loading: false });
        }
    },

    // 3. Chức năng Đăng xuất
    signOut: async () => {
        try {
            // Xóa sạch trạng thái ở Frontend trước để giao diện hoán đổi lập tức
            get().clearState();

            // Gọi API gửi cookie/session xuống Backend để hủy token
            await authService.signOut();

            toast.success("Đăng xuất thành công! Hẹn gặp lại bạn.");
        } catch (error) {
            console.error("Lỗi xảy ra khi đăng xuất:", error);
            // Kể cả khi API Backend lỗi, Frontend vẫn phải dọn sạch bộ nhớ để đảm bảo an toàn
            get().clearState();
            toast.error("Phiên đăng nhập đã được hủy trên trình duyệt.");
        } 
    },
}));