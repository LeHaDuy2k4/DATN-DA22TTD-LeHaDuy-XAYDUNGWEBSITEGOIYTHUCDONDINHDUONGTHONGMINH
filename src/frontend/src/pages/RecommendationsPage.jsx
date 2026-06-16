import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
    // 1. Kiểm tra đăng nhập
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

        // 1. Kéo dữ liệu ĐA CHIỀU song song (Profile, Meals, Favorites, Logs)
        const [profileRes, mealsRes, favRes, logsRes] = await Promise.allSettled([
          axios.get('http://localhost:5001/api/users/me', { headers }),
          axios.get('http://localhost:5001/api/meals'),
          axios.get('http://localhost:5001/api/favorites/my-favorites', { headers }), 
          axios.get('http://localhost:5001/api/meal-logs/my-logs', { headers }) 
        ]);

        // Lấy dữ liệu an toàn
        const userData = profileRes.status === 'fulfilled' ? profileRes.value?.data?.user : null;
        const allMeals = mealsRes.status === 'fulfilled' ? mealsRes.value?.data : [];
        const myFavorites = favRes.status === 'fulfilled' ? favRes.value?.data : [];
        const myLogs = logsRes.status === 'fulfilled' ? logsRes.value?.data : [];

        if (!userData) throw new Error("Không lấy được profile");
        setProfile(userData);

        // Chuẩn bị mảng để check nhanh hành vi người dùng
        const favoriteMealIds = myFavorites.map(fav => fav.mealId?._id || fav.mealId);
        const loggedFoodNames = myLogs.map(log => log.foodName?.toLowerCase() || ""); 

        // 2. THUẬT TOÁN HYBRID RECOMMENDATION NÂNG CAO
        let scoredMeals = allMeals.map(meal => {
          let score = 0;
          let matchReasons = []; 

          // --- PHẦN 1: DỮ LIỆU HÀNH VI (BEHAVIORAL DATA) ---
          
          // Phản hồi rõ ràng (Explicit Feedback): Đã thả tim
          if (favoriteMealIds.includes(meal._id)) {
            score += 8;
            matchReasons.push("Món yêu thích của bạn");
          }

          // Phản hồi ngầm (Implicit Feedback): Đã từng ăn (Có trong nhật ký)
          const mealNameLower = meal.name?.toLowerCase() || "";
          if (loggedFoodNames.includes(mealNameLower)) {
            score += 3;
            matchReasons.push("Món quen thuộc");
          }

          // --- PHẦN 2: DỮ LIỆU NỘI DUNG (CONTENT-BASED) ---

          // A. Ngân sách
          if (userData.budgetPreference > 0 && meal.totalEstimatedCost) {
            const budgetPerMeal = userData.budgetPreference / 3;
            if (meal.totalEstimatedCost <= budgetPerMeal) {
              score += 2;
              matchReasons.push("Tiết kiệm");
            } else {
              score -= 5; // Trừ điểm nếu vượt quá ngân sách 1 bữa
            }
          }

          // B. Mục tiêu sức khỏe & BMI
          const calories = meal.totalNutrition?.calories || 0;
          const protein = meal.totalNutrition?.protein || 0;
          
          if (userData.healthGoal === 'Giảm cân an toàn' || userData.bmi >= 25) {
            if (calories > 0 && calories <= 450) {
              score += 3;
              matchReasons.push("Ít Calo, giảm mỡ");
            } else { 
              score -= 3; // Đang giảm cân mà calo cao thì trừ điểm nặng
            } 
          } 
          else if (userData.healthGoal === 'Tăng cân khoa học' || userData.bmi < 18.5) {
            if (calories >= 550) {
              score += 3;
              matchReasons.push("Nhiều năng lượng");
            }
          }
          else if (userData.healthGoal === 'Tăng cơ giảm mỡ') {
            if (protein >= 30) {
              score += 4;
              matchReasons.push("Nhiều Protein");
            }
            if (calories <= 500) score += 1;
          }
          else {
            if (calories >= 400 && calories <= 600) {
              score += 2;
              matchReasons.push("Cân bằng");
            }
          }

          // C. Sở thích (Interests)
          if (userData.interests && userData.interests.length > 0) {
            const mealDesc = `${meal.name} ${meal.description}`.toLowerCase();
            let interestMatched = false;
            
            userData.interests.forEach(interest => {
              if (interest.trim() !== '' && mealDesc.includes(interest.toLowerCase().trim())) {
                score += 5; 
                interestMatched = true;
              }
            });
            if (interestMatched) matchReasons.push("Hợp khẩu vị");
          }

          return { ...meal, score, matchReasons };
        });

        // 3. Xử lý hiển thị (Sắp xếp theo điểm giảm dần)
        scoredMeals.sort((a, b) => b.score - a.score);

        // Lọc ra các món có điểm > 0 và loại bỏ lý do trùng lặp để UI đẹp hơn
        const topRecommendations = scoredMeals.filter(m => m.score > 0).map(m => ({
          ...m,
          matchReasons: [...new Set(m.matchReasons)].slice(0, 2) // Chỉ lấy tối đa 2 lý do đặc sắc nhất
        })).slice(0, 8);

        // Nếu hệ thống chấm điểm quá khắt khe và không ra món nào, lấy 8 món đầu tiên làm fallback
        setRecommendedMeals(topRecommendations.length > 0 ? topRecommendations : allMeals.slice(0, 8));

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
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-grow pt-24 pb-20">
        
        {/* Banner Giới thiệu Thuật toán */}
        <div className="bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-400 opacity-10 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-green-300 text-sm font-bold tracking-wider mb-4">
              ✨ ADVANCED HYBRID RECOMMENDATION
            </span>
            <h1 className="text-4xl md:text-5xl font-black mb-4">Thực Đơn Dành Riêng Cho Bạn</h1>
            <p className="text-green-100 text-lg max-w-2xl mx-auto">
              Hệ thống kết hợp phân tích <span className="font-bold text-white">Chỉ số Cơ thể</span> và <span className="font-bold text-white">Thói quen ăn uống</span> của bạn để đưa ra những lựa chọn hoàn hảo nhất.
            </p>
          </div>
        </div>

        {/* Nội dung kết quả phân tích */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          
          {profile && (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-10 flex flex-wrap gap-4 items-center justify-center md:justify-start">
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                <span className="text-slate-400 font-medium">Mục tiêu:</span>
                <span className="font-bold text-slate-800">{profile.healthGoal}</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                <span className="text-slate-400 font-medium">BMI:</span>
                <span className="font-bold text-slate-800">{profile.bmi > 0 ? profile.bmi : '--'}</span>
              </div>
              {profile.budgetPreference > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                  <span className="text-slate-400 font-medium">Ngân sách:</span>
                  <span className="font-bold text-slate-800">{profile.budgetPreference.toLocaleString('vi-VN')} ₫/ngày</span>
                </div>
              )}
              {profile.interests && profile.interests.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl">
                  <span className="text-slate-400 font-medium">Sở thích:</span>
                  <span className="font-bold text-green-600">{profile.interests.join(', ')}</span>
                </div>
              )}
              <Link to="/profile" className="ml-auto text-sm text-green-600 hover:underline font-bold bg-green-50 px-4 py-2 rounded-xl">
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
            <div className="text-center py-20">
              <h3 className="text-xl font-bold text-slate-700">Chưa tìm thấy món ăn phù hợp. Hãy cập nhật lại hồ sơ nhé!</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedMeals.map((meal) => (
                <Link 
                  key={meal._id} 
                  to={`/meal/${meal._id}`}
                  className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col relative block"
                >
                  {/* Badge Báo cáo Lý do đề xuất */}
                  <div className="absolute z-10 top-4 right-4 flex flex-col gap-1.5 items-end">
                    {meal.matchReasons?.map((reason, i) => (
                      <span key={i} className={`backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm ${reason === 'Món yêu thích của bạn' ? 'bg-rose-500/90' : 'bg-green-500/90'}`}>
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
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-black text-xs text-orange-600 shadow-sm border border-white/50">
                        {meal.totalNutrition.calories} kcal
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-black text-lg text-slate-900 line-clamp-1 mb-2 group-hover:text-green-600 transition-colors">
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