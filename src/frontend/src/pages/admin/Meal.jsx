import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import api from '@/lib/axios';
import { toast } from 'sonner'; 

// 🎯 1. KHỞI TẠO BIẾN SERVER URL ĐỂ NỐI LINK ẢNH CŨ
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const BASE_SERVER_URL = API_URL.replace('/api', ''); 

const Meals = () => {
  const [meals, setMeals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ingredientsList, setIngredientsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // --- STATE CHO PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; 

  // State cho Modal & Upload Ảnh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); 
  const [previewUrl, setPreviewUrl] = useState(''); 
  
  const initialFormState = { 
    name: '', 
    description: '', 
    categoryIds: [],
    ingredients: [], 
    instructions: [''], 
    prepTime: 0,
    cookTime: 0,
    servings: 1,
    isActive: true 
  };
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 2. HÀM XỬ LÝ ẢNH THÔNG MINH (Hỗ trợ cả Base64 và Ảnh vật lý cũ)
  const getImageUrl = (imageString) => {
    if (!imageString) return ''; 
    // Nếu là Base64, Blob (chọn từ máy), hoặc link http ngoài -> Giữ nguyên
    if (imageString.startsWith('data:image') || imageString.startsWith('http') || imageString.startsWith('blob:')) {
      return imageString;
    }
    // Nếu là ảnh cũ trong /uploads -> Nối link server
    return `${BASE_SERVER_URL}${imageString.startsWith('/') ? '' : '/'}${imageString}`;
  };

  // 1. GỌI API LẤY DỮ LIỆU TỪ MONGODB
  const fetchData = async () => {
    try {
      setIsLoading(true);
      // 🎯 Đã dọn dẹp Token vì Axios Interceptor tự động lo phần này
      const [mealsRes, categoriesRes, ingredientsRes] = await Promise.allSettled([
        api.get('/meals'),
        api.get('/categories'),
        api.get('/ingredients')
      ]);
      
      if (mealsRes.status === 'fulfilled' && mealsRes.value.data) {
        setMeals(mealsRes.value.data);
      } else {
        setMeals([]); 
      }

      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data) {
        setCategories(categoriesRes.value.data.filter(c => c.isActive !== false));
      }

      if (ingredientsRes.status === 'fulfilled' && ingredientsRes.value.data) {
        setIngredientsList(ingredientsRes.value.data.filter(i => i.isActive !== false));
      }

    } catch (error) {
      console.error("Lỗi lấy dữ liệu hệ thống:", error);
      toast.error("Không thể tải toàn bộ dữ liệu. Hãy kiểm tra Backend!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 2. XỬ LÝ MỞ MODAL THÊM / SỬA
  const openModal = (meal = null) => {
    if (meal) {
      setEditId(meal._id);
      setFormData({ 
        name: meal.name, 
        description: meal.description || '',
        categoryIds: meal.categoryIds?.map(cat => cat._id || cat) || [],
        ingredients: meal.ingredients?.map(ing => ({
          ingredientId: ing.ingredientId?._id || ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit
        })) || [],
        instructions: meal.instructions?.length ? meal.instructions : [''],
        prepTime: meal.prepTime || 0,
        cookTime: meal.cookTime || 0,
        servings: meal.servings || 1,
        isActive: meal.isActive !== undefined ? meal.isActive : true
      });
      // 🎯 Gọi hàm getImageUrl để render đúng ảnh cũ hoặc Base64 lên khung Preview
      setPreviewUrl(meal.imageUrl ? getImageUrl(meal.imageUrl) : '');
    } else {
      setEditId(null);
      setFormData(initialFormState);
      setPreviewUrl('');
    }
    setSelectedImage(null); // Reset file upload
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setFormData(initialFormState);
    setSelectedImage(null);
    setPreviewUrl('');
  };

  // --- XỬ LÝ CHỌN FILE ẢNH ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  // --- CÁC HÀM XỬ LÝ MẢNG ĐỘNG (NGUYÊN LIỆU & HƯỚNG DẪN) ---
  const handleCategoryToggle = (catId) => {
    setFormData(prev => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(catId) 
        ? prev.categoryIds.filter(id => id !== catId)
        : [...prev.categoryIds, catId]
    }));
  };

  const handleAddIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { ingredientId: '', quantity: 1, unit: 'gam' }]
    }));
  };

  const handleUpdateIngredient = (index, field, value) => {
    const newIngredients = [...formData.ingredients];
    newIngredients[index][field] = field === 'quantity' ? Number(value) : value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleAddInstruction = () => {
    setFormData(prev => ({ ...prev, instructions: [...prev.instructions, ''] }));
  };

  const handleUpdateInstruction = (index, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleRemoveInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  // 3. XỬ LÝ LƯU FORMDATA (THÊM MỚI HOẶC CẬP NHẬT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Tên món ăn không được để trống!");
    
    const validIngredients = formData.ingredients.filter(ing => ing.ingredientId && ing.ingredientId !== '');
    const validInstructions = formData.instructions.filter(inst => inst && inst.trim() !== '');

    if (validIngredients.length === 0) return toast.warning("Vui lòng thêm ít nhất 1 thành phần nguyên liệu!");
    if (validInstructions.length === 0) return toast.warning("Vui lòng thêm ít nhất 1 bước hướng dẫn thực hiện!");

    try {
      setIsSubmitting(true);
      
      // SỬ DỤNG FORMDATA ĐỂ CHỨA FILE VÀ CHỮ
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('prepTime', formData.prepTime);
      submitData.append('cookTime', formData.cookTime);
      submitData.append('servings', formData.servings);
      submitData.append('isActive', formData.isActive);

      submitData.append('categoryIds', JSON.stringify(formData.categoryIds));
      submitData.append('ingredients', JSON.stringify(validIngredients));
      submitData.append('instructions', JSON.stringify(validInstructions));

      if (selectedImage) {
        submitData.append('image', selectedImage);
      }

      // 🎯 Chỉ cần ghi đè Content-Type cho FormData, Token đã được tự động thêm
      const config = { 
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      };

      if (editId) {
        await api.put(`/meals/${editId}`, submitData, config);
        toast.success("Cập nhật món ăn thành công!");
      } else {
        await api.post('/meals', submitData, config);
        toast.success("Thêm món ăn mới thành công!");
      }
      fetchData(); 
      closeModal();
    } catch (error) {
      console.error("Lỗi lưu món ăn:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. XỬ LÝ XÓA
  const handleDelete = async (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa món "${name}" không?`)) {
      try {
        await api.delete(`/meals/${id}`); // 🎯 Gọn gàng hơn vì không cần gọi lại Token
        setMeals(meals.filter(item => item._id !== id));
        toast.success(`Đã xóa món ${name}.`);
      } catch (error) {
        toast.error("Không thể xóa món ăn này.");
      }
    }
  };

  // --- LOGIC PHÂN TRANG (TÍNH TOÁN DỮ LIỆU HIỂN THỊ) ---
  const filteredMeals = meals.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredMeals.length / itemsPerPage);
  
  const currentItems = filteredMeals.slice(
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
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Thực đơn món ăn</h1>
            <p className="text-slate-500 text-sm font-medium">Quản lý công thức, tính toán calo và giá tiền tự động.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="text" placeholder="Tìm món ăn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64 shadow-sm"/>
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={() => openModal()} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Thêm món ăn
            </button>
          </div>
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên món & Chuẩn bị</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dinh dưỡng (Tổng)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Chi phí ước tính</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center text-slate-500 font-medium">Chưa có món ăn nào.</td></tr>
                ) : (
                  currentItems.map((meal) => (
                    <tr key={meal._id} className="hover:bg-slate-50/50 transition-colors group">
                      
                      {/* Cột 1: Thông tin cơ bản */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {meal.imageUrl ? (
                            <img src={getImageUrl(meal.imageUrl)} alt={meal.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 font-bold uppercase border border-green-200">{meal.name.charAt(0)}</div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">{meal.name}</p>
                            <p className="text-[11px] font-medium text-slate-500 mt-1">
                              ⏳ {meal.prepTime + meal.cookTime} phút | 👤 {meal.servings} người
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Dinh dưỡng */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold max-w-[200px]">
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md border border-orange-200" title="Calories">🔥 {meal.totalNutrition?.calories || 0} kcal</span>
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md border border-blue-200" title="Protein">🥩 {meal.totalNutrition?.protein || 0}g</span>
                          <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-md border border-yellow-200" title="Carbs">🌾 {meal.totalNutrition?.carbs || 0}g</span>
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200" title="Fat">🥑 {meal.totalNutrition?.fat || 0}g</span>
                        </div>
                      </td>

                      {/* Cột 3: Chi phí */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                          ~ {meal.totalEstimatedCost?.toLocaleString('vi-VN')} đ
                        </span>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="px-6 py-4">
                        {meal.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold text-green-600 bg-green-50 border border-green-100">Hiển thị</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200">Đã ẩn</span>
                        )}
                      </td>

                      {/* Cột 5: Hành động */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openModal(meal)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(meal._id, meal.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

          {/* --- THANH PHÂN TRANG (PAGINATION) --- */}
          {!isLoading && filteredMeals.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-500">
                Hiển thị <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredMeals.length)}</span> trong tổng số <span className="font-bold text-slate-900">{filteredMeals.length}</span> món ăn
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
          MODAL THÊM / SỬA MÓN ĂN
      ========================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl my-10 animate-slideUp">
            <div className="sticky top-0 z-10 p-6 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md rounded-t-[2rem]">
              <h2 className="text-2xl font-bold text-slate-900">
                {editId ? 'Chỉnh Sửa Công Thức' : 'Thêm Món Ăn Mới'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:bg-slate-100 p-2 rounded-xl transition-all">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh] space-y-8">
              
              {/* PHẦN 1: THÔNG TIN CƠ BẢN */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider border-b pb-2">1. Thông tin cơ bản</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên món ăn *</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mô tả ngắn</label>
                    <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none resize-none"></textarea>
                  </div>
                  
                  {/* Tích hợp Upload ảnh thay vì URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Hình ảnh món ăn</label>
                    <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="meal-image-upload"
                        onChange={handleFileChange}
                        className="hidden" 
                      />
                      <label 
                        htmlFor="meal-image-upload"
                        className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-100 cursor-pointer transition-all shrink-0"
                      >
                        Chọn ảnh từ máy
                      </label>
                      
                      {previewUrl ? (
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Chưa có tệp nào được chọn</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời gian sơ chế (phút)</label>
                    <input type="number" min="0" value={formData.prepTime} onChange={e => setFormData({...formData, prepTime: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Thời gian nấu (phút)</label>
                    <input type="number" min="0" value={formData.cookTime} onChange={e => setFormData({...formData, cookTime: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Khẩu phần (người)</label>
                    <input type="number" min="1" value={formData.servings} onChange={e => setFormData({...formData, servings: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Trạng thái hiển thị</label>
                    <label className="relative inline-flex items-center cursor-pointer mt-2">
                      <input type="checkbox" className="sr-only peer" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}/>
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-green-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* PHẦN 2: DANH MỤC */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider border-b pb-2">2. Thuộc Danh Mục</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map(cat => (
                    <label key={cat._id} className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.categoryIds.includes(cat._id) ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                      <input type="checkbox" checked={formData.categoryIds.includes(cat._id)} onChange={() => handleCategoryToggle(cat._id)} className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" />
                      <span className="text-sm font-bold">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* PHẦN 3: NGUYÊN LIỆU ĐỘNG */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider">3. Thành phần nguyên liệu *</h3>
                  <button type="button" onClick={handleAddIngredient} className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Thêm Dòng</button>
                </div>
                {formData.ingredients.map((ing, index) => (
                  <div key={index} className="flex flex-col md:flex-row gap-3 items-end p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-full md:w-1/2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nguyên liệu từ kho</label>
                      <select value={ing.ingredientId} onChange={(e) => handleUpdateIngredient(index, 'ingredientId', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium outline-none">
                        <option value="">-- Chọn nguyên liệu --</option>
                        {ingredientsList.map(item => (
                          <option key={item._id} value={item._id}>{item.name} ({item.baseUnit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Hệ số lượng</label>
                      <input type="number" min="0.1" step="0.1" value={ing.quantity} onChange={(e) => handleUpdateIngredient(index, 'quantity', e.target.value)} placeholder="VD: 1.5" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none"/>
                    </div>
                    <div className="w-full md:w-1/4">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Đơn vị hiển thị</label>
                      <input type="text" value={ing.unit} onChange={(e) => handleUpdateIngredient(index, 'unit', e.target.value)} placeholder="VD: Muỗng, Gam..." className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none"/>
                    </div>
                    <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700 p-2.5 bg-red-50 rounded-lg">✕</button>
                  </div>
                ))}
              </div>

              {/* PHẦN 4: HƯỚNG DẪN ĐỘNG */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider">4. Các bước thực hiện *</h3>
                  <button type="button" onClick={handleAddInstruction} className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">+ Thêm Bước</button>
                </div>
                {formData.instructions.map((step, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-900 text-white font-bold rounded-lg text-sm">{index + 1}</span>
                    <textarea rows="2" value={step} onChange={(e) => handleUpdateInstruction(index, e.target.value)} placeholder="Mô tả công đoạn..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-green-500 outline-none resize-none"></textarea>
                    <button type="button" onClick={() => handleRemoveInstruction(index)} className="mt-1 text-red-500 hover:text-red-700 p-2.5 bg-red-50 rounded-lg">✕</button>
                  </div>
                ))}
              </div>

            </form>
            
            {/* NÚT SUBMIT NẰM CỐ ĐỊNH Ở ĐÁY MODAL */}
            <div className="sticky bottom-0 p-6 border-t border-slate-100 bg-white rounded-b-[2rem] flex gap-3">
              <button type="button" onClick={closeModal} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors">Hủy</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center justify-center gap-2 transition-colors">
                {isSubmitting ? 'Đang lưu...' : (editId ? 'Cập nhật Công thức' : 'Lưu Món Ăn Mới')}
              </button>
            </div>
            
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default Meals;