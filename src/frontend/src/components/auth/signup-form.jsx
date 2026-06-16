import React from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

// 1. Định nghĩa Schema kiểm tra dữ liệu bằng Zod
const signUpSchema = z.object({
  firstName: z.string().min(1, 'Họ bắt buộc phải nhập'),
  lastName: z.string().min(1, 'Tên bắt buộc phải nhập'),
  username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
});

// Nhận props từ trang cha truyền vào
export function SignupForm({ signUpFn, isLoading }) {
  // 2. Khởi tạo Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(signUpSchema)
  });

  // 3. Hàm xử lý gửi form (Đã nhận dữ liệu sạch từ Zod)
  const onSubmit = async (data) => {
    // Gọi hàm đăng ký được truyền từ trang cha xuống
    await signUpFn(data.username, data.password, data.email, data.firstName, data.lastName);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans text-slate-800 selection:bg-green-200 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Background Decorators */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-400 opacity-15 blur-[120px] pointer-events-none"></div>

      {/* Main Register Card */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl border border-slate-100">
        
        <div className="mb-6 text-center">
          <Link 
            to="/" 
            className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-green-600 transition duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Về Trang chủ
          </Link>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold !text-slate-900 mb-3 tracking-tight">
            Tạo Tài Khoản <span className="!text-green-600">NutriFood</span>
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            Đăng ký nhanh chóng để bắt đầu hành trình dinh dưỡng cá nhân hóa.
          </p>
        </div>

        {/* Bọc form bằng handleSubmit của react-hook-form */}
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="space-y-4">
            
            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên đăng nhập</label>
              <input 
                type="text" 
                {...register("username")} 
                className={`block w-full px-4 py-3 bg-white/50 border rounded-xl focus:ring-2 outline-none transition text-sm ${errors.username ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`} 
                placeholder="haduy2026" 
              />
              {errors.username && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.username.message}</p>}
            </div>

            {/* Họ và Tên (Grid 2 cột) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Họ</label>
                <input 
                  type="text" 
                  {...register("firstName")} 
                  className={`block w-full px-4 py-3 bg-white/50 border rounded-xl focus:ring-2 outline-none transition text-sm ${errors.firstName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`} 
                  placeholder="Lê" 
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên</label>
                <input 
                  type="text" 
                  {...register("lastName")} 
                  className={`block w-full px-4 py-3 bg-white/50 border rounded-xl focus:ring-2 outline-none transition text-sm ${errors.lastName ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`} 
                  placeholder="Hà Duy" 
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
              <input 
                type="email" 
                {...register("email")} 
                className={`block w-full px-4 py-3 bg-white/50 border rounded-xl focus:ring-2 outline-none transition text-sm ${errors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`} 
                placeholder="duy.le@example.com" 
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mật khẩu</label>
              <input 
                type="password" 
                {...register("password")} 
                className={`block w-full px-4 py-3 bg-white/50 border rounded-xl focus:ring-2 outline-none transition text-sm ${errors.password ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-green-500'}`} 
                placeholder="••••••••" 
              />
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

          </div>

          {/* Nút Submit lắng nghe isLoading từ Zustand */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading} 
              className="w-full py-3.5 rounded-xl text-white font-bold text-base bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-[0_8px_20px_rgba(22,163,74,0.25)] hover:shadow-[0_10px_25px_rgba(22,163,74,0.35)] hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {isLoading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
            </button>
          </div>

        </form>
        
        {/* Điều hướng về Login */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            Đã có tài khoản?{' '}
            <Link 
              to="/signin" 
              className="font-bold !text-green-600 hover:text-green-700 transition duration-300 underline underline-offset-4"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}