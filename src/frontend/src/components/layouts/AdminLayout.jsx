import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStores';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  // Lấy tên hiển thị động từ DB (Ưu tiên displayName, nếu chưa có thì dùng username)
  const adminName = user?.displayName || user?.username || "Quản trị viên";

  // Cập nhật danh sách Menu chuẩn xác theo thiết kế CSDL MongoDB
  const menuItems = [
    { name: 'Tổng quan', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Danh mục (Categories)', path: '/admin/categories', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
    { name: 'Món ăn (Meals)', path: '/admin/meals', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'Nguyên liệu (Ingredients)', path: '/admin/ingredients', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
    { name: 'Nhật ký thực đơn (Logs)', path: '/admin/meal_logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { name: 'Món yêu thích (Favorites)', path: '/admin/favorite_meals', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { name: 'Người dùng (Users)', path: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-green-200 relative overflow-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0"></div>
      <div className="absolute left-64 top-0 z-0 h-[400px] w-[400px] rounded-full bg-green-400 opacity-20 blur-[120px] pointer-events-none"></div>

      {/* Sidebar - Cố định bên trái */}
      <aside className="w-64 bg-white/90 backdrop-blur-xl border-r border-slate-100 flex flex-col sticky top-0 h-screen transition-all duration-300 z-20 shadow-sm overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
            <span className="text-white font-black text-xl">N</span>
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 truncate">
            Admin<span className="!text-green-600">NFood</span>
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-300 ${
                  isActive 
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/20 translate-x-1' 
                    : 'text-slate-500 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                </svg>
                <span className="text-sm truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Nút Về Trang chủ */}
        <div className="p-4 border-t border-slate-100">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-slate-500 font-bold hover:text-green-600 hover:bg-green-50 rounded-2xl transition">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-sm truncate">Trở về NutriFood</span>
          </Link>
        </div>
      </aside>

      {/* Nội dung chính bên phải */}
      <main className="flex-1 flex flex-col z-10 relative">
        {/* Top Header */}
        <header className="h-20 bg-white/70 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-8 flex items-center justify-between">
          <h2 className="font-extrabold text-2xl text-slate-900">
            Quản lý <span className="text-green-600">Hệ Thống</span>
          </h2>
          
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              {/* Đổ dữ liệu Tên từ biến adminName ra đây */}
              <p className="text-sm font-bold text-slate-900 capitalize">{adminName}</p>
              {/* Đổ Role từ DB */}
              <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest">
                {user?.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
              </p>
            </div>
            
            {/* AVATAR CHUẨN (Viền tròn xanh như ảnh mẫu) */}
            <div className="w-12 h-12 rounded-full border-2 border-white shadow-[0_0_0_2px_#16a34a] p-0.5 shrink-0 flex items-center justify-center bg-white relative">
               <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=16a34a&color=fff&font-size=0.4&bold=true`} 
                alt="Admin Avatar" 
                className="w-full h-full rounded-full object-cover shadow-inner"
              />
              {/* Vệt sáng xanh phản quang phía sau (Glow effect) */}
              <div className="absolute inset-0 rounded-full shadow-[0_4px_15px_rgba(22,163,74,0.4)] -z-10"></div>
            </div>
          </div>
        </header>

        {/* NƠI RENDER NỘI DUNG TỪNG TRANG */}
        <div className="p-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-white min-h-[calc(100vh-10rem)]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;