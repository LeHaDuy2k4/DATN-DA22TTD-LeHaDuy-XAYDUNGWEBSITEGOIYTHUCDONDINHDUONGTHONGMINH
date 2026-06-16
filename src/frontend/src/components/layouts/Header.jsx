import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; 
import { useAuthStore } from '../../stores/useAuthStores'; 
import axios from 'axios'; 
import NotificationBell from '../NotificationBell'; // 🎯 MỚI THÊM: Import cái chuông thông báo

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); 
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const navigate = useNavigate();
  const location = useLocation(); 
  const { user, signOut } = useAuthStore();

  // 1. LẤY DANH MỤC TỪ API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/categories');
        if (res.data) {
          const activeCategories = res.data.filter(cat => cat.isActive !== false);
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh mục thức ăn cho Header:", error);
        setCategories([
          { _id: 'cat1', name: 'Bữa sáng lành mạnh', isActive: true },
          { _id: 'cat2', name: 'Bữa trưa dinh dưỡng', isActive: true }
        ]);
      }
    };
    fetchCategories();
  }, []);

  // 2. HIỆU ỨNG SCROLL TỐI ƯU (KÍNH MỜ)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. ĐỒNG BỘ THANH TÌM KIẾM VỚI URL
  useEffect(() => {
    const currentParams = new URLSearchParams(location.search);
    const searchFromUrl = currentParams.get('search') || '';
    setSearchQuery(searchFromUrl); 
  }, [location.search]);

  // 4. LOGIC TÌM KIẾM
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    const currentParams = new URLSearchParams(location.search);

    if (trimmedQuery) {
      currentParams.set('search', trimmedQuery);
    } else {
      currentParams.delete('search');
    }

    navigate(`/menu?${currentParams.toString()}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/'); 
  };

  // Trích xuất Avatar nhanh
  const userInitial = (user?.displayName || user?.name || user?.email || 'U').charAt(0).toUpperCase();
  const shortName = (user?.displayName || user?.name || 'Tài khoản').split(' ')[0];

  return (
    <nav 
      className={`font-sans fixed w-full z-50 top-0 start-0 transition-all duration-400 ease-out ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 py-3' 
          : 'bg-white/60 md:bg-white/40 backdrop-blur-md py-4 md:py-5 border-b border-slate-100/50'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 lg:gap-8">
        
        {/* ================= LỚP 1: LOGO THƯƠNG HIỆU ================= */}
        <Link to="/" className="flex items-center space-x-3 group shrink-0">
          <div className="w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-600 rounded-[14px] flex items-center justify-center transition-all duration-300 group-hover:rotate-[15deg] group-hover:scale-105 shadow-lg shadow-green-500/30">
            <span className="text-white font-bold text-xl leading-none">N</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900 hidden sm:block transition-colors group-hover:text-green-700">
            Nutri<span className="text-green-600">Food</span>
          </span>
        </Link>

        {/* ================= LỚP 2: KHU VỰC TRUNG TÂM ================= */}
        <div className="flex-1 max-w-2xl flex items-center space-x-2 sm:space-x-6">
          
          {/* DROPDOWN THỰC ĐƠN */}
          <div 
            className="relative shrink-0 hidden md:block" 
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="text-sm font-semibold text-slate-600 hover:text-green-600 transition-colors flex items-center space-x-1.5 py-2">
              <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              <span>Thực đơn</span>
              <svg className={`w-3.5 h-3.5 transform transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-green-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 pt-4 w-64 z-50">
                <div className="bg-white/95 backdrop-blur-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden py-3 animate-slideUp origin-top">
                  <Link
                    to="/menu"
                    onClick={() => setIsDropdownOpen(false)}
                    className="flex items-center gap-3 px-6 py-3 text-sm font-bold text-green-600 hover:bg-green-50/80 transition-colors border-b border-slate-50/80 mx-2 rounded-xl"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></div>
                    Tất cả món ăn
                  </Link>

                  <div className="max-h-[50vh] overflow-y-auto custom-scrollbar mt-1 px-2 space-y-1">
                    {categories.length > 0 ? (
                      categories.map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/menu?category=${cat._id}`}
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <div className="px-5 py-3 text-sm text-slate-400 italic">Đang tải...</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* THANH TÌM KIẾM MƯỢT MÀ */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative group w-full">
            <div className="relative w-full flex items-center">
              <div className="absolute left-4 text-slate-400 group-focus-within:text-green-500 transition-colors pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm món ăn, nguyên liệu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100/60 text-slate-800 placeholder-slate-400 text-sm font-semibold pl-11 pr-4 py-2.5 rounded-full border border-slate-200/50 focus:outline-none focus:bg-white focus:border-green-400 focus:ring-4 focus:ring-green-500/10 transition-all duration-300 shadow-inner shadow-slate-100/50"
              />
            </div>
          </form>
        </div>

        {/* ================= LỚP 3: NHÓM NÚT HÀNH ĐỘNG ================= */}
        <div className="flex items-center shrink-0 ml-2">
          
          {user ? (
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Nút Admin tinh tế */}
              {user?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="hidden lg:flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-full hover:bg-indigo-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>Quản trị</span>
                </Link>
              )}

              {/* 🎯 CÁI CHUÔNG THÔNG BÁO TÍCH HỢP Ở ĐÂY */}
              <NotificationBell />

              {/* 🎯 MENU CÁ NHÂN GỘP (PILL DESIGN MƯỢT MÀ) */}
              <div 
                className="relative shrink-0"
                onMouseEnter={() => setIsProfileDropdownOpen(true)}
                onMouseLeave={() => setIsProfileDropdownOpen(false)}
              >
                <button className="flex items-center gap-2.5 p-1 pr-3 lg:pr-4 bg-white border border-slate-200/60 rounded-full hover:shadow-md hover:border-slate-300 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-500/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-50 text-green-700 flex items-center justify-center font-bold text-sm border border-green-100">
                    {userInitial}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 hidden sm:block">{shortName}</span>
                  <svg className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transform transition-transform duration-300 ${isProfileDropdownOpen ? 'rotate-180 text-green-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Cá Nhân */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 pt-4 w-60 z-50">
                    <div className="bg-white/95 backdrop-blur-2xl border border-slate-100 shadow-2xl shadow-slate-200/50 rounded-3xl overflow-hidden py-3 animate-slideUp origin-top-right">
                      
                      {/* Header Tóm tắt User */}
                      <div className="px-5 py-3 mx-2 mb-2 bg-slate-50/80 rounded-2xl border border-slate-100/50">
                        <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.displayName || user?.name || 'Tài khoản'}</p>
                        <p className="text-xs font-semibold text-slate-500 truncate mt-1">{user?.email}</p>
                      </div>

                      <div className="px-2 space-y-1">
                        <Link to="/profile" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-green-600 hover:bg-slate-50 rounded-xl transition-colors">
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          Hồ sơ của tôi
                        </Link>
                        
                        <Link to="/favorites" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl transition-colors">
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          Món yêu thích
                        </Link>
                        
                        <Link to="/meal-logs" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-colors">
                          <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                          Nhật ký thực đơn
                        </Link>

                        {/* 🎯 Nút Đăng xuất nổi bật */}
                        <div className="pt-2 mt-2 border-t border-slate-100">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                            <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Đăng xuất 
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link 
                to="/signin" 
                className="hidden sm:flex text-sm font-bold text-slate-600 hover:text-green-600 px-4 py-2.5 rounded-full hover:bg-slate-50 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link 
                to="/signup" 
                className="bg-slate-900 text-white text-sm font-bold px-5 sm:px-6 py-2.5 rounded-full hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:-translate-y-0.5"
              >
                Tham gia ngay
              </Link>
            </div>
          )}

        </div>
      </div>
      
      {/* CSS Hiệu ứng Dropdown & Thanh cuộn */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        .animate-slideUp { animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(12px) scale(0.96); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
      `}} />
    </nav>
  );
};

export default Header;