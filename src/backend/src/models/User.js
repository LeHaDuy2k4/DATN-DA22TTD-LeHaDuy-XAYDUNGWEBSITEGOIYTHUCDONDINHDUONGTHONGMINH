import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // 1. Thông tin xác thực cơ bản
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
  },
  hashedPassword: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // Phân quyền người dùng và quản trị viên 
  },

  // 2. Hồ sơ sức khỏe và chỉ số BMI [cite: 24, 83]
  height: {
    type: Number, // Đơn vị: cm
    default: 0,
  },
  weight: {
    type: Number, // Đơn vị: kg
    default: 0,
  },
  bmi: {
    type: Number,
    default: 0,
  },

  // 3. Cá nhân hóa nhu cầu dinh dưỡng và ngân sách [cite: 13, 66, 90]
  healthGoal: {
    type: String,
    enum: [
      'Duy trì cân nặng', 
      'Giảm cân an toàn', 
      'Tăng cân khoa học', 
      'Tăng cơ giảm mỡ'
    ],
    default: 'Duy trì cân nặng',
  },
  budgetPreference: {
    type: Number, // Mức chi tiêu ăn uống hợp lý [cite: 83]
    default: 0,
  },
  interests: {
    type: [String], // Sở thích ăn uống hoặc chế độ ăn đặc biệt [cite: 83, 90]
    default: [],
  },

  // 4. Quản lý trạng thái hệ thống
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  // Tự động quản lý createdAt và updatedAt để phục vụ bảng thống kê Admin [cite: 25, 86]
  timestamps: true 
});

/**
 * Middleware tự động tính toán chỉ số BMI trước khi lưu hồ sơ 
 * Đã sửa lỗi "next is not a function" bằng cách sử dụng async function 
 */
userSchema.pre('save', async function() {
  if (this.height > 0 && this.weight > 0) {
    // Công thức: BMI = Cân nặng (kg) / (Chiều cao (m) * Chiều cao (m))
    const heightInMeters = this.height / 100;
    const calculatedBmi = this.weight / (heightInMeters * heightInMeters);
    this.bmi = calculatedBmi.toFixed(2);
  }
});

const User = mongoose.model("User", userSchema);

export default User;