import React from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Định nghĩa Schema kiểm tra dữ liệu bằng Zod
const signInSchema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tên đăng nhập'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu')
});

// Nhận props điều khiển từ trang cha SignInPage.jsx
export function SigninForm({ signInFn, isLoading }) {
  // 2. Khởi tạo Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signInSchema)
  });

  // 3. Hàm xử lý gửi form (Đã nhận dữ liệu sạch từ Zod)
  const onSubmit = async (data) => {
    // Gọi hàm đăng nhập được đẩy từ trang cha xuống
    await signInFn(data.username, data.password);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans text-slate-800 selection:bg-green-200 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-green-400 opacity-20 blur-[100px] pointer-events-none"></div>

      {/* Main Login Card - Glassmorphism style */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100">
        
        {/* Nút quay về trang chủ sử dụng Link */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-green-600 transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại Trang chủ
          </Link>
        </div>

        {/* Tiêu đề */}
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl md:text-4xl font-extrabold !text-slate-900 mb-3">
            Đăng Nhập
          </h2>
          <p className="text-slate-600 text-base leading-relaxed">
            Chào mừng bạn quay lại với hệ thống Nutri<span className="!text-green-600 font-bold">Food</span>.
          </p>
        </div>

        {/* Form đăng nhập - Gọi handleSubmit của react-hook-form */}
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          
          {/* Nhập Tên đăng nhập */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="username">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              {...register("username")}
              className={`block w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition duration-300 ${errors.username ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`}
              placeholder="ví dụ: haduy2026"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.username.message}</p>}
          </div>
          
          {/* Nhập Mật khẩu */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              className={`block w-full px-4 py-3.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition duration-300 ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`}
              placeholder="Nhập mật khẩu..."
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
          </div>

          {/* Ghi nhớ tôi */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300 rounded cursor-pointer transition"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
                Ghi nhớ tôi
              </label>
            </div>
          </div>

          {/* Nút Submit lắng nghe trạng thái isLoading từ Zustand */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-4 px-4 rounded-xl text-white font-bold text-lg bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 shadow-[0_4px_14px_0_rgba(22,163,74,0.39)] hover:shadow-[0_6px_20px_rgba(22,163,74,0.23)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng Nhập'}
            </button>
          </div>
        </form>
        
        {/* Nút chuyển hướng sang Đăng ký sử dụng Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600">
            Bạn chưa có tài khoản?{' '}
            <Link 
              to="/signup" 
              className="font-bold !text-green-600 hover:text-green-500 transition duration-300"
            >
              Tạo tài khoản mới
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}