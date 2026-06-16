import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/60 font-sans mt-auto relative overflow-hidden">
      {/* Hiệu ứng ánh sáng nền mờ ảo ở góc Footer */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-16">
          
          {/* ================= 1. BRAND SECTION ================= */}
          <div className="col-span-1 lg:col-span-4 lg:pr-8">
            <Link to="/" className="flex items-center space-x-3 w-max mb-6 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-green-600 rounded-[14px] flex items-center justify-center transition-all duration-300 group-hover:rotate-[12deg] group-hover:scale-105 shadow-lg shadow-emerald-500/20">
                <span className="text-white font-bold text-xl leading-none">N</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700">
                Nutri<span className="text-emerald-600">Food</span>
              </span>
            </Link>
            
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8 pr-4">
              Trợ lý sức khỏe thế hệ mới ứng dụng Trí tuệ Nhân tạo (Generative AI), giúp bạn cá nhân hóa lộ trình dinh dưỡng mỗi ngày một cách khoa học.
            </p>
            
            <div className="flex space-x-3">
              <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all duration-300">
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </button>
              <button className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300">
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
              </button>
            </div>
          </div>

          {/* ================= 2. CỘT HỆ THỐNG ================= */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-slate-900 font-bold mb-5 text-[13px] uppercase tracking-wider">Hệ thống</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/menu" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Thiết kế thực đơn
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Tra cứu dinh dưỡng
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Trợ lý AI tư vấn
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= 3. CỘT CÁ NHÂN ================= */}
          <div className="col-span-1 lg:col-span-2">
            <h4 className="text-slate-900 font-bold mb-5 text-[13px] uppercase tracking-wider">Cá nhân</h4>
            <ul className="space-y-3.5">
              <li>
                <Link to="/profile" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Hồ sơ sức khỏe
                </Link>
              </li>
              <li>
                <Link to="/meal-logs" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Nhật ký ăn uống
                </Link>
              </li>
              <li>
                <Link to="/favorites" className="text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors flex items-center gap-2.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-emerald-500 transition-colors"></span>
                  Món ăn yêu thích
                </Link>
              </li>
            </ul>
          </div>

          {/* ================= 4. KHỐI THÔNG TIN ĐỒ ÁN ================= */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 lg:pl-4">
            <h4 className="text-slate-900 font-bold mb-5 text-[13px] uppercase tracking-wider">Đồ án tốt nghiệp</h4>
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-5 border border-emerald-100/60 shadow-sm group hover:border-emerald-200 transition-all duration-300">
              
              {/* Bóng sáng trang trí */}
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-emerald-400/10 blur-2xl rounded-full transition-transform duration-700 group-hover:scale-150 pointer-events-none"></div>
              
              <div className="mb-4 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-emerald-500 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-[11px] font-bold text-emerald-700/80 uppercase tracking-widest">Sinh viên thực hiện</span>
                </div>
                <p className="text-slate-800 font-bold text-sm pl-6">Lê Hà Duy</p>
              </div>
              
              <div className="relative z-10 pt-3.5 border-t border-emerald-100/60">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-amber-500 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                  <span className="text-[11px] font-bold text-amber-700/80 uppercase tracking-widest">Giảng viên hướng dẫn</span>
                </div>
                <p className="text-slate-800 font-bold text-sm pl-6">TS. Đoàn Phước Miền</p>
              </div>
            </div>
          </div>

        </div>

        {/* ================= BOTTOM BAR ================= */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm font-medium text-center md:text-left">
            © {new Date().getFullYear()} NutriFood Project. Đồ án Tốt nghiệp ngành Công nghệ thông tin.
          </p>
          <div className="flex space-x-6">
            <Link to="#" className="text-slate-400 hover:text-emerald-600 text-xs font-bold tracking-wider transition-colors">ĐIỀU KHOẢN</Link>
            <Link to="#" className="text-slate-400 hover:text-emerald-600 text-xs font-bold tracking-wider transition-colors">BẢO MẬT</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;