import mongoose from "mongoose";

const favoriteMealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: true
  }
}, { 
  timestamps: true 
});

// 🎯 ĐẢM BẢO HIỆU NĂNG & LOGIC: Một người dùng không thể thích cùng một món ăn hai lần
favoriteMealSchema.index({ userId: 1, mealId: 1 }, { unique: true });

const FavoriteMeal = mongoose.model("FavoriteMeal", favoriteMealSchema);
export default FavoriteMeal;