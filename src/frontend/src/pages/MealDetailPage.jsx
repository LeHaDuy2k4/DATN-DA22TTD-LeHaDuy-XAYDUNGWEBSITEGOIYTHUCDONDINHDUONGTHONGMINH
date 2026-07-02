import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from "@/stores/useAuthStores";

import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const MealDetailPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [meal, setMeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // --- STATE CHO MODAL GHI NHẬT KÝ ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logData, setLogData] = useState({
    mealType: 'Bữa trưa',
    servingsConsumed: 1,
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 HÀM LỌC ẢNH THEO MÔI TRƯỜNG
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/800x600?text=NutriFood';
    if (imageUrl.startsWith('http') && !imageUrl.includes('localhost')) {
      return imageUrl;
    }
    let finalUrl = imageUrl;
    if (imageUrl.includes('localhost:5001')) {
      finalUrl = imageUrl.split('localhost:5001')[1]; 
    }
    if (import.meta.env.MODE === 'development' && finalUrl.startsWith('/uploads/')) {
      return `http://localhost:5001${finalUrl}`;
    }
    return finalUrl;
  };

  // 1. LẤY DỮ LIỆU MÓN ĂN VÀ TRẠNG THÁI YÊU THÍCH
  useEffect(() => {
    const fetchMealDetails = async () => {
      try {
        setIsLoading(true);
        const mealRes = await api.get(`/meals/${id}`);
        setMeal(mealRes.data);

        if (user) {
          const token = localStorage.getItem('nutrifood_token');
          const favRes = await api.get(`/favorites/check/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsFavorited(favRes.data.isFavorited);
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết món ăn:", error);
        toast.error("Không tìm thấy món ăn này hoặc có lỗi xảy ra.");
        navigate('/menu'); 
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchMealDetails();
  }, [id, user, navigate]);

  // 2. XỬ LÝ THẢ TIM
  const handleToggleFavorite = async () => {
    if (!user) {
      toast.warning("Vui lòng đăng nhập để lưu món ăn yêu thích!");
      navigate('/signin');
      return;
    }

    try {
      const token = localStorage.getItem('nutrifood_token');
      const res = await api.post(
        '/favorites/toggle',
        { mealId: meal._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setIsFavorited(res.data.isFavorited);
      if (res.data.isFavorited) {
        toast.success("Đã lưu vào danh sách yêu thích! ❤️");
      } else {
        toast.info("Đã gỡ khỏi danh sách yêu thích.");
      }
    } catch (error) {
      console.error("Lỗi thả tim:", error);
      toast.error("Có lỗi xảy ra, vui lòng thử lại.");
    }
  };

  // 3. XỬ LÝ LƯU VÀO NHẬT KÝ ĂN UỐNG
  const handleLogMeal = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning("Vui lòng đăng nhập để ghi nhật ký ăn uống!");
      navigate('/signin');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('nutrifood_token');
      
      const servingsRatio = Number(logData.servingsConsumed) / (meal?.servings || 1);
      
      const payload = {
        mealId: meal?._id,
        foodName: meal?.name || "Món ăn chưa xác định",
        mealType: logData.mealType,
        servingsConsumed: Number(logData.servingsConsumed),
        consumedAt: new Date().toISOString(),
        notes: logData.notes || "",
        
        nutritionSnapshot: {
          calories: Math.round((meal?.totalNutrition?.calories || 0) * servingsRatio),
          protein: parseFloat(((meal?.totalNutrition?.protein || 0) * servingsRatio).toFixed(1)),
          carbs: parseFloat(((meal?.totalNutrition?.carbs || 0) * servingsRatio).toFixed(1)),
          fat: parseFloat(((meal?.totalNutrition?.fat || 0) * servingsRatio).toFixed(1)),
        }
      };

      await api.post('/meal-logs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Đã thêm ${meal?.name} vào nhật ký hôm nay! 🥗`);
      setIsLogModalOpen(false);
      
      setLogData({
        mealType: 'Bữa trưa',
        servingsConsumed: 1,
        notes: ''
      });
    } catch (error) {
      console.error("Lỗi lưu nhật ký:", error);
      toast.error("Không thể ghi nhật ký lúc này.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
        <Header />
        <div className="flex-grow flex items-center justify-center pt-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-medium">Đang chuẩn bị món ăn...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!meal) return null;

  return (
     <div className="font-sans text-slate-800 selection:bg-green-200 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm font-medium text-slate-500 mb-6">
            <Link to="/menu" className="hover:text-green-600 transition-colors">Thực đơn</Link>
            <span>/</span>
            <span className="text-slate-900 truncate">{meal.name}</span>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              
              {/* --- CỘT TRÁI: HÌNH ẢNH & THÔNG SỐ NHANH --- */}
              <div className="relative">
                <div className="h-[400px] lg:h-full min-h-[500px] relative">
                  <img 
                    src={getImageUrl(meal.imageUrl)} 
                    alt={meal.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  
                  {/* Nút thả tim nổi trên ảnh */}
                  <button 
                    onClick={handleToggleFavorite}
                    className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur-md rounded-full hover:scale-110 shadow-lg transition-transform duration-300"
                  >
                    <svg className={`w-6 h-6 ${isFavorited ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>

                  {/* Nhãn giá tiền nổi trên ảnh */}
                  {meal.totalEstimatedCost && (
                    <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl font-bold text-slate-900 shadow-lg text-xl">
                      ~ {meal.totalEstimatedCost.toLocaleString('vi-VN')} ₫
                    </div>
                  )}
                </div>
              </div>

              {/* --- CỘT PHẢI: CHI TIẾT & HÀNH ĐỘNG --- */}
              <div className="p-8 lg:p-12 flex flex-col">
                
                {/* Tiêu đề & Thông tin cơ bản */}
                <div className="mb-8">
                  {/* 🎯 Tiêu đề món ăn */}
                  <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-4">{meal.name}</h1>
                  <p className="text-slate-500 font-medium leading-relaxed mb-6">
                    {meal.description || "Một bữa ăn thơm ngon, đầy đủ dưỡng chất giúp bạn duy trì năng lượng cho một ngày làm việc hiệu quả."}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-700">
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Chuẩn bị: {meal.prepTime}p
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      Khẩu phần: {meal.servings}
                    </div>
                  </div>
                </div>

                {/* Bảng Dinh dưỡng (Macronutrients) */}
                {meal.totalNutrition && (
                  <div className="mb-8">
                    {/* 🎯 Tiêu đề bảng dinh dưỡng */}
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Thành phần dinh dưỡng (1 phần)
                    </h2>
                   <div className="grid grid-cols-4 gap-3">
                      <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100/50">
                        <p className="text-xs font-bold text-orange-600/70 mb-1 uppercase tracking-wider">Calories</p>
                        <p className="text-xl font-black text-orange-600">{meal.totalNutrition.calories}</p>
                      </div>
                      <div className="bg-red-50 rounded-2xl p-4 text-center border border-red-100/50">
                        <p className="text-xs font-bold text-red-600/70 mb-1 uppercase tracking-wider">Protein</p>
                        <p className="text-xl font-black text-red-600">{meal.totalNutrition.protein}g</p>
                      </div>
                      <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100/50">
                        <p className="text-xs font-bold text-blue-600/70 mb-1 uppercase tracking-wider">Carbs</p>
                        <p className="text-xl font-black text-blue-600">{meal.totalNutrition.carbs}g</p>
                      </div>
                      <div className="bg-amber-50 rounded-2xl p-4 text-center border border-amber-100/50">
                        <p className="text-xs font-bold text-amber-600/70 mb-1 uppercase tracking-wider">Fat</p>
                        <p className="text-xl font-black text-amber-600">{meal.totalNutrition.fat}g</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nút Hành động */}
                <div className="mt-auto pt-8 flex gap-4">
                  <button 
                    onClick={() => setIsLogModalOpen(true)}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-600 hover:shadow-xl hover:shadow-green-600/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Ghi vào Nhật ký
                  </button>
                </div>

              </div>
            </div>
          </div>

          {/* --- KHU VỰC THÔNG TIN CHI TIẾT (NGUYÊN LIỆU & CÁCH LÀM) --- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            
            {/* Cột Trái: Nguyên liệu */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 h-fit">
              {/* 🎯 Tiêu đề */}
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">🥬</span>
                Nguyên liệu
              </h2>
              <ul className="space-y-4">
                {meal.ingredients?.map((ing, idx) => (
                  <li key={idx} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="font-semibold text-slate-700">{ing.ingredientId?.name || 'Nguyên liệu'}</span>
                    </div>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg text-sm">
                      {ing.quantity} {ing.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột Phải: Hướng dẫn cách làm (Chiếm 2/3) */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
              {/* 🎯 Tiêu đề */}
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">🍳</span>
                Hướng dẫn thực hiện
              </h2>
              <div className="space-y-6">
                {meal.instructions?.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div className="pt-2">
                      <p className="text-slate-700 font-medium leading-relaxed">{step}</p>
                    </div>
                  </div>
                ))}
                {(!meal.instructions || meal.instructions.length === 0) && (
                  <p className="text-slate-500 italic font-medium">Hướng dẫn cách làm đang được cập nhật...</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />

      {/* =========================================
          MODAL: THÊM VÀO NHẬT KÝ ĂN UỐNG
      ========================================= */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              {/* 🎯 Tiêu đề Modal */}
              <h2 className="text-2xl font-bold text-slate-900">Ghi nhật ký ăn uống</h2>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-xl shadow-sm hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleLogMeal} className="p-6 space-y-5">
              {/* Hiển thị tên món (Readonly) */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Món ăn</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500">
                  {meal.name}
                </div>
              </div>

              {/* Bữa ăn */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bạn ăn vào bữa nào? <span className="text-red-500">*</span></label>
                <select 
                  value={logData.mealType}
                  onChange={(e) => setLogData({ ...logData, mealType: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none cursor-pointer"
                >
                  <option value="Bữa sáng">Bữa sáng</option>
                  <option value="Bữa trưa">Bữa trưa</option>
                  <option value="Bữa tối">Bữa tối</option>
                  <option value="Ăn vặt">Ăn vặt</option>
                </select>
              </div>

              {/* Khẩu phần */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số khẩu phần (phần) <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    min="0.5"
                    step="0.5"
                    required
                    value={logData.servingsConsumed}
                    onChange={(e) => setLogData({ ...logData, servingsConsumed: e.target.value })}
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-medium">x {meal.totalNutrition?.calories || 0} kcal</span>
                </div>
              </div>

              {/* Nút Submit */}
              <div className="pt-4 border-t border-slate-100">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                  {isSubmitting ? 'Đang lưu...' : 'Xác nhận ghi nhật ký'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
      
    </div>
  );
};

export default MealDetailPage;