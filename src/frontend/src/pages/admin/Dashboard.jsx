import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import api from '@/lib/axios';
import { toast } from 'sonner'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    categories: 0,
    meals: 0,
    ingredients: 0,
    users: 0,
    logs: 0,
    favorites: 0
  });
  
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm xử lý dữ liệu thật: Lọc và đếm theo 6 tháng gần nhất
  const generateChartData = (usersList, mealsList) => {
    const monthsData = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      monthsData.push({
        name: `Tháng ${d.getMonth() + 1}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        users: 0,
        meals: 0
      });
    }

    usersList.forEach(user => {
      if (!user.createdAt) return;
      const createdDate = new Date(user.createdAt);
      const targetMonth = monthsData.find(m => m.month === createdDate.getMonth() && m.year === createdDate.getFullYear());
      if (targetMonth) targetMonth.users += 1;
    });

    mealsList.forEach(meal => {
      if (!meal.createdAt) return;
      const createdDate = new Date(meal.createdAt);
      const targetMonth = monthsData.find(m => m.month === createdDate.getMonth() && m.year === createdDate.getFullYear());
      if (targetMonth) targetMonth.meals += 1;
    });

    return monthsData;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('nutrifood_token');
        const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

        // 🎯 Đã gỡ bỏ catch() ẩn danh để bắt lỗi chính xác và đảm bảo FavRes được lấy đúng
        const [catRes, mealRes, ingRes, userRes, logsRes, favRes] = await Promise.allSettled([
          api.get('/categories', config),
          api.get('/meals', config),
          api.get('/ingredients', config),
          api.get('/users', config),
          api.get('/meal-logs/all', config), 
          api.get('/favorites/all', config) // 🎯 Đổi endpoint về /all giống trang Favorite_meal
        ]);

        const categoriesList = catRes.status === 'fulfilled' && catRes.value.data ? catRes.value.data : [];
        const mealsList = mealRes.status === 'fulfilled' && mealRes.value.data ? mealRes.value.data : [];
        const ingredientsList = ingRes.status === 'fulfilled' && ingRes.value.data ? ingRes.value.data : [];
        const usersList = userRes.status === 'fulfilled' && userRes.value.data ? userRes.value.data : [];
        const logsList = logsRes.status === 'fulfilled' && logsRes.value.data ? logsRes.value.data : [];
        const favsList = favRes.status === 'fulfilled' && favRes.value.data ? favRes.value.data : [];

        // Cập nhật tổng số lượng (Đã fix lỗi hiển thị số 0 của Favorites)
        setStatsData({
          categories: categoriesList.length,
          meals: mealsList.length,
          ingredients: ingredientsList.length,
          users: usersList.length,
          logs: logsList.length,
          favorites: favsList.length 
        });

        // Cập nhật biểu đồ đường/cột
        const realChartData = generateChartData(usersList, mealsList);
        setChartData(realChartData);

        // Cập nhật biểu đồ tròn
        setPieData([
          { name: 'Món Ăn', value: mealsList.length },
          { name: 'Nguyên Liệu', value: ingredientsList.length },
          { name: 'Danh Mục', value: categoriesList.length }
        ]);

      } catch (error) {
        console.error("Lỗi tải dữ liệu Dashboard:", error);
        toast.error("Không thể kết nối đến máy chủ thống kê.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { name: 'Người dùng', count: statsData.users, change: 'Thành viên hệ thống', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-purple-600 bg-purple-50' },
    { name: 'Thực đơn & Món', count: statsData.meals, change: 'Sẵn sàng gợi ý', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'text-green-600 bg-green-50' },
    { name: 'Nhật ký (Logs)', count: statsData.logs, change: 'Hoạt động ăn uống', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Món Yêu Thích', count: statsData.favorites, change: 'Tương tác người dùng', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'text-rose-600 bg-rose-50' },
  ];

  const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn pb-10 font-sans">
        
        {/* Lời chào đầu trang */}
        <div>
          {/* 🎯 Tiêu đề chuẩn text-2xl font-bold */}
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Tổng quan hệ thống</h1>
          <p className="text-slate-500 font-medium text-sm">Báo cáo hoạt động theo thời gian thực của NutriFood.</p>
        </div>

        {/* Grid 4 Thẻ Thống Kê */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${stat.color}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
                  </svg>
                </div>
              </div>
              <div>
                {/* 🎯 Số liệu thống kê chuẩn text-3xl font-bold */}
                <h3 className="text-3xl font-bold text-slate-900 mb-1">
                  {isLoading ? '-' : stat.count.toLocaleString()}
                </h3>
                <p className="text-sm font-semibold text-slate-500 mb-2">{stat.name}</p>
                <span className="text-[11px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block border border-green-100">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* KHU VỰC 2 BIỂU ĐỒ TRÁI PHẢI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Biểu đồ Vùng (Area Chart) - Tăng trưởng Người Dùng */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              {/* 🎯 Tiêu đề biểu đồ chuẩn text-2xl font-bold */}
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Tăng trưởng Người dùng</h2>
              <p className="text-sm font-medium text-slate-500">Xu hướng đăng ký tài khoản 6 tháng qua.</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="users" name="Người dùng mới" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Biểu đồ Tròn (Pie Chart) - Cấu trúc Nền tảng */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              {/* 🎯 Tiêu đề biểu đồ chuẩn text-2xl font-bold */}
              <h2 className="text-2xl font-bold text-slate-900 mb-1">Cấu trúc Nền tảng</h2>
              <p className="text-sm font-medium text-slate-500">Tỷ trọng dữ liệu giữa Món ăn, Nguyên liệu và Danh mục.</p>
            </div>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontWeight: 500, fontSize: '13px' }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Biểu đồ Cột (Bar Chart) - Phát triển Thực đơn */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-sm mt-8">
          <div className="mb-6">
            {/* 🎯 Tiêu đề biểu đồ chuẩn text-2xl font-bold */}
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Phát triển Thực đơn</h2>
            <p className="text-sm font-medium text-slate-500">Số lượng món ăn mới được cập nhật vào hệ thống.</p>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} />
                <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 500 }} />
                <Bar dataKey="meals" name="Món ăn mới" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Banner thông báo */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg shadow-green-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 mt-4">
          <div className="absolute top-0 right-0 -m-8 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -m-8 w-40 h-40 bg-green-900 opacity-20 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              {/* 🎯 Tiêu đề banner chuẩn text-2xl font-bold */}
              <h3 className="text-2xl font-bold mb-1 leading-tight">Hệ thống đang hoạt động xuất sắc!</h3>
              <p className="text-green-50 text-sm font-medium opacity-90 leading-relaxed">
                Tất cả API, tính toán dinh dưỡng tự động và thuật toán phân loại đang chạy mượt mà. Đã sẵn sàng phục vụ người dùng.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-semibold border border-white/30">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
              Trực tuyến
            </span>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default Dashboard;