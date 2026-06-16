import mongoose from "mongoose";

const mealPlanSchema = new mongoose.Schema({
  // Tham chiếu User yêu cầu tạo lộ trình
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Đánh index để truy vấn lịch sử thực đơn của User nhanh hơn
  },

  // Chu kỳ thời gian áp dụng của thực đơn (thường là 7 ngày)
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },

  // Mảng dữ liệu cấu trúc lồng nhau (Nested Object) chứa thực đơn chi tiết
  dailyMenus: [{
    dayNumber: { 
      type: Number, 
      required: true // Ví dụ: Ngày 1, Ngày 2... Ngày 7
    },
    date: { 
      type: Date // Ngày cụ thể để dễ hiển thị trên UI
    },
    meals: [{
      mealType: { 
        type: String, 
        enum: ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'],
        required: true
      },
      mealId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Meal',
        required: true // Gắn kết chặt chẽ với bảng Meal
      }
    }]
  }],

  // Tổng lượng năng lượng trung bình ước tính mỗi ngày của lộ trình
  totalDailyCalories: {
    type: Number,
    required: true,
    default: 0
  },

  // Cờ đánh dấu thực đơn do LLM tạo (false) hay do Cơ chế dự phòng lỗi 503 (true)
  isGeneratedByFallback: {
    type: Boolean,
    default: false
  }
}, {
  // Tự động tạo trường createdAt và updatedAt
  timestamps: true 
});

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);

export default MealPlan;