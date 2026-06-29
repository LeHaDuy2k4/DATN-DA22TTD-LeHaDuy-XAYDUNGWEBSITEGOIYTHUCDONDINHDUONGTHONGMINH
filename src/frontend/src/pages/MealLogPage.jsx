import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStores';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const MealLogPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const todayStr = new Date().toLocaleDateString('en-CA'); 

  // --- STATES CHÍNH ---
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [logs, setLogs] = useState([]);
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATES CHO TÍNH NĂNG THÊM/XÓA MÓN THÔNG MINH ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableMeals, setAvailableMeals] = useState([]); 
  const [logToDelete, setLogToDelete] = useState(null); // 🎯 Thêm State quản lý Modal Xóa
  
  const [manualMeal, setManualMeal] = useState({
    mealId: '', 
    foodName: '', 
    mealType: 'Bữa sáng', 
    servings: 1, 
    calories: '', protein: '', carbs: '', fat: '', notes: ''
  });

  const fetchDailyLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('nutrifood_token');
      const res = await api.get(`/meal-logs/daily?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(res.data.logs || []);
      setDailyTotals(res.data.dailyTotals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch (error) {
      toast.error("Không thể tải dữ liệu nhật ký.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  const fetchAvailableMeals = async () => {
    try {
      const res = await api.get('/meals');
      setAvailableMeals(res.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách món ăn:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      toast.warning("Bạn cần đăng nhập để xem nhật ký!");
      navigate('/signin');
      return;
    }
    fetchDailyLogs();
    fetchAvailableMeals(); 
  }, [user, navigate, fetchDailyLogs]);

  const handleMealSelection = (e) => {
    const selectedMealId = e.target.value;
    if (!selectedMealId) {
      setManualMeal({
        ...manualMeal, mealId: '', foodName: '', calories: '', protein: '', carbs: '', fat: ''
      });
      return;
    }
    const meal = availableMeals.find(m => m._id === selectedMealId);
    if (meal) {
      const multiplier = manualMeal.servings || 1;
      setManualMeal({
        ...manualMeal,
        mealId: meal._id,
        foodName: meal.name,
        calories: Math.round((meal.totalNutrition?.calories || 0) * multiplier),
        protein: Math.round((meal.totalNutrition?.protein || 0) * multiplier),
        carbs: Math.round((meal.totalNutrition?.carbs || 0) * multiplier),
        fat: Math.round((meal.totalNutrition?.fat || 0) * multiplier),
      });
    }
  };

  const handleServingsChange = (e) => {
    const newServings = Number(e.target.value) || 1;
    if (manualMeal.mealId) {
      const meal = availableMeals.find(m => m._id === manualMeal.mealId);
      if (meal) {
        setManualMeal({
          ...manualMeal,
          servings: newServings,
          calories: Math.round((meal.totalNutrition?.calories || 0) * newServings),
          protein: Math.round((meal.totalNutrition?.protein || 0) * newServings),
          carbs: Math.round((meal.totalNutrition?.carbs || 0) * newServings),
          fat: Math.round((meal.totalNutrition?.fat || 0) * newServings),
        });
        return;
      }
    }
    setManualMeal({ ...manualMeal, servings: newServings });
  };

  // 🎯 HÀM XÁC NHẬN XÓA TỪ MODAL UI
  const confirmDeleteLog = async () => {
    if (!logToDelete) return;
    try {
      const token = localStorage.getItem('nutrifood_token');
      await api.delete(`/meal-logs/${logToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Đã xóa bản ghi thành công.");
      setLogToDelete(null); // Đóng modal sau khi xóa
      fetchDailyLogs(); 
    } catch (error) {
      toast.error("Lỗi hệ thống khi xóa bản ghi.");
      setLogToDelete(null); // Đóng modal khi lỗi
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualMeal.foodName) return toast.error("Vui lòng chọn hoặc nhập tên món ăn!");

    try {
      const token = localStorage.getItem('nutrifood_token');
      const payload = {
        mealId: manualMeal.mealId || null, 
        foodName: manualMeal.foodName.trim(),
        mealType: manualMeal.mealType, 
        servingsConsumed: manualMeal.servings,
        consumedAt: new Date(selectedDate).toISOString(),
        notes: manualMeal.notes.trim(),
        nutritionSnapshot: {
          calories: Math.max(0, Number(manualMeal.calories) || 0),
          protein: Math.max(0, Number(manualMeal.protein) || 0),
          carbs: Math.max(0, Number(manualMeal.carbs) || 0),
          fat: Math.max(0, Number(manualMeal.fat) || 0),
        }
      };

      const response = await api.post('/meal-logs', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(response.data.message || "Đã thêm món ăn vào nhật ký!");
      setIsAddModalOpen(false);
      
      setManualMeal({ mealId: '', foodName: '', mealType: 'Bữa sáng', servings: 1, calories: '', protein: '', carbs: '', fat: '', notes: '' });
      fetchDailyLogs();
    } catch (error) {
      if (error.response && error.response.data && !error.response.data.success) {
        toast.error(error.response.data.message); 
      } else {
        toast.error("Lỗi khi ghi nhận món ăn.");
      }
    }
  };

  const renderMealTypeBadge = (type) => {
    const badges = {
      'bữa sáng': 'bg-yellow-100 text-yellow-700',
      'bữa trưa': 'bg-orange-100 text-orange-700',
      'bữa tối': 'bg-indigo-100 text-indigo-700',
      'bữa phụ': 'bg-pink-100 text-pink-700'
    };
    const style = badges[type?.toLowerCase()] || 'bg-slate-100 text-slate-700';
    return <span className={`${style} px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider`}>{type || 'Khác'}</span>;
  };

  return (
    <div className="font-sans text-slate-800 selection:bg-green-200 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-28 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Bảng Điều Khiển Dinh Dưỡng</h1>
              <p className="text-slate-500 font-medium">Quản lý nhật ký ăn uống hàng ngày.</p>
            </div>
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 flex items-center gap-2">
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-xl px-4 py-2 focus:outline-none focus:border-green-500 [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <button 
                onClick={() => setSelectedDate(todayStr)}
                className={`px-4 py-2 font-semibold rounded-xl transition-colors ${selectedDate === todayStr ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Hôm nay
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Calories Đã Nạp', value: dailyTotals.calories, unit: 'kcal', color: 'orange' },
              { label: 'Protein', value: dailyTotals.protein, unit: 'gam', color: 'red' },
              { label: 'Carbs', value: dailyTotals.carbs, unit: 'gam', color: 'blue' },
              { label: 'Fat', value: dailyTotals.fat, unit: 'gam', color: 'amber' }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                <p className="text-slate-500 text-sm font-semibold mb-1">{item.label}</p>
                <p className={`text-2xl font-bold text-${item.color}-500`}>{Math.round(item.value)}</p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{item.unit}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-b from-green-50 to-white rounded-[2rem] border border-green-100 p-8 flex flex-col justify-center items-center text-center">
              <span className="text-5xl mb-4">🥗</span>
              <h2 className="text-xl font-bold text-green-800 mb-2">Lộ trình AI</h2>
              <p className="text-slate-600 text-sm mb-6 max-w-sm font-medium">Dùng hệ thống Trí tuệ nhân tạo để thiết kế thực đơn chuẩn khoa học cho riêng bạn.</p>
              <button onClick={() => navigate('/meal-plan')} className="bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 shadow-md">Khám phá Lộ trình AI</button>
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">📝 Thực Tế Đã Ăn</h2>
                <button onClick={() => setIsAddModalOpen(true)} className="bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-xl hover:bg-slate-200 transition">+ Thêm Món</button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-500 rounded-full animate-spin"></div></div>
              ) : logs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center opacity-60">
                  <p className="text-slate-500 font-medium text-sm">Chưa có bản ghi nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log._id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {renderMealTypeBadge(log.mealType)}
                          <p className="font-semibold text-slate-800">{log.foodName}</p>
                        </div>
                        <p className="text-xs font-medium text-slate-500">
                          {Math.round(log.nutritionSnapshot?.calories || 0)} kcal
                          {log.notes && <span className="italic ml-2 text-slate-400">({log.notes})</span>}
                        </p>
                      </div>
                      
                      {/* 🎯 SỰ KIỆN NÚT XÓA: Chỉ bật Modal thay vì hỏi window.confirm */}
                      <button onClick={() => setLogToDelete({ id: log._id, name: log.foodName })} className="text-slate-400 hover:text-rose-500 p-2 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 🎯 MODAL THÊM MÓN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-900">Thêm Món Ăn</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleManualSubmit} className="p-6 space-y-5 bg-slate-50">
              
              <div className="bg-white p-4 rounded-2xl border border-green-100 shadow-sm">
                <label className="block text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">🔍 Tra cứu món ăn từ Hệ thống</label>
                <select 
                  value={manualMeal.mealId} 
                  onChange={handleMealSelection} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-green-500 outline-none cursor-pointer"
                >
                  <option value="">-- Chọn món hoặc Tự nhập thông tin bên dưới --</option>
                  {availableMeals.map(meal => (
                    <option key={meal._id} value={meal._id}>
                      {meal.name} ({meal.totalNutrition?.calories || 0} kcal/phần)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tên món ăn <span className="text-rose-500">*</span></label>
                  <input required type="text" value={manualMeal.foodName} onChange={(e) => setManualMeal({...manualMeal, foodName: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-green-500 outline-none" placeholder="VD: Bánh mì chả lụa" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bữa ăn</label>
                  <select value={manualMeal.mealType} onChange={(e) => setManualMeal({...manualMeal, mealType: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-green-500 outline-none">
                    <option value="Bữa sáng">Sáng</option>
                    <option value="Bữa trưa">Trưa</option>
                    <option value="Bữa tối">Tối</option>
                    <option value="Bữa phụ">Ăn vặt (Phụ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Số phần ăn</label>
                  <input type="number" min="0.5" step="0.5" value={manualMeal.servings} onChange={handleServingsChange} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:border-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tổng Calories</label>
                  <input type="number" min="0" value={manualMeal.calories} onChange={(e) => setManualMeal({...manualMeal, calories: e.target.value})} className="w-full bg-orange-50 border border-orange-200 text-orange-700 rounded-xl px-4 py-3 text-sm font-semibold focus:border-orange-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pro (g)</label>
                  <input type="number" min="0" value={manualMeal.protein} onChange={(e) => setManualMeal({...manualMeal, protein: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:border-green-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Carb (g)</label>
                  <input type="number" min="0" value={manualMeal.carbs} onChange={(e) => setManualMeal({...manualMeal, carbs: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:border-green-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fat (g)</label>
                  <input type="number" min="0" value={manualMeal.fat} onChange={(e) => setManualMeal({...manualMeal, fat: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:border-green-500 outline-none" placeholder="0" />
                </div>
              </div>

              <div className="pt-2 mt-4 flex gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50">Hủy</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-green-600 transition-colors">Lưu món vào nhật ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎯 MODAL XÁC NHẬN XÓA ĐẸP MẮT */}
      {logToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden text-center p-6 transform transition-all scale-100">
            <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
              Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-800">"{logToDelete.name}"</span> khỏi nhật ký hôm nay không?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLogToDelete(null)} 
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Hủy
              </button>
              <button 
                onClick={confirmDeleteLog} 
                className="flex-1 px-4 py-3 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition shadow-md shadow-rose-200"
              >
                Đồng ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MealLogPage;