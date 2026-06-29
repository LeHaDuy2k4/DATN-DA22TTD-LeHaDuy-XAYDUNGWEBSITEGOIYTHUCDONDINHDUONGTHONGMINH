import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import api from '@/lib/axios';
import { toast } from 'sonner'; 

const Meal_log = () => {
  const [mealLogs, setMealLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE CHO PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. GỌI API LẤY TOÀN BỘ NHẬT KÝ
  const fetchAllMealLogs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');

      const res = await api.get('/meal-logs/all', { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      
      if (res.data) {
        setMealLogs(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách nhật ký:", error);
      toast.error("Không thể lấy dữ liệu. Hãy kiểm tra lại phân quyền Admin!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMealLogs();
  }, []);

  // Đặt lại trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. XỬ LÝ XÓA BẢN GHI (Giao diện UI có thể được nâng cấp thành Modal nếu bạn muốn sau này)
  const handleDelete = async (id, foodName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhật ký món "${foodName}" khỏi hệ thống không?`)) {
      try {
        const token = localStorage.getItem('nutrifood_token');

        await api.delete(`/meal-logs/admin/${id}`, { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        
        setMealLogs(mealLogs.filter(log => log._id !== id));
        toast.success(`Đã xóa nhật ký món ${foodName}.`);
        
        // Cập nhật lại trang nếu trang hiện tại hết dữ liệu
        const newTotalPages = Math.ceil((mealLogs.length - 1) / itemsPerPage);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } catch (error) {
        console.error("Lỗi xóa nhật ký:", error);
        toast.error("Không thể xóa bản ghi này.");
      }
    }
  };

  // 3. XỬ LÝ HIỂN THỊ TÊN NGƯỜI DÙNG
  const renderUserInfo = (user) => {
    if (!user) return 'Người dùng ẩn danh';
    const name = user.displayName || user.name || (user.email ? user.email.split('@')[0] : null);
    if (name) return `bởi ${name}`;
    if (typeof user === 'string') return `ID: ${user.slice(-6)}`; 
    if (user._id) return `ID: ${user._id.toString().slice(-6)}`;
    return 'Người dùng ẩn danh';
  };

  // --- LOGIC TÌM KIẾM & LỌC DỮ LIỆU ---
  const filteredLogs = mealLogs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const matchFood = log.foodName?.toLowerCase().includes(searchLower);
    const matchType = log.mealType?.toLowerCase().includes(searchLower);
    const userName = (log.userId?.displayName || log.userId?.name || "").toLowerCase();
    const matchUser = userName.includes(searchLower);
    return matchFood || matchType || matchUser;
  });

  // --- LOGIC PHÂN TRANG ---
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentItems = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 🎯 KỸ THUẬT SLIDING WINDOW: Chỉ hiển thị tối đa 5 nút trang
  const getVisiblePages = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  // 🎯 FIX LỖI THỜI GIAN: Ép đúng Múi giờ Việt Nam (UTC+7) và định dạng hiển thị chuẩn
  const formatDate = (dateString) => {
    if (!dateString) return "Không rõ thời gian";
    const date = new Date(dateString);
    
    return date.toLocaleString('vi-VN', { 
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false // Ép dùng hệ 24h cho chuyên nghiệp
    });
  };

  // Render màu sắc (Badge)
  const renderMealTypeBadge = (type) => {
    switch(type?.toLowerCase()) {
      case 'bữa sáng': case 'sáng': return <span className="bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">Bữa Sáng</span>;
      case 'bữa trưa': case 'trưa': return <span className="bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">Bữa Trưa</span>;
      case 'bữa tối': case 'tối': return <span className="bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">Bữa Tối</span>;
      default: return <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider">{type || 'Khác'}</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn pb-10 font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhật ký thực đơn</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Giám sát dữ liệu tiêu thụ thực đơn của người dùng trên toàn hệ thống.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm món ăn, người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-72 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">STT</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Thông tin nhật ký</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Dinh dưỡng (Đã tiêu thụ)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Khẩu phần & Thời gian</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang đồng bộ dữ liệu nhật ký...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-slate-200 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      Không tìm thấy bản ghi nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((log, index) => (
                    <tr key={log._id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      {/* STT */}
                      <td className="px-6 py-4 text-sm font-semibold text-slate-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>

                      {/* Cột 1: Thông tin nhật ký */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold uppercase border border-green-200 shrink-0 shadow-sm">
                            {log.foodName?.charAt(0) || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]">{log.foodName}</p>
                            <div className="mt-1.5 flex items-center gap-2">
                              {renderMealTypeBadge(log.mealType)}
                              <span className="text-[11px] font-medium text-slate-500">
                                {renderUserInfo(log.userId)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Dinh dưỡng */}
                      <td className="px-6 py-4">
                        {log.nutritionSnapshot && log.nutritionSnapshot.calories ? (
                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold max-w-[200px]">
                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200" title="Calories">🔥 {log.nutritionSnapshot.calories} kcal</span>
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200" title="Protein">🥩 {log.nutritionSnapshot.protein || 0}g</span>
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md border border-yellow-200" title="Carbs">🌾 {log.nutritionSnapshot.carbs || 0}g</span>
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200" title="Fat">🥑 {log.nutritionSnapshot.fat || 0}g</span>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">Chưa cập nhật calo</span>
                        )}
                      </td>

                      {/* Cột 3: Khẩu phần & Thời gian */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-sm font-semibold text-slate-800">👤 {log.servingsConsumed} phần</span>
                          <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 w-max">
                            🕒 {formatDate(log.consumedAt)}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Hành động */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDelete(log._id, log.foodName)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Xóa bản ghi"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* --- THANH PHÂN TRANG (PAGINATION) MỚI TỐI ƯU --- */}
          {!isLoading && filteredLogs.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-semibold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredLogs.length)}</span> trong tổng số <span className="font-semibold text-slate-900">{filteredLogs.length}</span> bản ghi
              </span>
              
              <div className="flex items-center gap-1.5">
                {/* Nút Previous */}
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang trước"
                >
                  &lt;
                </button>
                
                {/* Các nút Số trang (Giới hạn tối đa 5 nút) */}
                {getVisiblePages().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => handlePageChange(pageNumber)}
                    className={`w-8 h-8 flex items-center justify-center text-sm font-semibold rounded-lg transition-colors ${
                      currentPage === pageNumber 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                {/* Dấu ba chấm nếu còn nhiều trang phía sau */}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                   <span className="w-8 h-8 flex items-center justify-center text-slate-400 font-medium">...</span>
                )}

                {/* Nút Next */}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Trang sau"
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default Meal_log;