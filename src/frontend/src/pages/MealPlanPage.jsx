import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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

  // 1. Lấy trạng thái món đã ăn từ LocalStorage để giữ nút bấm khi F5
  const [loggedMeals, setLoggedMeals] = useState(() => {
    const saved = localStorage.getItem('nutrifood_logged_meals');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchCurrentPlan = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');
      const res = await axios.get('http://localhost:5001/api/meal-plans/current', {
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
      
      const res = await axios.post('http://localhost:5001/api/meal-plans/generate', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 🎯 TỐI ƯU HÓA: Xóa bộ nhớ đệm trạng thái nút bấm của tuần cũ
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

  const handleOneTouchLog = async (mealObj, mealType, planDate) => {
    try {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const mealDate = new Date(planDate);
      
      // Chặn người dùng ghi nhận món ăn của tương lai
      if (mealDate > today) {
        toast.warning("Chưa đến ngày này! Hệ thống không ghi nhận thực đơn của tương lai.");
        return;
      }

      const token = localStorage.getItem('nutrifood_token');
      const mealDetails = mealObj.mealId; 
      
      // 🎯 TỐI ƯU HÓA: Dùng Optional Chaining (?.) để chống sập ứng dụng nếu data thiếu
      const payload = {
        mealId: mealDetails?._id,
        foodName: mealDetails?.name || "Món ăn chưa xác định",
        mealType: mealType,
        servingsConsumed: mealDetails?.servings || 1,
        consumedAt: mealDate.toISOString(), 
        notes: "Ghi nhận 1 chạm từ Lộ trình AI",
        nutritionSnapshot: {
          calories: mealDetails?.totalNutrition?.calories || 0,
          protein: mealDetails?.totalNutrition?.protein || 0,
          carbs: mealDetails?.totalNutrition?.carbs || 0,
          fat: mealDetails?.totalNutrition?.fat || 0,
        }
      };

      await axios.post('http://localhost:5001/api/meal-logs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật mảng LocalStorage
      const uniqueMealKey = `${planDate}-${mealType}`;
      const newLoggedMeals = [...loggedMeals, uniqueMealKey];
      setLoggedMeals(newLoggedMeals);
      localStorage.setItem('nutrifood_logged_meals', JSON.stringify(newLoggedMeals));

      toast.success(`Đã đánh dấu hoàn thành: ${mealDetails?.name || ""}`);
    } catch (error) {
      toast.error("Không thể ghi nhận món ăn vào nhật ký lúc này.");
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
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Lộ Trình Tuần Dinh Dưỡng</h1>
              <p className="text-slate-500 font-medium">Hệ thống AI phân tích TDEE và đề xuất cấu trúc bữa ăn trọn vẹn 7 ngày.</p>
            </div>

            <button 
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className="bg-green-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-green-700 transition shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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

          {isLoading ? (
             <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div></div>
          ) : !mealPlan ? (
            <div className="bg-gradient-to-b from-green-50 to-white rounded-[2rem] border border-green-100 p-12 shadow-sm flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                <span className="text-4xl">🤖</span>
              </div>
              <h2 className="text-xl font-black text-green-800 mb-2">Chưa có lộ trình tuần này</h2>
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
                    <p className="text-slate-800 font-black text-lg">
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
                      <h3 className="font-black text-slate-800 tracking-tight">Ngày {day.dayNumber}</h3>
                      {day.date && <p className="text-xs font-bold text-slate-400">{new Date(day.date).toLocaleDateString('vi-VN')}</p>}
                    </div>
                    
                    <div className="p-4 space-y-4 flex-grow">
                      {day.meals?.map((mealObj, mIdx) => {
                        const mealInfo = mealObj.mealId; 
                        
                        const uniqueMealKey = `${day.date}-${mealObj.mealType}`;
                        const isLogged = loggedMeals.includes(uniqueMealKey);

                        return (
                          <div key={mIdx} className="flex items-center justify-between group border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                            <div>
                              <div className="mb-1">
                                {renderMealTypeBadge(mealObj.mealType)}
                              </div>
                              <p className="font-bold text-slate-800 text-sm">{mealInfo?.name || "Món ăn bị lỗi"}</p>
                              <p className="text-xs font-bold text-slate-400 mt-1">
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
                              title={isLogged ? "Đã ghi nhận" : "Ghi nhận vào nhật ký"}
                            >
                              {isLogged ? (
                                <span className="text-xs font-bold">✓ Đã ăn</span>
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