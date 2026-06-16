import mongoose from "mongoose";

const mealLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: false // Hỗ trợ trường hợp người dùng tự nhập món ăn ngoài hệ thống
  },
  foodName: { 
    type: String,
    required: true,
    trim: true
  },
  mealType: { 
    type: String,
    enum: ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ', 'Ăn vặt'], 
    required: true
  },
  consumedAt: { 
    type: Date,
    default: Date.now,
    required: true
  },
  servingsConsumed: { 
    type: Number,
    default: 1,
    required: true,
    min: 0.1
  },
  
  // 🎯 SNAPSHOT DINH DƯỠNG: Lưu lại giá trị cố định tại thời điểm ăn
  nutritionSnapshot: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
  },
  
  notes: {
    type: String,
    trim: true
  }
}, { 
  timestamps: true 
});

// Middleware tự động bóc tách và nhân tỷ lệ dinh dưỡng (Chuẩn Mongoose Async mới)
mealLogSchema.pre('save', async function() {
  
  // 🎯 TỐI ƯU HÓA: Nếu Frontend đã gửi đủ dinh dưỡng, thoát khỏi hàm (Dùng return thay vì return next())
  if (this.nutritionSnapshot && this.nutritionSnapshot.calories > 0) {
    return;
  }

  // Nếu Frontend không gửi, tự động query Database để lấy công thức gốc
  if (this.isModified('mealId') || this.isModified('servingsConsumed')) {
    if (this.mealId) {
      const Meal = mongoose.model('Meal');
      try {
        const mealInfo = await Meal.findById(this.mealId);
        
        if (mealInfo) {
          if (!this.foodName) this.foodName = mealInfo.name;

          // Tỷ lệ = (Số phần thực tế ăn) / (Số phần chuẩn trong công thức gốc)
          const ratio = this.servingsConsumed / mealInfo.servings;
          
          this.nutritionSnapshot = {
            calories: parseFloat((mealInfo.totalNutrition.calories * ratio).toFixed(2)),
            protein: parseFloat((mealInfo.totalNutrition.protein * ratio).toFixed(2)),
            carbs: parseFloat((mealInfo.totalNutrition.carbs * ratio).toFixed(2)),
            fat: parseFloat((mealInfo.totalNutrition.fat * ratio).toFixed(2))
          };
        }
      } catch (err) {
        console.error("Lỗi tự động sao lưu dinh dưỡng trong Nhật ký bữa ăn:", err);
      }
    }
  }
});

const MealLog = mongoose.model("MealLog", mealLogSchema);
export default MealLog;