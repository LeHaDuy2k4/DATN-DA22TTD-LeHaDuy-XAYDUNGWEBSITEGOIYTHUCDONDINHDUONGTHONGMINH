import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout'; 
import axios from 'axios';
import { toast } from 'sonner'; 
import { useAuthStore } from '../../stores/useAuthStores';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Lấy thông tin tài khoản đang đăng nhập
  const { user: currentUser } = useAuthStore(); 
  
  // 🎯 Đề phòng trường hợp Backend lưu id trong token dưới tên khác (userId hoặc id)
  const currentId = currentUser?._id || currentUser?.userId || currentUser?.id;

  // GỌI API LẤY DỮ LIỆU NGƯỜI DÙNG THẬT TỪ MONGODB
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('nutrifood_token');

        const res = await axios.get('http://localhost:5001/api/users', { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        
        if (res.data) {
          setUsers(res.data);
        }
      } catch (error) {
        console.error("Lỗi lấy danh sách người dùng từ Server:", error);
        toast.error("Không thể lấy dữ liệu. Hãy kiểm tra Backend!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // HÀM CẬP NHẬT PHÂN QUYỀN
  const handleUpdateRole = async (userId, currentName, newRole) => {
    if (!window.confirm(`Xác nhận cấp quyền [${newRole.toUpperCase()}] cho tài khoản ${currentName}?`)) {
      return; 
    }

    try {
      const token = localStorage.getItem('nutrifood_token');

      await axios.put(
        `http://localhost:5001/api/users/role/${userId}`, 
        { role: newRole }, 
        { 
          headers: { Authorization: `Bearer ${token}` }, 
          withCredentials: true 
        }
      );
      
      setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
      toast.success(`Đã cập nhật quyền thành công cho ${currentName}!`);
      
    } catch (error) {
      console.error("Lỗi khi cập nhật quyền:", error);
      toast.error("Cập nhật thất bại. Vui lòng kiểm tra lại quyền truy cập!");
    }
  };

  // HÀM XÓA NGƯỜI DÙNG
  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`HÀNH ĐỘNG NGUY HIỂM: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${username}" không?`)) {
      try {
        const token = localStorage.getItem('nutrifood_token');

        await axios.delete(`http://localhost:5001/api/users/${userId}`, { 
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true 
        });
        
        setUsers(users.filter(u => u._id !== userId));
        toast.success(`Đã xóa vĩnh viễn tài khoản ${username}.`);
      } catch (error) {
        console.error("Lỗi xóa người dùng:", error);
        toast.error("Không thể xóa tài khoản này.");
      }
    }
  };

  // 🎯 Hàm tiện ích lấy Tên hiển thị tốt nhất
  const getDisplayName = (u) => {
    return u.displayName || u.name || u.username || (u.email ? u.email.split('@')[0] : 'Unknown');
  };

  // LỌC DANH SÁCH TÌM KIẾM (Đã thêm lọc theo Tên hiển thị)
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const displayMatch = getDisplayName(user).toLowerCase().includes(searchLower);
    const emailMatch = user.email?.toLowerCase().includes(searchLower);
    const usernameMatch = user.username?.toLowerCase().includes(searchLower);
    
    return displayMatch || emailMatch || usernameMatch;
  });

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fadeIn">
        
        {/* Header của trang quản lý */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh sách Người dùng</h1>
            <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản và thiết lập phân quyền quản trị.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm tên, username hoặc email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 text-sm font-medium text-slate-700 placeholder-slate-400 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all w-64 md:w-72 shadow-sm"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Bảng Dữ Liệu */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Phân quyền</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500 font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang kết nối cơ sở dữ liệu...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-slate-500 font-medium">
                      Chưa có tài khoản nào hoặc không tìm thấy kết quả.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    // Kiểm tra xem dòng hiện tại có phải là người đang đăng nhập không
                    const isCurrentUser = currentId && u._id && String(currentId) === String(u._id);
                    const displayName = getDisplayName(u); // 🎯 Lấy tên hiển thị

                    return (
                      <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                        
                        {/* Cột 1: Thông tin User */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              // 🎯 Cập nhật API lấy Avatar theo Display Name thay vì Username
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff`} 
                              alt={displayName} 
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                            />
                            <div>
                              <p className="font-bold text-slate-900">
                                {displayName} 
                                {isCurrentUser && <span className="ml-2 text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">(Bạn)</span>}
                              </p>
                              {/* Hiển thị @username và email ở dòng dưới để admin dễ kiểm soát */}
                              <p className="text-xs font-medium text-slate-500">
                                {u.username && <span className="text-slate-400 mr-1">@{u.username} •</span>} 
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Cột 2: Cập nhật Role */}
                        <td className="px-6 py-4">
                          {isCurrentUser ? (
                            <span 
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 border border-purple-200 opacity-80 cursor-not-allowed"
                              title="Bạn không thể tự thay đổi quyền của chính mình"
                            >
                              Quản trị viên (Bạn)
                            </span>
                          ) : (
                            <select
                              value={u.role || 'user'}
                              onChange={(e) => handleUpdateRole(u._id, displayName, e.target.value)}
                              className={`text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border outline-none cursor-pointer transition-colors shadow-sm ${
                                u.role === 'admin' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <option value="user">Người dùng (USER)</option>
                              <option value="admin">Quản trị viên (ADMIN)</option>
                            </select>
                          )}
                        </td>

                        {/* Cột 3: Trạng thái */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-green-600 bg-green-50 border border-green-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Hoạt động
                          </span>
                        </td>

                        {/* Cột 4: Nút Xóa */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isCurrentUser && u.role !== 'admin' && (
                              <button 
                                onClick={() => handleDeleteUser(u._id, displayName)} // Sử dụng displayName trong cảnh báo xóa
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Xóa tài khoản vĩnh viễn"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="bg-white border-t border-slate-100 p-4 flex items-center justify-between text-sm text-slate-500 font-medium">
            <span>Tổng cộng: <span className="font-bold text-slate-900">{filteredUsers.length}</span> thành viên trong hệ thống</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Users;