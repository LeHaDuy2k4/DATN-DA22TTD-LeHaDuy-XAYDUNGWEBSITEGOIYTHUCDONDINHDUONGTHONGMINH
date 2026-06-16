import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import axios from 'axios';
import { toast } from 'sonner'; 

const Dashboard = () => {
  // State lưu trữ dữ liệu đếm tổng
  const [statsData, setStatsData] = useState({
    categories: 0,
    meals: 0,
    ingredients: 0,
    users: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // GỌI API LẤY DỮ LIỆU THẬT
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('nutrifood_token');
        const config = { headers: { Authorization: `Bearer ${token}` }, withCredentials: true };

        // Chạy song song 4 API
        const [catRes, mealRes, ingRes, userRes] = await Promise.allSettled([
          axios.get('http://localhost:5001/api/categories', config),
          axios.get('http://localhost:5001/api/meals', config),
          axios.get('http://localhost:5001/api/ingredients', config),
          axios.get('http://localhost:5001/api/users', config) 
        ]);

        // Cập nhật state tổng số lượng
        setStatsData({
          categories: catRes.status === 'fulfilled' && catRes.value.data ? catRes.value.data.length : 0,
          meals: mealRes.status === 'fulfilled' && mealRes.value.data ? mealRes.value.data.length : 0,
          ingredients: ingRes.status === 'fulfilled' && ingRes.value.data ? ingRes.value.data.length : 0,
          users: userRes.status === 'fulfilled' && userRes.value.data ? userRes.value.data.length : 0
        });

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
    { name: 'Danh mục', count: statsData.categories, change: 'Đang hoạt động', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16', color: 'text-blue-600 bg-blue-50' },
    { name: 'Thực đơn & Món ăn', count: statsData.meals, change: 'Sẵn sàng gợi ý', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', color: 'text-green-600 bg-green-50' },
    { name: 'Kho nguyên liệu', count: statsData.ingredients, change: 'Đã chuẩn hóa vi chất', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'text-orange-600 bg-orange-50' },
    { name: 'Người dùng', count: statsData.users, change: 'Thành viên hệ thống', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fadeIn pb-10">
        
        {/* Lời chào đầu trang */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tổng quan hệ thống</h1>
          <p className="text-slate-500 text-sm mt-2">Báo cáo hoạt động theo thời gian thực của NutriFood.</p>
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
                <h3 className="text-3xl font-black text-slate-900 mb-1">
                  {isLoading ? '-' : stat.count.toLocaleString()}
                </h3>
                <p className="text-sm font-bold text-slate-500 mb-2">{stat.name}</p>
                <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block border border-green-100">
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Banner thông báo (Đã điều chỉnh thành full-width) */}
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
              <h3 className="text-2xl font-bold mb-1 leading-tight">Hệ thống đang hoạt động xuất sắc!</h3>
              <p className="text-green-50 text-sm font-medium opacity-90 leading-relaxed">
                Tất cả API, tính toán dinh dưỡng tự động và thuật toán phân loại đang chạy mượt mà. Đã sẵn sàng phục vụ người dùng.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold border border-white/30">
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