import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import api from '@/lib/axios';
import { toast } from 'sonner'; 

const Category = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE CHO PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Số danh mục mỗi trang

  // State cho Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: 'Loại món ăn', 
    description: '',
    isActive: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. GỌI API LẤY DỮ LIỆU TỪ MONGODB
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');

      const res = await api.get('/categories', { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      
      if (res.data) {
        setCategories(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách danh mục:", error);
      toast.error("Không thể lấy dữ liệu danh mục. Hãy kiểm tra Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Đặt lại trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. XỬ LÝ MỞ MODAL THÊM / SỬA
  const openModal = (category = null) => {
    if (category) {
      setEditId(category._id);
      setFormData({ 
        name: category.name, 
        type: category.type || 'Loại món ăn',
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    } else {
      setEditId(null);
      setFormData({ name: '', type: 'Loại món ăn', description: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ name: '', type: 'Loại món ăn', description: '', isActive: true });
  };

  // 3. XỬ LÝ LƯU (THÊM MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return toast.warning("Tên danh mục không được để trống!");
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('nutrifood_token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      };

      if (editId) {
        // Gọi API Cập nhật (PUT)
        const res = await api.put(`/categories/${editId}`, formData, config);
        setCategories(categories.map(cat => cat._id === editId ? (res.data.category || res.data) : cat));
        toast.success("Cập nhật danh mục thành công!");
      } else {
        // Gọi API Thêm mới (POST)
        const res = await api.post('/categories', formData, config);
        setCategories([res.data.category || res.data, ...categories]);
        toast.success("Thêm danh mục mới thành công!");
      }
      closeModal();
    } catch (error) {
      console.error("Lỗi lưu danh mục:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu danh mục.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. XỬ LÝ XÓA
  const handleDelete = async (id, name) => {
    if (window.confirm(`HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa danh mục "${name}" không?`)) {
      try {
        const token = localStorage.getItem('nutrifood_token');

        await api.delete(`/categories/${id}`, { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        
        setCategories(categories.filter(cat => cat._id !== id));
        toast.success(`Đã xóa danh mục ${name}.`);
      } catch (error) {
        console.error("Lỗi xóa danh mục:", error);
        toast.error("Không thể xóa danh mục này.");
      }
    }
  };

  // --- LOGIC PHÂN TRANG ---
  const filteredCategories = categories.filter(cat => 
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  
  const currentItems = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn font-sans">
        
        {/* Header của trang quản lý */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* 🎯 Tiêu đề */}
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Danh mục món ăn</h1>
            <p className="text-slate-500 text-sm font-medium">Quản lý và phân loại các món ăn trong hệ thống.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên danh mục..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button 
              onClick={() => openModal()}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-green-600/20 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Thêm danh mục
            </button>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {/* 🎯 Sửa font-black thành font-bold */}
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên danh mục & Phân loại</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mô tả</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang kết nối cơ sở dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500 font-medium">
                      Chưa có danh mục nào hoặc không tìm thấy kết quả.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((cat) => (
                    <tr key={cat._id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold uppercase shadow-sm border border-green-200 shrink-0">
                            {cat.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{cat.name}</p>
                            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-100/50 px-2 py-0.5 rounded-md border border-green-200">
                              {cat.type}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-slate-500 line-clamp-2 max-w-[250px]">
                          {cat.description || <span className="italic text-slate-300">Không có mô tả</span>}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {cat.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-green-600 bg-green-50 border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Đã ẩn
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openModal(cat)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa danh mục"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(cat._id, cat.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa danh mục"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          
          {/* Thanh phân trang */}
          {!isLoading && filteredCategories.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredCategories.length)}</span> trong tổng số <span className="font-bold text-slate-900">{filteredCategories.length}</span> danh mục
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Trang trước"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-lg transition-colors ${
                        currentPage === index + 1 
                          ? 'bg-green-600 text-white shadow-sm' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
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
                  title="Trang sau"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* =========================================
          MODAL THÊM / SỬA DANH MỤC
      ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              {/* 🎯 Tiêu đề Modal */}
              <h3 className="text-2xl font-bold text-slate-900">
                {editId ? 'Sửa Danh Mục' : 'Thêm Danh Mục Mới'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-xl shadow-sm hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Tên danh mục */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên danh mục <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Món chay, Đồ uống..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>

              {/* Phân loại (Dropdown) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phân loại <span className="text-red-500">*</span></label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer appearance-none"
                >
                  <option value="Bữa ăn theo buổi">Bữa ăn theo buổi</option>
                  <option value="Chế độ sức khỏe">Chế độ sức khỏe</option>
                  <option value="Loại món ăn">Loại món ăn</option>
                  <option value="Ngân sách">Ngân sách</option>
                </select>
              </div>

              {/* Mô tả */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả</label>
                <textarea 
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Nhập mô tả ngắn gọn cho danh mục..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                ></textarea>
              </div>

              {/* Nút gạt Trạng thái (isActive) */}
              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-semibold text-slate-700">Trạng thái hiển thị</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Nút hành động */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Category;