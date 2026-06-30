import multer from 'multer';

// 1. Dùng memoryStorage để giữ file tạm trong RAM (Không lưu xuống ổ cứng)
const storage = multer.memoryStorage();

// 2. Bộ lọc (Filter): Chỉ cho phép người dùng tải lên các định dạng hình ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng tệp không hợp lệ. Vui lòng chỉ tải lên file ảnh!'), false);
  }
};

// 3. Xuất cấu hình upload để sử dụng trong Routes
export const uploadLocal = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 🎯 Giới hạn dung lượng 5MB để không làm nặng Database
});