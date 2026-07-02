import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
// Nhập Header và Footer
import Header from '@/components/layouts/Header'; 
import Footer from '@/components/layouts/Footer';

const MenuPage = () => {
  // --- ĐỌC DỮ LIỆU TỪ URL ---
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search'); // Lấy từ khóa tìm kiếm từ Header truyền xuống

  const [categories, setCategories] = useState([]);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || 'all');

  // 🎯 Ref và State dùng cho 2 nút cuộn ngang < >
  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 🎯 HÀM LỌC ẢNH THEO MÔI TRƯỜNG
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x300?text=NutriFood';
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

  // LẮNG NGHE SỰ THAY ĐỔI CỦA URL (Đặc biệt khi tìm kiếm từ Header)
  useEffect(() => {
    setSelectedCategory(categoryFromUrl || 'all');
  }, [categoryFromUrl, searchFromUrl]);

  // 1. GỌI API LẤY DỮ LIỆU DANH MỤC VÀ MÓN ĂN
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setIsLoading(true);
        const [catRes, mealRes] = await Promise.allSettled([
          api.get('/categories'),
          api.get('/meals')
        ]);

        if (catRes.status === 'fulfilled' && catRes.value.data) {
          // Lọc bỏ danh mục bị ẩn
          const activeCategories = catRes.value.data.filter(cat => cat.isActive !== false);
          setCategories(activeCategories);
        }

        if (mealRes.status === 'fulfilled' && mealRes.value.data) {
          // 🎯 LỌC BỎ NHỮNG MÓN ĂN ĐÃ BỊ ADMIN ẨN (isActive === false)
          const activeMeals = mealRes.value.data.filter(meal => meal.isActive !== false);
          setMeals(activeMeals);
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu Menu:", error);
        toast.error("Không thể tải thực đơn. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  // 2. LOGIC LỌC MÓN ĂN (Sử dụng trực tiếp searchFromUrl thay vì state searchTerm cũ)
  const filteredMeals = meals.filter(meal => {
    // Lọc theo từ khóa tìm kiếm từ Header
    const matchSearch = searchFromUrl 
      ? meal.name?.toLowerCase().includes(searchFromUrl.toLowerCase()) 
      : true;
    
    // Lọc theo danh mục
    let matchCategory = true;
    if (selectedCategory !== 'all') {
      matchCategory = meal.categoryIds?.some(cat => 
        (cat._id || cat) === selectedCategory
      );
    }

    return matchSearch && matchCategory;
  });

  // Xử lý Click Danh mục
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    
    // Giữ lại search param hiện tại (nếu có), chỉ đổi category
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    setSearchParams(searchParams);
  };

  // --- LOGIC XỬ LÝ 2 NÚT BẤM CUỘN NGANG ---
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth' 
      });
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [categories]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />
      
      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Tiêu đề trang (Gọn nhẹ & Thông báo kết quả tìm kiếm) */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Khám phá Thực đơn</h1>
            
            {/* Hiển thị thông báo khi có từ khóa tìm kiếm từ Header */}
            {searchFromUrl && (
              <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <span className="text-sm font-semibold text-green-700">
                  Kết quả cho: <span className="text-slate-900">"{searchFromUrl}"</span>
                </span>
                <button 
                  onClick={() => {
                    searchParams.delete('search');
                    setSearchParams(searchParams);
                  }}
                  className="ml-2 text-green-600 hover:text-red-500 transition-colors"
                  title="Xóa tìm kiếm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}
          </div>

          {/* --- THANH DANH MỤC (LƯỚT NGANG CÓ 2 NÚT BẤM) --- */}
          <div className="mb-8 relative group">
            
            {showLeftArrow && (
              <button 
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all hidden sm:flex"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}

            {showLeftArrow && <div className="absolute top-0 left-0 bottom-0 w-12 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none hidden sm:block"></div>}
            {showRightArrow && <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none hidden sm:block"></div>}

            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto hide-scrollbar gap-3 pb-3 pt-1 px-4 -mx-4 sm:px-0 sm:mx-0"
            >
              <button
                onClick={() => handleCategoryClick('all')}
                className={`flex-shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === 'all' 
                    ? 'bg-green-600 text-white shadow-md shadow-green-600/30' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                Tất cả món ăn
              </button>
              
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => handleCategoryClick(cat._id)}
                  className={`flex-shrink-0 whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat._id 
                      ? 'bg-green-600 text-white shadow-md shadow-green-600/30' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {showRightArrow && (
              <button 
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 text-slate-600 hover:text-green-600 hover:bg-green-50 transition-all hidden sm:flex"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </div>

          {/* --- LƯỚI MÓN ĂN --- */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="h-6 bg-slate-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMeals.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Không tìm thấy món ăn nào</h3>
              <p className="text-slate-500 font-medium text-sm">Thử chọn danh mục khác hoặc tìm kiếm với từ khóa khác nhé.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredMeals.map((meal) => (
                <Link 
                  key={meal._id} 
                  to={`/meal/${meal._id}`}
                  className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden cursor-pointer flex flex-col block"
                >
                  
                  {/* Khu vực Hình ảnh */}
                  <div className="relative h-52 overflow-hidden bg-slate-100">
                    <img 
                      src={getImageUrl(meal.imageUrl)} 
                      alt={meal.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {meal.totalNutrition?.calories && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl font-bold text-xs text-orange-600 shadow-sm border border-white/50">
                        {meal.totalNutrition.calories} kcal
                      </div>
                    )}
                    
                    <button 
                      onClick={(e) => {
                        e.preventDefault(); 
                        e.stopPropagation(); 
                        toast.info("Vào trang chi tiết món ăn để thả tim nhé! ❤️");
                      }}
                      className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-rose-500 hover:bg-white shadow-sm transition-colors border border-white/50"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>

                  {/* Khu vực Thông tin */}
                  <div className="p-5 flex flex-col flex-grow">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1 mb-2 group-hover:text-green-600 transition-colors">
                      {meal.name}
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-4">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {meal.prepTime + (meal.cookTime || 0)} phút
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        {meal.servings || 1} phần
                      </span>
                    </div>

                    {meal.totalNutrition && (
                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div className="text-red-500 bg-red-50 px-2.5 py-1 rounded-lg">P: {meal.totalNutrition.protein}g</div>
                        <div className="text-blue-500 bg-blue-50 px-2.5 py-1 rounded-lg">C: {meal.totalNutrition.carbs}g</div>
                        <div className="text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">F: {meal.totalNutrition.fat}g</div>
                      </div>
                    )}
                  </div>

                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
};

export default MenuPage;