import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStores';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const MealPlanPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [mealPlan, setMealPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const [loggedMeals, setLoggedMeals] = useState(() => {
    const saved = localStorage.getItem('nutrifood_logged_meals');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchCurrentPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');
      const res = await api.get('/meal-plans/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMealPlan(res.data.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        toast.error("Lỗi kết nối dữ liệu lộ trình.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      toast.warning("Bạn cần đăng nhập để xem Lộ trình!");
      navigate('/signin');
      return;
    }
    fetchCurrentPlan();
  }, [user, navigate, fetchCurrentPlan]);

  const handleGeneratePlan = async () => {
    try {
      setIsGenerating(true);
      const token = localStorage.getItem('nutrifood_token');
      
      const res = await api.post('/meal-plans/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      localStorage.removeItem('nutrifood_logged_meals');
      setLoggedMeals([]); 

      await fetchCurrentPlan();
      
      toast.success(res.data.message || "Đã khởi tạo lộ trình thành công!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi tạo lộ trình AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  // 🎯 HÀM GHI NHẬN 1 CHẠM (ĐÃ MỞ KHÓA TƯƠNG LAI VÀ CHUẨN HÓA GIỜ)
  const handleOneTouchLog = async (mealObj, mealType, planDate) => {
    try {
      // 1. Lấy ngày thực tế từ lộ trình
      const mealDate = new Date(planDate); 
      
      // 2. Set khung giờ logic cho từng bữa thay vì lấy giờ hiện tại
      let defaultHour = 8; // Mặc định bữa sáng
      const typeLower = mealType?.toLowerCase();
      
      if (typeLower === 'bữa trưa') defaultHour = 12;
      else if (typeLower === 'bữa tối') defaultHour = 19;
      else if (typeLower === 'bữa phụ') defaultHour = 15;
      
      mealDate.setHours(defaultHour, 0, 0, 0);

      const token = localStorage.getItem('nutrifood_token');
      const mealDetails = mealObj.mealId; 
      
      // Tạo Payload, lưu ý phần Notes để CronJob nhận diện
      const payload = {
        mealId: mealDetails?._id,
        foodName: mealDetails?.name || "Món ăn chưa xác định",
        mealType: mealType,
        servingsConsumed: mealDetails?.servings || 1,
        consumedAt: mealDate.toISOString(), 
        notes: "Dự kiến ăn (Từ Lộ trình AI)", 
        nutritionSnapshot: {
          calories: mealDetails?.totalNutrition?.calories || 0,
          protein: mealDetails?.totalNutrition?.protein || 0,
          carbs: mealDetails?.totalNutrition?.carbs || 0,
          fat: mealDetails?.totalNutrition?.fat || 0,
        }
      };

      await api.post('/meal-logs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật LocalStorage
      const uniqueMealKey = `${planDate}-${mealType}`;
      const newLoggedMeals = [...loggedMeals, uniqueMealKey];
      setLoggedMeals(newLoggedMeals);
      localStorage.setItem('nutrifood_logged_meals', JSON.stringify(newLoggedMeals));

      // Kiểm tra xem là dự kiến tương lai hay ăn hôm nay để hiện Toast phù hợp
      const today = new Date();
      today.setHours(0,0,0,0);
      if (mealDate > today) {
         toast.success(`Đã lên lịch dự kiến cho: ${mealDetails?.name || ""}`);
      } else {
         toast.success(`Đã đánh dấu hoàn thành: ${mealDetails?.name || ""}`);
      }
      
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Không thể ghi nhận món ăn vào nhật ký lúc này.");
      }
    }
  };

  const renderMealTypeBadge = (type) => {
    const badges = {
      'bữa sáng': 'bg-yellow-100 text-yellow-700',
      'bữa trưa': 'bg-orange-100 text-orange-700',
      'bữa tối': 'bg-indigo-100 text-indigo-700',
      'bữa phụ': 'bg-slate-100 text-slate-700'
    };
    const style = badges[type?.toLowerCase()] || 'bg-slate-100 text-slate-700';
    return <span className={`${style} px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider`}>{type || 'Khác'}</span>;
  };

  return (
    <div className="font-sans text-slate-800 selection:bg-green-200 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Lộ Trình Tuần Dinh Dưỡng</h1>
              <p className="text-slate-500 font-medium">Hệ thống AI phân tích TDEE và đề xuất cấu trúc bữa ăn trọn vẹn 7 ngày.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => navigate('/meal-logs')} 
                className="bg-white border border-slate-200 text-slate-800 font-bold px-6 py-3 rounded-xl hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                Nhật ký thực đơn
              </button>

              <button 
                onClick={handleGeneratePlan}
                disabled={isGenerating}
                className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Đang xử lý thuật toán...
                  </>
                ) : (
                  <>✨ Khởi tạo / Làm mới</>
                )}
              </button>
            </div>
          </div>

          {isLoading ? (
             <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div></div>
          ) : !mealPlan ? (
            <div className="bg-gradient-to-b from-green-50 to-white rounded-[2rem] border border-green-100 p-12 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Chưa có lộ trình tuần này</h2>
              <p className="text-slate-600 font-medium text-sm max-w-sm mb-6 leading-relaxed">
                Hãy nhấn nút "Khởi tạo" ở góc trên để Generative AI bắt đầu thiết kế thực đơn chuẩn khoa học cho riêng bạn.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">Đang áp dụng</span>
                    <p className="text-slate-900 font-bold text-lg">
                      {new Date(mealPlan.startDate).toLocaleDateString('vi-VN')} - {new Date(mealPlan.endDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Mục tiêu năng lượng AI phân bổ: <span className="font-bold text-slate-800">{mealPlan.totalDailyCalories} kcal/ngày</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mealPlan.dailyMenus?.map((day, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Ngày {day.dayNumber}</h3>
                      {day.date && <p className="text-xs font-bold text-slate-500">{new Date(day.date).toLocaleDateString('vi-VN')}</p>}
                    </div>
                    
                    <div className="p-4 space-y-4 flex-grow">
                      {/* 🎯 LỌC BỎ CÁC MÓN BỊ ẨN BỞI ADMIN TRƯỚC KHI RENDER */}
                      {day.meals
                        ?.filter(mealObj => mealObj.mealId && mealObj.mealId.isActive !== false)
                        .map((mealObj, mIdx) => {
                          const mealInfo = mealObj.mealId; 
                          
                          const uniqueMealKey = `${day.date}-${mealObj.mealType}`;
                          const isLogged = loggedMeals.includes(uniqueMealKey);

                          return (
                            <div key={mIdx} className="flex items-center justify-between group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                              <div>
                                <div className="mb-1">
                                  {renderMealTypeBadge(mealObj.mealType)}
                                </div>
                                <p className="font-bold text-slate-900 text-sm">{mealInfo?.name || "Món ăn bị lỗi"}</p>
                                <p className="text-xs font-medium text-slate-500 mt-1">
                                  {mealInfo?.totalNutrition?.calories || 0} kcal
                                </p>
                              </div>
                              
                              <button 
                                onClick={() => handleOneTouchLog(mealObj, mealObj.mealType, day.date)}
                                disabled={isLogged}
                                className={`p-2.5 rounded-xl transition-colors shrink-0 flex items-center justify-center
                                  ${isLogged 
                                    ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                                    : 'bg-slate-50 text-slate-400 hover:bg-green-600 hover:text-white border border-slate-100 hover:border-green-600' 
                                  }
                                `}
                                title={isLogged ? "Đã lên lịch/Ghi nhận" : "Lên lịch/Ghi nhận vào nhật ký"}
                              >
                                {isLogged ? (
                                  <span className="text-xs font-bold">✓ Đã lưu</span>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                                )}
                              </button>
                            </div>
                          );
                      })}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MealPlanPage;