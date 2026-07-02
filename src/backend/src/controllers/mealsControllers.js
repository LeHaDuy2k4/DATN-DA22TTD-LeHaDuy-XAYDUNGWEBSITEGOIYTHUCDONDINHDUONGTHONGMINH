import Meal from "../models/Meal.js";
import fs from "fs";
import path from "path";

// 🎯 HÀM ĐÃ ĐƯỢC FIX: Bỏ qua ảnh Cloudinary, chỉ xóa ảnh Local
const deleteLocalImage = (imageUrl) => {
    if (!imageUrl || imageUrl.startsWith('http') || !imageUrl.includes('/uploads/')) return;
    try {
        const rawFilename = imageUrl.split('/uploads/')[1];
        const filename = decodeURIComponent(rawFilename); 
        
        const filePath = path.join(process.cwd(), 'src', 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Đã dọn dẹp ảnh cũ: ${filename}`);
        }
    } catch (error) {
        console.error("Lỗi khi xóa ảnh cũ:", error);
    }
};

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

        if (req.body.categoryIds) mealData.categoryIds = JSON.parse(req.body.categoryIds);
        if (req.body.ingredients) mealData.ingredients = JSON.parse(req.body.ingredients);
        if (req.body.instructions) mealData.instructions = JSON.parse(req.body.instructions);

        // 🎯 LƯU ẢNH THÔNG MINH DỰA VÀO KẾT QUẢ MULTER
        if (req.file) {
            if (req.file.path && req.file.path.startsWith('http')) {
                mealData.imageUrl = req.file.path; // Cloudinary trả về link mạng
            } else {
                mealData.imageUrl = `/uploads/${req.file.filename}`; // Local lưu đường dẫn tương đối
            }
        }

        const meal = new Meal(mealData);

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

export const updateMeal = async (req, res) => {
    try {
        const { name, description, prepTime, cookTime, servings, isActive } = req.body;
        
        const meal = await Meal.findById(req.params.id);

        if (!meal) {
            return res.status(404).json({ message: "Món ăn không tồn tại" });
        }

        if (name) meal.name = name;
        if (description !== undefined) meal.description = description;
        if (prepTime !== undefined) meal.prepTime = Number(prepTime);
        if (cookTime !== undefined) meal.cookTime = Number(cookTime);
        if (servings !== undefined) meal.servings = Number(servings);
        if (isActive !== undefined) meal.isActive = isActive === 'true' || isActive === true;

        if (req.body.categoryIds) meal.categoryIds = JSON.parse(req.body.categoryIds);
        if (req.body.ingredients) meal.ingredients = JSON.parse(req.body.ingredients);
        if (req.body.instructions) meal.instructions = JSON.parse(req.body.instructions);

        // 🎯 CẬP NHẬT ẢNH THÔNG MINH
        if (req.file) {
            if (meal.imageUrl) {
                deleteLocalImage(meal.imageUrl);
            }
            if (req.file.path && req.file.path.startsWith('http')) {
                meal.imageUrl = req.file.path; 
            } else {
                meal.imageUrl = `/uploads/${req.file.filename}`;
            }
        }

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

export const deleteMeal = async (req, res) => {
    try {
        const deletedMeal = await Meal.findByIdAndDelete(req.params.id);

        if (!deletedMeal) {
            return res.status(404).json({ message: "Món ăn không tồn tại" });
        }

        if (deletedMeal.imageUrl) {
            deleteLocalImage(deletedMeal.imageUrl);
        }

        res.status(200).json({ 
            message: "Xóa món ăn thành công", 
            meal: deletedMeal 
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteMeal:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi xóa món" });
    }
};

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
                        imageUrl: item.imageUrl,
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