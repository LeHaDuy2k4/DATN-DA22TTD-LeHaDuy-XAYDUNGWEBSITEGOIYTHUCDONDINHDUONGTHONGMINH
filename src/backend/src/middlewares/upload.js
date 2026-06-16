import multer from 'multer';
import path from 'path';
import fs from 'fs';
import slugify from 'slugify'; // 🎯 Thêm thư viện này

const uploadDir = path.join(process.cwd(), 'src', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // 1. Lấy tên gốc của ảnh (bỏ phần đuôi .png, .jpg)
    const originalName = path.parse(file.originalname).name;
    
    // 2. Làm sạch tên: Bỏ dấu tiếng Việt, thay khoảng trắng thành dấu gạch ngang
    const safeName = slugify(originalName, { lower: true, strict: true, locale: 'vi' });
    
    // 3. Ghép tên sạch + 1 đoạn timestamp ngắn + đuôi file
    const uniqueSuffix = Date.now();
    cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname)}`); 
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng tệp không hợp lệ. Vui lòng chỉ tải lên file ảnh!'), false);
  }
};

export const uploadLocal = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});