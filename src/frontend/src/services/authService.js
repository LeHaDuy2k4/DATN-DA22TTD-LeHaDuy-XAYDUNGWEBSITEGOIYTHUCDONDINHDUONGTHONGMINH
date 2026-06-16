import api from "@/lib/axios";

export const authService = {
    signUp: async (username, password, email, firstName, lastName) => {
        const res = await api.post(
            "auth/signup", 
            { username, password, email, firstName, lastName }, 
            { withCredentials: true } // Đảm bảo cookie/session được gửi đi kèm
        );
        return res.data;
    },

     signIn: async (username, password) => {
        const res = await api.post(
            "auth/signin", 
            { username, password }, 
            { withCredentials: true } // Đảm bảo cookie/session được gửi đi kèm
        );
        return res.data;
    },

   signOut: async () => {
        // Thêm đối tượng {} ở giữa để giữ vị trí tham số data body
        return api.post('auth/signout', {}, { withCredentials: true });
    },
};