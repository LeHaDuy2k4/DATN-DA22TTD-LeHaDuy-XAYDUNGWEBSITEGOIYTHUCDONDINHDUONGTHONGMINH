import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layouts/Header';
import Footer from '@/components/layouts/Footer';

const HomePage = () => {
  return (
    <div className="font-sans text-slate-800 selection:bg-emerald-200 bg-slate-50 min-h-screen flex flex-col overflow-x-hidden">
      
      {/* 1. HEADER */}
      <Header />

      {/* ================= 2. HERO SECTION TỐI ƯU UX/UI ================= */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden flex-grow flex items-center">
        {/* Background Patterns & Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-20 left-0 right-0 mx-auto w-[600px] h-[600px] bg-emerald-400/15 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: '4s' }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-16 items-center w-full">
          
          {/* Cột trái: Nội dung & CTA */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[13px] font-bold mb-6 shadow-sm">
              <span className="flex w-2 h-2 rounded-full bg-emerald-500 mr-2.5 animate-ping"></span>
              Trợ lý Sức khỏe Thế hệ mới 2026
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6 text-slate-900">
              Thiết kế thực đơn <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-green-600">
                Chuẩn cá nhân hóa
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Giải pháp hoàn hảo ứng dụng <strong className="font-bold text-slate-800">Trí tuệ Nhân tạo (Generative AI)</strong> giúp bạn tự động hóa quy trình tư vấn và thiết lập lộ trình dinh dưỡng mỗi ngày.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                to="/signup" 
                className="bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold py-3.5 px-8 rounded-full hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-xl shadow-green-500/25 transform hover:-translate-y-1 flex items-center justify-center w-full sm:w-fit group"
              >
                Trải nghiệm miễn phí
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </Link>
              <Link 
                to="/menu" 
                className="bg-white text-slate-700 border border-slate-200 font-bold py-3.5 px-8 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all duration-300 shadow-sm flex items-center justify-center w-full sm:w-fit"
              >
                Khám phá thực đơn
              </Link>
            </div>
          </div>
          
          {/* Cột phải: Hình ảnh Tối giản */}
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-green-50 rounded-[3rem] transform rotate-3 scale-105 -z-10 shadow-inner"></div>
            
            <img 
              src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop" 
              alt="Healthy Food" 
              className="rounded-[3rem] shadow-2xl shadow-slate-300/50 object-cover h-[540px] w-full border border-white/50 relative z-10 animate-slideUp"
            />
          </div>

        </div>
      </section>

      {/* ================= 3. FEATURES SECTION ================= */}
      <section id="features" className="py-24 px-4 bg-white border-t border-slate-100/60 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-sm font-bold text-emerald-600 uppercase tracking-widest mb-3">Tính Năng Cốt Lõi</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight">MỌI THỨ BẠN CẦN ĐỂ CÓ MỘT  <br className="hidden sm:block"/> LỐI SỐNG LÀNH MẠNH</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            
            {/* Card 1: Gợi Ý Cá Nhân Hóa */}
            <Link to="/recommendations" className="block group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-200 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-400 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-8 group-hover:scale-110 transition-transform duration-300 border border-emerald-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-emerald-600 transition-colors">Gợi Ý Cá Nhân Hóa</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Áp dụng thuật toán Hybrid Recommendation giúp đề xuất thực đơn bám sát mục tiêu sức khỏe, sở thích và chỉ số BMI của riêng bạn.</p>
              <div className="mt-8 flex items-center text-sm font-bold text-emerald-600 transition-transform group-hover:translate-x-1">
                Trải nghiệm ngay <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </Link>

            {/* Card 2: Lộ Trình Tuần */}
            <Link to="/meal-plan" className="block group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-green-200 hover:shadow-2xl hover:shadow-green-900/5 transition-all duration-400 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-8 group-hover:scale-110 transition-transform duration-300 border border-green-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-green-600 transition-colors">Lộ Trình Tuần (AI)</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Ứng dụng Generative AI để tự động thiết kế lộ trình thực đơn chi tiết cho cả tuần, tối ưu lượng calo và đa dạng hóa món ăn.</p>
              <div className="mt-8 flex items-center text-sm font-bold text-green-600 transition-transform group-hover:translate-x-1">
                Khám phá ngay <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </Link>

            {/* Card 3: Trợ Lý Ảo Chatbot */}
            <Link to="/chatbot" className="block group bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-900/5 transition-all duration-400 hover:-translate-y-2 cursor-pointer">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl flex items-center justify-center text-teal-600 mb-8 group-hover:scale-110 transition-transform duration-300 border border-teal-100">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-teal-600 transition-colors">Trợ Lý Ảo Chatbot</h3>
              <p className="text-slate-600 font-medium leading-relaxed">Tích hợp mô hình ngôn ngữ lớn (LLMs) hỗ trợ hỏi đáp, hướng dẫn công thức và tư vấn kiến thức dinh dưỡng bằng ngôn ngữ tự nhiên.</p>
              <div className="mt-8 flex items-center text-sm font-bold text-teal-600 transition-transform group-hover:translate-x-1">
                Trò chuyện ngay <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </div>
            </Link>

          </div>
        </div>
      </section>
      
      {/* 4. FOOTER */}
      <Footer/>

      {/* Animation CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-slideUp { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(30px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
      `}} />
    </div>
  );
};

export default HomePage;