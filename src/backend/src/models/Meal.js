import mongoose from "mongoose";
import slugify from "slugify";
import Ingredient from "./Ingredient.js";

const mealSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: String, trim: true },
  
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  
  ingredients: [{
    ingredientId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Ingredient', 
      required: true 
    },
    quantity: { type: Number, required: true }, 
    unit: { type: String, required: true } 
  }],
  
  instructions: { type: [String], default: [] },
  imageUrl: { type: String },
  prepTime: { type: Number, default: 0 }, 
  cookTime: { type: Number, default: 0 }, 
  servings: { type: Number, default: 1 }, 
  
  totalNutrition: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  totalEstimatedCost: { type: Number, default: 0 },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true 
});

// 🎯 GỘP CHUNG: 1 Middleware xử lý tất cả (Không dùng next)
mealSchema.pre('save', async function() {
  
  // 1. Tự động tạo Slug
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'vi' });
  }

  // 2. Tự động tính Dinh Dưỡng & Chi Phí
  if (this.isModified('ingredients')) {
    let totalCals = 0, totalPro = 0, totalCarb = 0, totalFat = 0, totalCost = 0;

    for (let item of this.ingredients) {
      try {
        const ing = await Ingredient.findById(item.ingredientId);
        
        if (ing) {
          totalCals += ((ing.nutritionalValue?.calories || 0) * item.quantity);
          totalPro += ((ing.nutritionalValue?.protein || 0) * item.quantity);
          totalCarb += ((ing.nutritionalValue?.carbs || 0) * item.quantity);
          totalFat += ((ing.nutritionalValue?.fat || 0) * item.quantity);
          totalCost += ((ing.referencePrice || 0) * item.quantity);
        }
      } catch (err) {
        console.error("Lỗi tìm nguyên liệu khi tính tổng Meal:", err);
      }
    }

    // Gán kết quả làm tròn
    this.totalNutrition = {
      calories: parseFloat(totalCals.toFixed(2)),
      protein: parseFloat(totalPro.toFixed(2)),
      carbs: parseFloat(totalCarb.toFixed(2)),
      fat: parseFloat(totalFat.toFixed(2))
    };
    this.totalEstimatedCost = Math.round(totalCost); 
  }
});

const Meal = mongoose.model("Meal", mealSchema);
export default Meal;