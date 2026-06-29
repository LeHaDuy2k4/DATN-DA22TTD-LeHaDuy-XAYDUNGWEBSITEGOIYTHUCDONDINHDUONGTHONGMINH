import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStores';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const RecommendationsPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [recommendedMeals, setRecommendedMeals] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.warning("Bạn cần đăng nhập để xem gợi ý cá nhân hóa!");
      navigate('/signin');
      return;
    }

    const fetchHybridRecommendations = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('nutrifood_token');
        const headers = { Authorization: `Bearer ${token}` };

        // 1. KÉO DỮ LIỆU ĐA CHIỀU TỪ HỆ THỐNG
        const [profileRes, mealsRes, favRes, logsRes] = await Promise.allSettled([
          api.get('/users/me', { headers }),
          api.get('/meals'),
          api.get('/favorites/my-favorites', { headers }), 
          api.get('/meal-logs/my-logs', { headers }) 
        ]);

        const userData = profileRes.status === 'fulfilled' ? (profileRes.value?.data?.user || profileRes.value?.data) : null;
        if (!userData) throw new Error("Không lấy được profile");
        setProfile(userData);

        const rawMeals = mealsRes.status === 'fulfilled' ? mealsRes.value?.data : [];
        const allMeals = Array.isArray(rawMeals) ? rawMeals : (rawMeals?.data || []);

        // LỌC DỮ LIỆU THÔ: Chỉ giữ lại các món đang được Admin cho phép hiển thị
        const allActiveMeals = allMeals.filter(meal => meal.isActive !== false);

        const rawFavs = favRes.status === 'fulfilled' ? favRes.value?.data : [];
        const myFavorites = Array.isArray(rawFavs) ? rawFavs : (rawFavs?.data || []);

        const rawLogs = logsRes.status === 'fulfilled' ? logsRes.value?.data : [];
        const myLogs = Array.isArray(rawLogs) ? rawLogs : (rawLogs?.data || []);

        const favoriteMealIds = myFavorites.map(fav => fav.mealId?._id || fav.mealId);
        const loggedFoodNames = myLogs.map(log => log.foodName?.toLowerCase() || ""); 

        // =====================================================================
        // THUẬT TOÁN HYBRID RECOMMENDATION - WEIGHTED SCORING SYSTEM
        // =====================================================================
        let scoredMeals = allActiveMeals.map(meal => {
          let score = 0;
          let matchReasons = []; 

          // --- LỚP 1: TỐI ƯU THEO NGÂN SÁCH ---
          if (userData.budgetPreference > 0 && meal.totalEstimatedCost) {
            const budgetPerMeal = userData.budgetPreference / 3; 
            
            if (meal.totalEstimatedCost <= budgetPerMeal) {
              score += 10;
              matchReasons.push("Tiết kiệm");
            } else if (meal.totalEstimatedCost <= budgetPerMeal * 1.2) {
              score += 4; 
            } else {
              score -= 15; 
            }
          }

          // --- LỚP 2: TỐI ƯU THEO CHỈ SỐ CƠ THỂ VÀ MỤC TIÊU SỨC KHỎE ---
          const cals = meal.totalNutrition?.calories || 0;
          const pro = meal.totalNutrition?.protein || 0;
          const fat = meal.totalNutrition?.fat || 0;
          const carb = meal.totalNutrition?.carbs || 0;
          
          const goal = userData.healthGoal;
          const bmi = userData.bmi || 22; 

          // Giảm cân an toàn
          if (goal === 'Giảm cân an toàn' || bmi >= 25) {
            if (cals > 0 && cals <= 400) {
              score += 12;
              matchReasons.push("Ít Calo, giảm mỡ");
            } else if (cals > 600) {
              score -= 12; 
            }
            if (pro >= 20) {
              score += 5;
            }
            if (fat > 15) score -= 5;
          } 
          // Tăng cân khoa học
          else if (goal === 'Tăng cân khoa học' || bmi < 18.5) {
            if (cals >= 500) {
              score += 12;
              matchReasons.push("Giàu năng lượng");
            } else if (cals < 350) {
              score -= 8; 
            }
            if (pro >= 25) {
              score += 6;
            }
          }
          // Tăng cơ giảm mỡ
          else if (goal === 'Tăng cơ giảm mỡ') {
            if (pro >= 30) {
              score += 15;
              matchReasons.push("Giàu Protein");
            } else if (pro >= 20) {
              score += 6;
            } else {
              score -= 8; 
            }
            
            if (fat <= 15) {
              score += 6;
            } else if (fat > 25) {
              score -= 10; 
            }
          }
          // Duy trì cân nặng
          else {
            if (cals >= 400 && cals <= 600) {
              score += 8;
              matchReasons.push("Cân bằng");
            }
            if (pro >= 15) score += 3;
            if (carb >= 30 && carb <= 60) score += 3; 
          }

          // --- LỚP 3: HÀNH VI NGƯỜI DÙNG ---
          if (favoriteMealIds.includes(meal._id)) {
            score += 8; 
            matchReasons.push("Món yêu thích của bạn");
          }
          if (loggedFoodNames.includes(meal.name?.toLowerCase())) {
            score += 3;
            matchReasons.unshift("Món quen thuộc"); 
          }

          // --- LỚP 4: SỞ THÍCH CÁ NHÂN ---
          if (userData.interests && userData.interests.length > 0) {
            const mealDesc = `${meal.name} ${meal.description}`.toLowerCase();
            let interestMatched = false;
            
            userData.interests.forEach(interest => {
              if (interest.trim() !== '' && mealDesc.includes(interest.toLowerCase().trim())) {
                score += 6; 
                interestMatched = true;
              }
            });
            if (interestMatched) matchReasons.push("Hợp khẩu vị");
          }

          return { ...meal, score, matchReasons };
        });

        // SẮP XẾP VÀ TRẢ KẾT QUẢ ĐẦU RA
        scoredMeals.sort((a, b) => b.score - a.score);

        const topRecommendations = scoredMeals
          .filter(m => m.score > 0)
          .map(m => ({
            ...m,
            matchReasons: [...new Set(m.matchReasons)].slice(0, 2) 
          }))
          .slice(0, 8);

        setRecommendedMeals(topRecommendations.length > 0 ? topRecommendations : allActiveMeals.slice(0, 8));

      } catch (error) {
        console.error("Lỗi thuật toán đề xuất:", error);
        toast.error("Hệ thống AI đang bận. Vui lòng thử lại sau!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHybridRecommendations();
    
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        
        {/* Banner Giới thiệu Thuật toán */}
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400 opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-green-300 text-sm font-bold tracking-wider mb-4 shadow-sm">
              ✨ ADVANCED HYBRID RECOMMENDATION
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white tracking-tight">Thực Đơn Dành Riêng Cho Bạn</h1>
            <p className="text-green-50 text-lg max-w-2xl mx-auto font-medium">
              Hệ thống kết hợp phân tích <span className="font-bold text-white border-b border-green-400 pb-0.5">Chỉ số Cơ thể</span> và <span className="font-bold text-white border-b border-green-400 pb-0.5">Thói quen ăn uống</span> của bạn để đưa ra những lựa chọn hoàn hảo nhất.
            </p>
          </div>
        </div>

        {/* Nội dung kết quả phân tích */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {profile && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-10 flex flex-wrap gap-4 items-center justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Mục tiêu:</span>
                <span className="font-bold text-slate-800">{profile.healthGoal}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">BMI:</span>
                <span className={`font-bold ${profile.bmi >= 25 ? 'text-rose-600' : profile.bmi < 18.5 ? 'text-amber-500' : 'text-slate-800'}`}>
                  {profile.bmi > 0 ? profile.bmi : '--'}
                </span>
              </div>
              {profile.budgetPreference > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Ngân sách:</span>
                  <span className="font-bold text-slate-800">{profile.budgetPreference.toLocaleString('vi-VN')} ₫/ngày</span>
                </div>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-500 font-bold text-sm uppercase tracking-wider">Sở thích:</span>
                  <span className="font-bold text-green-600">{profile.interests.join(', ')}</span>
                </div>
              )}
              <Link to="/profile" className="ml-auto text-sm text-green-600 hover:underline font-bold bg-green-50 px-4 py-2.5 rounded-xl transition-colors shadow-sm">
                Chỉnh sửa hồ sơ
              </Link>
            </div>
          )}

          {/* Lưới hiển thị Món ăn được đề xuất */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recommendedMeals.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-700">Chưa tìm thấy món ăn phù hợp. Hãy cập nhật lại hồ sơ nhé!</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedMeals.map((meal) => (
                <Link 
                  key={meal._id} 
                  to={`/meal/${meal._id}`}
                  className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col relative block"
                >
                  {/* Badge Báo cáo Lý do đề xuất (Cá nhân hóa) - GIỮ NGUYÊN KIỂU TICK XANH CŨ */}
                  <div className="absolute z-10 top-4 right-4 flex flex-col gap-1.5 items-end">
                    {meal.matchReasons?.map((reason, i) => (
                      <span 
                        key={i} 
                        className={`backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm ${reason === 'Món yêu thích của bạn' ? 'bg-rose-500/90' : 'bg-green-500/90'}`}
                      >
                        {reason === 'Món yêu thích của bạn' ? '❤️' : '✓'} {reason}
                      </span>
                    ))}
                  </div>

                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img 
                      src={meal.imageUrl || 'https://via.placeholder.com/400x300'} 
                      alt={meal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {meal.totalNutrition?.calories && (
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-bold text-xs text-orange-600 shadow-sm border border-white/50">
                        {meal.totalNutrition.calories} kcal
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-2 group-hover:text-green-600 transition-colors">
                      {meal.name}
                    </h3>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <div className="text-red-500 bg-red-50 px-2 py-1 rounded-lg">P: {meal.totalNutrition?.protein || 0}g</div>
                      <div className="text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">C: {meal.totalNutrition?.carbs || 0}g</div>
                      <div className="text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">F: {meal.totalNutrition?.fat || 0}g</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RecommendationsPage;