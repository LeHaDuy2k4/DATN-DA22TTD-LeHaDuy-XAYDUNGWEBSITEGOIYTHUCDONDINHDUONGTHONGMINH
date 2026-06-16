import axios from "axios";

// Tạo instance của axios
const api = axios.create({
    baseURL: import.meta.env.MODE === 'development' ? "http://localhost:5001/api" : "/api",
    withCredentials: true,
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