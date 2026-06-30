import axios from "axios";

// 🎯 ĐÃ SỬA: Ưu tiên lấy link từ biến môi trường Render, nếu không có mới dùng localhost
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// Tạo instance của axios
const api = axios.create({
    baseURL: BASE_URL,
});

// 🎯 BỔ SUNG: Axios Interceptor - Tự động đính kèm Token vào Header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('nutrifood_token');
        if (token) {
            // Tự động thêm Bearer token vào tất cả các request
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;