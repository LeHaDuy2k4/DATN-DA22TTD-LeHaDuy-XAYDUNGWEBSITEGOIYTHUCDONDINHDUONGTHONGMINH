import Meal from "../models/Meal.js";

// 1. Lấy tất cả món ăn (Có kèm thông tin chi tiết từ Category và Ingredient)
export const getAllMeals = async (req, res) => {
    try {
        const meals = await Meal.find()
            .populate('categoryIds', 'name slug type') 
            .populate('ingredients.ingredientId', 'name baseUnit referencePrice') 
            .sort({ createdAt: -1 });

        res.status(200).json(meals);
    } catch (error) {
        console.error("Lỗi khi gọi getAllMeals:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 2. Lấy chi tiết 1 món ăn cụ thể 
export const getMealById = async (req, res) => {
    try {
        const meal = await Meal.findById(req.params.id)
            .populate('categoryIds', 'name slug type')
            .populate('ingredients.ingredientId', 'name baseUnit nutritionalValue referencePrice');

        if (!meal) {
            return res.status(404).json({ message: "Món ăn không tồn tại" });
        }

        res.status(200).json(meal);
    } catch (error) {
        console.error("Lỗi khi gọi getMealById:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 3. Tạo món ăn mới (Hỗ trợ FormData & Upload Ảnh Base64)
export const createMeal = async (req, res) => {
    try {
        const { name, description, prepTime, cookTime, servings, isActive } = req.body;
        
        const mealData = {
            name,
            description,
            prepTime: Number(prepTime) || 0,
            cookTime: Number(cookTime) || 0,
            servings: Number(servings) || 1,
            isActive: isActive === 'true' || isActive === true
        };

        // Giải nén các trường mảng/object bị FormData ép thành chuỗi
        if (req.body.categoryIds) mealData.categoryIds = JSON.parse(req.body.categoryIds);
        if (req.body.ingredients) mealData.ingredients = JSON.parse(req.body.ingredients);
        if (req.body.instructions) mealData.instructions = JSON.parse(req.body.instructions);

        // 🎯 XỬ LÝ ẢNH BASE64 (Không lưu URL localhost nữa)
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype; 
            // Tạo chuỗi Data URI chuẩn để trình duyệt đọc được ngay lập tức
            mealData.imageUrl = `data:${mimeType};base64,${base64Image}`;
        }

        const meal = new Meal(mealData);

        // Lệnh .save() sẽ tự động gọi hook pre('save') tính Calo và Tiền trong file Model
        const newMeal = await meal.save();
        
        res.status(201).json({
            message: "Thêm món ăn thành công",
            meal: newMeal
        });
    } catch (error) {
        console.error("Lỗi khi gọi createMeal:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tạo món ăn" });
    }
};

// 4. Cập nhật món ăn (Hỗ trợ FormData & Đổi ảnh Base64 mới)
export const updateMeal = async (req, res) => {
    try {
        const { name, description, prepTime, cookTime, servings, isActive } = req.body;
        
        const meal = await Meal.findById(req.params.id);

        if (!meal) {
            return res.status(404).json({ message: "Món ăn không tồn tại" });
        }

        // Cập nhật các trường text cơ bản
        if (name) meal.name = name;
        if (description !== undefined) meal.description = description;
        if (prepTime !== undefined) meal.prepTime = Number(prepTime);
        if (cookTime !== undefined) meal.cookTime = Number(cookTime);
        if (servings !== undefined) meal.servings = Number(servings);
        if (isActive !== undefined) meal.isActive = isActive === 'true' || isActive === true;

        // Cập nhật các trường mảng
        if (req.body.categoryIds) meal.categoryIds = JSON.parse(req.body.categoryIds);
        if (req.body.ingredients) meal.ingredients = JSON.parse(req.body.ingredients);
        if (req.body.instructions) meal.instructions = JSON.parse(req.body.instructions);

        // 🎯 XỬ LÝ THAY ĐỔI ẢNH (Lưu trực tiếp chuỗi mới đè lên chuỗi cũ)
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype; 
            meal.imageUrl = `data:${mimeType};base64,${base64Image}`;
        }

        // Lệnh .save() sẽ tự động chạy lại hook tính toán dinh dưỡng nếu ingredients thay đổi
        const updatedMeal = await meal.save();

        res.status(200).json({ 
            message: "Cập nhật món ăn thành công", 
            meal: updatedMeal 
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateMeal:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi cập nhật món" });
    }
};

// 5. Xóa món ăn
export const deleteMeal = async (req, res) => {
    try {
        const deletedMeal = await Meal.findByIdAndDelete(req.params.id);

        if (!deletedMeal) {
            return res.status(404).json({ message: "Món ăn không tồn tại" });
        }

        // Không cần gọi hàm xóa file trên ổ cứng nữa vì ảnh nằm trong chính deletedMeal vừa bị xóa khỏi MongoDB
        res.status(200).json({ 
            message: "Xóa món ăn thành công", 
            meal: deletedMeal 
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteMeal:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa món" });
    }
};

// 6. Import hàng loạt món ăn (Từ mảng JSON)
export const importMeals = async (req, res) => {
    try {
        const mealsData = req.body;

        if (!Array.isArray(mealsData) || mealsData.length === 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ. Vui lòng gửi một mảng JSON." });
        }

        const importedMeals = [];
        let skippedCount = 0;

        for (const item of mealsData) {
            try {
                const existing = await Meal.findOne({ name: item.name });
                
                if (!existing) {
                    const newMeal = new Meal({
                        name: item.name,
                        description: item.description,
                        categoryIds: item.categoryIds,
                        ingredients: item.ingredients,
                        instructions: item.instructions,
                        imageUrl: item.imageUrl, // Nếu chuỗi trong mảng import đã là Base64 thì nó sẽ được lưu thẳng vào DB
                        prepTime: item.prepTime,
                        cookTime: item.cookTime,
                        servings: item.servings,
                        isActive: item.isActive !== undefined ? item.isActive : true
                    });
                    
                    await newMeal.save();
                    importedMeals.push(newMeal);
                } else {
                    skippedCount++; 
                }
            } catch (err) {
                console.error(`Lỗi khi import món ăn ${item.name}:`, err);
                skippedCount++;
            }
        }

        res.status(201).json({
            message: `Import hoàn tất! Đã thêm ${importedMeals.length} món ăn. Bỏ qua/Lỗi ${skippedCount} món.`,
            importedCount: importedMeals.length,
            skippedCount: skippedCount,
            meals: importedMeals 
        });

    } catch (error) {
        console.error("Lỗi khi gọi importMeals:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi import dữ liệu." });
    }
};