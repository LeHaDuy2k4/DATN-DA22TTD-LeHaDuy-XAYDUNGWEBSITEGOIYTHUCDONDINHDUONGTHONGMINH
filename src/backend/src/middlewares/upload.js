import multer from 'multer';
import path from 'path';
import fs from 'fs';
import slugify from 'slugify';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import 'dotenv/config';

// 🎯 KIỂM TRA XEM CÓ CHÌA KHÓA CLOUDINARY KHÔNG
const hasCloudinaryKeys = !!process.env.CLOUDINARY_API_KEY;

// ==========================================
// 1. KHO LƯU TRỮ CLOUDINARY (Chỉ khởi tạo khi có Key)
// ==========================================
if (hasCloudinaryKeys) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const cloudStorage = hasCloudinaryKeys ? new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'NutriFood', 
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
}) : null;

// ==========================================
// 2. KHO LƯU TRỮ LOCAL (Dùng cho Localhost)
// ==========================================
const uploadDir = path.join(process.cwd(), 'src', 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const localDiskStorage = multer.diskStorage({
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
// 3. TỰ ĐỘNG CHỌN KHO LƯU TRỮ
// ==========================================
const storage = hasCloudinaryKeys ? cloudStorage : localDiskStorage;

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