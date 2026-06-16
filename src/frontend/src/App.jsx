// src/App.jsx
import { Toaster } from 'sonner';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import SignInPage from '@/pages/SignInPage';
import SignUpPage from '@/pages/SignUpPage';
import Dashboard from '@/pages/admin/Dashboard';
import User from '@/pages/admin/User';
import Category from '@/pages/admin/Category';
import ProfilePage from '@/pages/ProfiePage';
import Ingredient from '@/pages/admin/Ingredient';
import Meals from '@/pages/admin/Meal';
import Meal_log from '@/pages/admin/Meal_log';
import Favorite_meal from '@/pages/admin/Favorite_meal';
import MenuPage from '@/pages/MenuPage';
import MealDetailPage from '@/pages/MealDetailPage';
import RecommendationsPage from '@/pages/RecommendationsPage';
import FavoritePage from '@/pages/FavoritePage';
import MealLogPage from '@/pages/MealLogPage';
import MealPlanPage from '@/pages/MealPlanPage';
import ChatbotPage from '@/pages/ChatbotPage';
function App() {
  return (
    <>
      {/* Toaster nằm ngoài để không bị ảnh hưởng bởi logic chuyển trang */}
      <Toaster position="top-right" richColors />
      
      <BrowserRouter>
        {/* Header đặt ở đây để luôn hiển thị ở mọi Route */}
        
        <main>
          <Routes>
            {/* Mỗi trang phải có một path riêng biệt */}
            <Route path='/' element={<HomePage />} />
            <Route path='/signin' element={<SignInPage />} />
            <Route path='/signup' element={<SignUpPage />} />
            <Route path='/profile' element={<ProfilePage/>} />
             <Route path='/admin' element={<Dashboard />} />
              <Route path='/admin/users' element={<User/>} />
              <Route path='/admin/categories' element={<Category/>} />
              <Route path='/admin/ingredients' element={<Ingredient/>} />
              <Route path='/admin/meals' element={<Meals/>} />
              <Route path="/admin/meal_logs" element={<Meal_log />} />
              <Route path="/admin/favorite_meals" element={<Favorite_meal />} />
               <Route path="/menu" element={<MenuPage />} />
               <Route path="/meal/:id" element={<MealDetailPage />} />
               <Route path="/recommendations" element={<RecommendationsPage />} />
               <Route path="/favorites" element={<FavoritePage />} />
               <Route path="/meal-logs" element={<MealLogPage />} />
               <Route path="/meal-plan" element={<MealPlanPage />} />
                <Route path="/chatbot" element={<ChatbotPage />} />
            {/* Trang 404 nếu gõ sai link */}
            <Route path='*' element={<HomePage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </>
  );
}

export default App;