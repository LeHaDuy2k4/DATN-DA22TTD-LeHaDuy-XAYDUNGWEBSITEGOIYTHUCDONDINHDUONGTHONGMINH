import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import api from '@/lib/axios';
import { toast } from 'sonner'; 

const Ingredient = () => {
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE CHO PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Số nguyên liệu mỗi trang

  // State cho Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    baseUnit: '100g', 
    referencePrice: 0,
    nutritionalValue: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    description: '',
    isActive: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. GỌI API LẤY DỮ LIỆU TỪ MONGODB
  const fetchIngredients = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');

      const res = await api.get('/ingredients', { 
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true 
      });
      
      if (res.data) {
        setIngredients(res.data);
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách nguyên liệu:", error);
      toast.error("Không thể lấy dữ liệu nguyên liệu. Hãy kiểm tra Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  // Đặt lại trang 1 mỗi khi tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. XỬ LÝ MỞ MODAL THÊM / SỬA
  const openModal = (ingredient = null) => {
    if (ingredient) {
      setEditId(ingredient._id);
      setFormData({ 
        name: ingredient.name, 
        baseUnit: ingredient.baseUnit || '100g',
        referencePrice: ingredient.referencePrice || 0,
        nutritionalValue: {
          calories: ingredient.nutritionalValue?.calories || 0,
          protein: ingredient.nutritionalValue?.protein || 0,
          carbs: ingredient.nutritionalValue?.carbs || 0,
          fat: ingredient.nutritionalValue?.fat || 0
        },
        description: ingredient.description || '',
        isActive: ingredient.isActive !== undefined ? ingredient.isActive : true
      });
    } else {
      setEditId(null);
      setFormData({ 
        name: '', 
        baseUnit: '100g', 
        referencePrice: 0,
        nutritionalValue: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        description: '', 
        isActive: true 
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData({ 
      name: '', baseUnit: '100g', referencePrice: 0,
      nutritionalValue: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      description: '', isActive: true 
    });
  };

  // 3. XỬ LÝ LƯU (THÊM MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Tên nguyên liệu không được để trống!");

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('nutrifood_token');
      const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

      if (editId) {
        const res = await api.put(`/ingredients/${editId}`, formData, config);
        setIngredients(ingredients.map(item => item._id === editId ? (res.data.ingredient || res.data) : item));
        toast.success("Cập nhật nguyên liệu thành công!");
      } else {
        const res = await api.post('/ingredients', formData, config);
        setIngredients([res.data.ingredient || res.data, ...ingredients]);
        toast.success("Thêm nguyên liệu mới thành công!");
      }
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu nguyên liệu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. XỬ LÝ XÓA
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nguyên liệu "${name}" không?`)) {
      try {
        const token = localStorage.getItem('nutrifood_token');
        await api.delete(`/ingredients/${id}`, { 
          headers: { Authorization: `Bearer ${token}` }, withCredentials: true 
        });
        setIngredients(ingredients.filter(item => item._id !== id));
        toast.success(`Đã xóa nguyên liệu ${name}.`);
      } catch (error) {
        toast.error("Không thể xóa nguyên liệu này.");
      }
    }
  };

  const handleNutritionalChange = (field, value) => {
    setFormData({
      ...formData,
      nutritionalValue: { ...formData.nutritionalValue, [field]: Number(value) }
    });
  };

  // --- LOGIC PHÂN TRANG (TÍNH TOÁN DỮ LIỆU HIỂN THỊ) ---
  const filteredIngredients = ingredients.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredIngredients.length / itemsPerPage);
  
  // Cắt mảng để lấy đúng 5 item cho trang hiện tại
  const currentItems = filteredIngredients.slice(
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
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Nguyên liệu</h1>
            <p className="text-slate-500 text-sm font-medium">Quản lý kho dữ liệu thành phần và giá trị dinh dưỡng.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên nguyên liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm shadow-green-600/20 active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Thêm
            </button>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên nguyên liệu</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Đơn vị & Giá</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá trị dinh dưỡng</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">Chưa có nguyên liệu nào.</td></tr>
                ) : (
                  currentItems.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      {/* Cột 1: Tên */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold uppercase shadow-sm border border-green-200 shrink-0">{item.name.charAt(0)}</div>
                          <div>
                            <p className="font-bold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500 line-clamp-1 w-32" title={item.description}>{item.description || "Không mô tả"}</p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Giá */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{item.referencePrice?.toLocaleString('vi-VN')} VNĐ</span>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">/ {item.baseUnit}</span>
                        </div>
                      </td>

                      {/* Cột 3: Dinh dưỡng */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold max-w-[200px]">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200" title="Calories">🔥 {item.nutritionalValue?.calories || 0} kcal</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200" title="Protein">🥩 {item.nutritionalValue?.protein || 0}g</span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md border border-yellow-200" title="Carbs">🌾 {item.nutritionalValue?.carbs || 0}g</span>
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200" title="Fat">🥑 {item.nutritionalValue?.fat || 0}g</span>
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="px-6 py-4">
                        {item.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-green-600 bg-green-50 border border-green-100"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Có sẵn</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Tạm ẩn</span>
                        )}
                      </td>

                      {/* Cột 5: Hành động */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(item._id, item.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* --- THANH PHÂN TRANG --- */}
          {!isLoading && filteredIngredients.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredIngredients.length)}</span> trong tổng số <span className="font-bold text-slate-900">{filteredIngredients.length}</span> nguyên liệu
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
          MODAL THÊM / SỬA NGUYÊN LIỆU
      ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl my-auto animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-[2rem]">
              <h2 className="text-2xl font-bold text-slate-900">
                {editId ? 'Sửa Nguyên Liệu' : 'Thêm Nguyên Liệu Mới'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-xl shadow-sm hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên nguyên liệu *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Thịt ức gà..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đơn vị cơ sở *</label>
                  <select value={formData.baseUnit} onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none cursor-pointer">
                    <option value="100g">100g</option>
                    <option value="1kg">1kg</option>
                    <option value="1 lít">1 Lít</option>
                    <option value="100ml">100ml</option>
                    <option value="1 quả">1 Quả/Trái</option>
                    <option value="1 bó">1 Bó</option>
                    <option value="1 muỗng">1 Muỗng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Giá tham khảo (VNĐ) *</label>
                  <input type="number" required min="0" step="1000" value={formData.referencePrice} onChange={(e) => setFormData({ ...formData, referencePrice: Number(e.target.value) })} placeholder="VD: 15000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none" />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                <p className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Giá trị dinh dưỡng (Tính trên 1 đơn vị cơ sở)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-orange-600 mb-1">Calories (kcal)</label>
                    <input type="number" min="0" step="0.1" value={formData.nutritionalValue.calories} onChange={(e) => handleNutritionalChange('calories', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 mb-1">Protein (g)</label>
                    <input type="number" min="0" step="0.1" value={formData.nutritionalValue.protein} onChange={(e) => handleNutritionalChange('protein', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-600 mb-1">Carbs (g)</label>
                    <input type="number" min="0" step="0.1" value={formData.nutritionalValue.carbs} onChange={(e) => handleNutritionalChange('carbs', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-yellow-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-600 mb-1">Fat (g)</label>
                    <input type="number" min="0" step="0.1" value={formData.nutritionalValue.fat} onChange={(e) => handleNutritionalChange('fat', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-red-500 outline-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả thêm</label>
                <textarea rows="2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Nhập nguồn gốc, đặc điểm..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none resize-none"></textarea>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-semibold text-slate-700">Trạng thái (Có sẵn trong kho)</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                  <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors">Hủy bỏ</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {editId ? 'Cập nhật' : 'Thêm nguyên liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Ingredient;