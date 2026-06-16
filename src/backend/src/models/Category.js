import mongoose from "mongoose";
import slugify from "slugify";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  type: {
    type: String,
    // LƯU Ý: Phải gửi đúng 1 trong 4 giá trị này từ Postman/Frontend
    enum: ['Bữa ăn theo buổi', 'Chế độ sức khỏe', 'Loại món ăn', 'Ngân sách'],
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true 
});

// SỬA LỖI TẠI ĐÂY: Sử dụng function truyền thống và không cần tham số next
categorySchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'vi' });
  }
});

const Category = mongoose.model("Category", categorySchema);
export default Category;