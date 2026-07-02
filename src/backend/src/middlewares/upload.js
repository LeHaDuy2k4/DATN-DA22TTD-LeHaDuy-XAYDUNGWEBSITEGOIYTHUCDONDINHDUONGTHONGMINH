import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import path from 'path';
import fs from 'fs';
import slugify from 'slugify';
import 'dotenv/config'; 

// ==========================================
// 1. CẤU HÌNH CLOUDINARY (Dành cho Production / Render)
// ==========================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'NutriFood', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

// ==========================================
// 2. CẤU HÌNH LOCAL STORAGE (Dành cho Development / Localhost)
// ==========================================
const uploadDir = path.join(process.cwd(), 'src', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    const originalName = path.parse(file.originalname).name;
    const safeName = slugify(originalName, { lower: true, strict: true, locale: 'vi' });
    const uniqueSuffix = Date.now();
    cb(null, `${safeName}-${uniqueSuffix}${path.extname(file.originalname)}`); 
  }
});

// ==========================================
// 3. TỰ ĐỘNG CHUYỂN MẠCH THEO MÔI TRƯỜNG
// ==========================================
// Nếu môi trường là production (trên Render), dùng Cloudinary. Nếu không, dùng ổ cứng.
const isProduction = process.env.NODE_ENV === 'production';
const storage = isProduction ? cloudinaryStorage : diskStorage;

// Bộ lọc file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng tệp không hợp lệ. Vui lòng chỉ tải lên file ảnh!'), false);
  }
};

// Khởi tạo Middleware
export const uploadLocal = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } 
});