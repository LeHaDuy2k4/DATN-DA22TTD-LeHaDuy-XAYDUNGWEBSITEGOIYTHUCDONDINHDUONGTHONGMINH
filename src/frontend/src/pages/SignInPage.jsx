import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SigninForm } from "@/components/auth/signin-form"; // Điều chỉnh đường dẫn của bạn
import { useAuthStore } from '@/stores/useAuthStores';

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn, loading } = useAuthStore();

  const handleLoginSubmit = async (username, password) => {
    try {
      await signIn(username, password);
      navigate('/'); // Đăng nhập mượt mà thì đưa về trang chủ liền
    } catch (err) {
      console.error("Lỗi điều hướng đăng nhập tại Page:", err);
    }
  };

  return (
    <SigninForm signInFn={handleLoginSubmit} isLoading={loading} />
  );
}