import mongoose from "mongoose";
import slugify from "slugify";

const ingredientSchema = new mongoose.Schema({
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
  // Đơn vị đo lường chuẩn (VD: 100g, 1kg, 1 lít, 1 quả)
  baseUnit: {
    type: String,
    required: true,
    default: '100g', 
  },
  // Giá tham khảo tính trên 1 đơn vị chuẩn (baseUnit)
  referencePrice: {
    type: Number,
    required: true,
    default: 0,
  },
  // Nhóm giá trị dinh dưỡng (Tính trên 1 baseUnit)
  nutritionalValue: {
    calories: { type: Number, default: 0 }, // Lượng Calo (kcal)
    protein: { type: Number, default: 0 },  // Đạm (g)
    carbs: { type: Number, default: 0 },    // Tinh bột (g)
    fat: { type: Number, default: 0 },      // Chất béo (g)
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

// Middleware tự động tạo slug từ tên nguyên liệu
ingredientSchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'vi' });
  }
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);
export default Ingredient;