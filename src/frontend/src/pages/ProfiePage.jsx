import React, { useState, useEffect } from 'react';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';
import api from '@/lib/axios'; // 
import { toast } from 'sonner';

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    height: '',
    weight: '',
    healthGoal: 'Duy trì cân nặng',
    budgetPreference: '',
    interests: ''
  });
  const [bmi, setBmi] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Lấy thông tin hồ sơ khi load trang
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        // Lấy token từ localStorage
        const token = localStorage.getItem('nutrifood_token');

        if (!token) {
          throw new Error("No token found");
        }

        // Gửi request kèm Token trong Header
        const res = await api.get('/users/me', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        
        const user = res.data.user; 
        
        setFormData({
          displayName: user.displayName || '',
          height: user.height || '',
          weight: user.weight || '',
          healthGoal: user.healthGoal || 'Duy trì cân nặng',
          budgetPreference: user.budgetPreference || '',
          interests: user.interests ? user.interests.join(', ') : ''
        });
        setBmi(user.bmi || 0);
      } catch (error) {
        console.error("Lỗi lấy hồ sơ:", error);
        toast.error("Không thể tải thông tin cá nhân. Vui lòng đăng nhập lại!");
        // Có thể điều hướng về trang login ở đây nếu cần
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, []);

  // 2. Xử lý cập nhật hồ sơ
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Xử lý mảng sở thích
      const payload = { 
        ...formData, 
        interests: formData.interests
          .split(',')
          .map(item => item.trim())
          .filter(item => item !== '') 
      };

      // Lấy token từ localStorage
      const token = localStorage.getItem('nutrifood_token');

      // Gửi request PUT kèm dữ liệu và Token
      const res = await api.put('users/profile', payload, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });
      
      // Cập nhật lại BMI mới do Backend tự động tính
      setBmi(res.data.user.bmi); 
      toast.success("Hồ sơ đã được cập nhật thành công!");
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi lưu thay đổi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm phụ: Phân loại BMI để hiển thị màu sắc
  const getBmiStatus = (bmiValue) => {
    if (bmiValue === 0) return { label: 'Chưa có dữ liệu', color: 'text-slate-500', bg: 'bg-slate-100' };
    if (bmiValue < 18.5) return { label: 'Thiếu cân', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (bmiValue >= 18.5 && bmiValue <= 24.9) return { label: 'Bình thường', color: 'text-green-700', bg: 'bg-green-100' };
    if (bmiValue >= 25 && bmiValue <= 29.9) return { label: 'Thừa cân', color: 'text-orange-700', bg: 'bg-orange-100' };
    return { label: 'Béo phì', color: 'text-red-700', bg: 'bg-red-100' };
  };

  const bmiStatus = getBmiStatus(bmi);

  return (
    <div className="font-sans text-slate-800 selection:bg-green-200 min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow relative pt-32 pb-20 lg:pt-40 lg:pb-28 bg-slate-50 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-green-400 opacity-20 blur-[100px]"></div>

        <div className="max-w-3xl mx-auto px-4 relative z-10">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold !text-green-700 mb-3">Hồ Sơ Cá Nhân</h1>
            <p className="text-slate-600">Cập nhật chỉ số cơ thể để AI cá nhân hóa thực đơn cho bạn tốt hơn.</p>
          </div>

          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Đang tải hồ sơ...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
                
                {/* Khu vực hiển thị BMI nổi bật - ĐÃ SỬA GIAO DIỆN */}
                <div className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl mb-8 shadow-inner">
                  <div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Chỉ số khối cơ thể (BMI)</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-slate-900">{bmi > 0 ? bmi.toFixed(1) : '--'}</span>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${bmiStatus.bg} ${bmiStatus.color}`}>
                        {bmiStatus.label}
                      </span>
                    </div>
                  </div>
                  
                  {/* Phần vòng tròn chứa trái tim nằm giữa */}
                  <div className="hidden sm:flex flex-shrink-0 w-20 h-20 bg-white rounded-full shadow-lg items-center justify-center border border-slate-50">
                    <svg 
                        className="w-10 h-10 text-green-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="1.5" 
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                  </div>
                </div>

                {/* Các trường nhập liệu */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên hiển thị</label>
                  <input 
                    type="text" required
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chiều cao (cm)</label>
                    <input 
                      type="number" required min="50" max="250"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Cân nặng (kg)</label>
                    <input 
                      type="number" required min="20" max="300" step="0.1"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Mục tiêu sức khỏe</label>
                    <select 
                      value={formData.healthGoal}
                      onChange={(e) => setFormData({...formData, healthGoal: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer"
                    >
                      <option value="Duy trì cân nặng">Duy trì cân nặng</option>
                      <option value="Giảm cân an toàn">Giảm cân an toàn</option>
                      <option value="Tăng cân khoa học">Tăng cân khoa học</option>
                      <option value="Tăng cơ giảm mỡ">Tăng cơ giảm mỡ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Ngân sách ăn uống (VNĐ/ngày)</label>
                    <input 
                      type="number" min="0" step="1000"
                      placeholder="VD: 150000"
                      value={formData.budgetPreference}
                      onChange={(e) => setFormData({...formData, budgetPreference: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Sở thích ẩm thực & Chế độ ăn</label>
                  <textarea 
                    rows="2"
                    placeholder="VD: Món chay, Thích hải sản, Không ăn cay..."
                    value={formData.interests}
                    onChange={(e) => setFormData({...formData, interests: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"
                  ></textarea>
                  <p className="text-xs text-slate-400 mt-2">Ngăn cách các sở thích bằng dấu phẩy (,)</p>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-green-700 transition duration-300 shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    )}
                    {isSubmitting ? 'Đang cập nhật...' : 'Lưu Hồ Sơ Sức Khỏe'}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;