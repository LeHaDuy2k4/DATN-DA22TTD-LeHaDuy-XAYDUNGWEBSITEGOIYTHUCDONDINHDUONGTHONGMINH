import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import axios from 'axios';
import { toast } from 'sonner'; 

const Favorite_meal = () => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE CHO PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Số bản ghi mỗi trang

  // 1. GỌI API LẤY TOÀN BỘ LƯỢT THẢ TIM (DÀNH CHO ADMIN)
  const fetchAllFavorites = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');

      const res = await axios.get('http://localhost:5001/api/favorites/all', { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      
      if (res.data) {
        setFavorites(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách yêu thích:", error);
      toast.error("Không thể lấy dữ liệu. Hãy kiểm tra lại phân quyền Admin!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFavorites();
  }, []);

  // Đặt lại trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. XỬ LÝ XÓA BẢN GHI (ADMIN HỦY TIM)
  const handleDelete = async (id, userName, mealName) => {
    if (window.confirm(`Bạn có chắc muốn gỡ bỏ lượt thả tim của "${userName}" cho món "${mealName}" không?`)) {
      try {
        const token = localStorage.getItem('nutrifood_token');

        await axios.delete(`http://localhost:5001/api/favorites/admin/${id}`, { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        
        setFavorites(favorites.filter(fav => fav._id !== id));
        toast.success(`Đã gỡ lượt yêu thích món ${mealName}.`);
      } catch (error) {
        console.error("Lỗi xóa lượt yêu thích:", error);
        toast.error("Không thể xóa bản ghi này.");
      }
    }
  };

  // 🎯 3. XỬ LÝ HIỂN THỊ TÊN NGƯỜI DÙNG (Ưu tiên Display Name)
  const renderUserInfo = (user) => {
    if (!user) return 'Người dùng ẩn danh';
    // Ưu tiên hiển thị displayName -> name -> phần trước @ của email
    const name = user.displayName || user.name || (user.email ? user.email.split('@')[0] : null);
    return name || `User: ${user._id?.slice(-6) || 'Unknown'}`;
  };

  const renderMealInfo = (meal) => {
    if (!meal) return 'Món ăn đã bị xóa';
    return meal.name || 'Món ăn không xác định';
  };

  // --- LOGIC TÌM KIẾM & PHÂN TRANG ---
  const filteredFavorites = favorites.filter(fav => {
    const searchLower = searchTerm.toLowerCase();
    
    // 🎯 Tìm kiếm cũng phải tìm theo Display Name
    const userName = (fav.userId?.displayName || fav.userId?.name || "").toLowerCase();
    const mealName = (fav.mealId?.name || "").toLowerCase();
    
    return userName.includes(searchLower) || mealName.includes(searchLower);
  });

  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
  
  const currentItems = filteredFavorites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Món ăn Yêu thích</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý và theo dõi các món ăn được người dùng thả tim nhiều nhất.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm món ăn, người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all w-72 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider w-16">STT</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Người thả tim</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Món ăn yêu thích</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Thời gian lưu</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải dữ liệu lượt thích...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      Không tìm thấy lượt yêu thích nào.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((fav, index) => {
                    const displayName = renderUserInfo(fav.userId);
                    
                    return (
                      <tr key={fav._id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        <td className="px-6 py-4 text-sm font-bold text-slate-400">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>

                        {/* 🎯 Cột Người dùng đã hiển thị Display Name và Avatar chữ cái tương ứng */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-black shadow-sm border border-green-200 shrink-0">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{displayName}</p>
                              <span className="text-[11px] font-medium text-slate-500">
                                {fav.userId?.email || `ID: ${fav.userId?._id?.slice(-5) || 'N/A'}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 shrink-0">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M11.999 21.054l-8.212-8.156A6.292 6.292 0 013 8.441a6.3 6.3 0 016.3-6.3c1.928 0 3.655.859 4.699 2.215A6.3 6.3 0 0118.698 2.14a6.3 6.3 0 016.3 6.3c0 1.67-.665 3.18-1.745 4.316l-11.254 8.3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <p className="font-bold text-slate-800 text-base">{renderMealInfo(fav.mealId)}</p>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                            {formatDate(fav.createdAt)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleDelete(fav._id, displayName, renderMealInfo(fav.mealId))}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Xóa lượt thích"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Thanh phân trang */}
          {!isLoading && filteredFavorites.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredFavorites.length)}</span> trong <span className="font-bold text-slate-900">{filteredFavorites.length}</span> lượt
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg transition-colors ${
                        currentPage === index + 1 ? 'bg-rose-500 text-white shadow-sm border-rose-600' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default Favorite_meal;