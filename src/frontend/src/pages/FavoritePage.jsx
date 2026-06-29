import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStores';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const FavoritePage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.warning("Bạn cần đăng nhập để xem danh sách yêu thích!");
      navigate('/signin');
      return;
    }

    const fetchMyFavorites = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('nutrifood_token');
        const res = await api.get('/favorites', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // API trả về mảng các object có chứa mealId đã được populate
        setFavorites(res.data || []);
      } catch (error) {
        console.error("Lỗi lấy danh sách yêu thích:", error);
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyFavorites();
  }, [user, navigate]);

  const handleRemoveFavorite = async (e, mealId, mealName) => {
    e.preventDefault(); // Ngăn chặn sự kiện click lan ra thẻ Link
    e.stopPropagation();

    try {
      const token = localStorage.getItem('nutrifood_token');
      await api.post('/favorites/toggle', { mealId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Xóa khỏi state hiện tại
      setFavorites(favorites.filter(fav => (fav.mealId?._id || fav.mealId) !== mealId));
      toast.success(`Đã bỏ thích món ${mealName}`);
    } catch (error) {
      console.error("Lỗi khi bỏ thích:", error);
      toast.error("Không thể thao tác lúc này.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              {/* 🎯 Tiêu đề chuẩn text-2xl font-bold */}
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Món ăn Yêu thích</h1>
              <p className="text-slate-500 font-medium">Lưu trữ những công thức tuyệt vời nhất dành riêng cho bạn.</p>
            </div>
            <span className="text-sm font-semibold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
              Tổng cộng: {favorites.length} món
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              {/* 🎯 Tiêu đề rỗng chuẩn text-2xl font-bold */}
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Chưa có món ăn yêu thích</h3>
              <p className="text-slate-500 font-medium text-sm mb-6">Bạn chưa thả tim cho món ăn nào cả. Hãy khám phá thực đơn ngay nhé!</p>
              <Link to="/menu" className="bg-slate-900 text-white font-bold py-2.5 px-6 rounded-full hover:bg-green-600 transition-colors">
                Khám phá Thực đơn
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favorites.map((fav) => {
                const meal = fav.mealId;
                if (!meal) return null; // Bỏ qua nếu dữ liệu bị lỗi

                return (
                  <Link 
                    key={fav._id} 
                    to={`/meal/${meal._id}`}
                    className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden flex flex-col relative block"
                  >
                    <div className="relative h-52 overflow-hidden bg-slate-100">
                      <img 
                        src={meal.imageUrl || 'https://via.placeholder.com/400x300'} 
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      
                      {/* Nút Hủy Yêu Thích */}
                      <button 
                        onClick={(e) => handleRemoveFavorite(e, meal._id, meal.name)}
                        className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-rose-500 hover:bg-rose-50 hover:scale-110 shadow-sm transition-all border border-white/50"
                        title="Bỏ thích"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>

                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-2 group-hover:text-green-600 transition-colors">
                        {meal.name}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-4">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {meal.prepTime + (meal.cookTime || 0)} phút
                        </span>
                      </div>

                      {/* 🎯 Hạ font tag thông số xuống semibold */}
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div className="text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">{meal.totalNutrition?.calories || 0} kcal</div>
                        <div className="text-red-500 bg-red-50 px-2 py-1 rounded-lg">P: {meal.totalNutrition?.protein || 0}g</div>
                        <div className="text-blue-500 bg-blue-50 px-2 py-1 rounded-lg">C: {meal.totalNutrition?.carbs || 0}g</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FavoritePage;