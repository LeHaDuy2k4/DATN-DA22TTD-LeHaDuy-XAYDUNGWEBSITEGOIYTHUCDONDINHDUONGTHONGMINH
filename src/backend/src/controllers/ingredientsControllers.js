import Ingredient from "../models/Ingredient.js";

// 1. Lấy tất cả nguyên liệu
export const getAllIngredients = async (req, res) => {
    try {
        const ingredients = await Ingredient.find().sort({ createdAt: -1 });
        res.status(200).json(ingredients);
    } catch (error) {
        console.error("Lỗi khi gọi getAllIngredients:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 2. Tạo nguyên liệu mới
export const createIngredient = async (req, res) => {
    try {
        const { name, baseUnit, referencePrice, nutritionalValue, description, isActive } = req.body;
        
        const ingredient = new Ingredient({ 
            name, 
            baseUnit, 
            referencePrice, 
            nutritionalValue, 
            description, 
            isActive 
        });

        const newIngredient = await ingredient.save();
        
        res.status(201).json({
            message: "Thêm nguyên liệu thành công",
            ingredient: newIngredient
        });
    } catch (error) {
        console.error("Lỗi khi gọi createIngredient:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 3. Cập nhật nguyên liệu
export const updateIngredient = async (req, res) => {
    try {
        const { name, baseUnit, referencePrice, nutritionalValue, description, isActive } = req.body;
        
        // Dùng findById để lấy Document thực sự
        const ingredient = await Ingredient.findById(req.params.id);

        if (!ingredient) {
            return res.status(404).json({ message: "Nguyên liệu không tồn tại" });
        }

        // Cập nhật các trường được gửi lên
        if (name) ingredient.name = name;
        if (baseUnit) ingredient.baseUnit = baseUnit;
        if (referencePrice !== undefined) ingredient.referencePrice = referencePrice;
        if (nutritionalValue) ingredient.nutritionalValue = { ...ingredient.nutritionalValue, ...nutritionalValue };
        if (description !== undefined) ingredient.description = description;
        if (isActive !== undefined) ingredient.isActive = isActive;

        // Dùng .save() để kích hoạt hook pre('save') sinh lại slug nếu name thay đổi
        const updatedIngredient = await ingredient.save();

        res.status(200).json({ 
            message: "Cập nhật nguyên liệu thành công", 
            ingredient: updatedIngredient 
        });
    } catch (error) {
        console.error("Lỗi khi gọi updateIngredient:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 4. Xóa nguyên liệu
export const deleteIngredient = async (req, res) => {
    try {
        const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);

        if (!deletedIngredient) {
            return res.status(404).json({ message: "Nguyên liệu không tồn tại" });
        }

        res.status(200).json({ 
            message: "Xóa nguyên liệu thành công", 
            ingredient: deletedIngredient 
        });
    } catch (error) {
        console.error("Lỗi khi gọi deleteIngredient:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 5. Import hàng loạt nguyên liệu từ mảng JSON (Dành cho Admin)
export const importIngredients = async (req, res) => {
    try {
        // Lấy mảng dữ liệu từ body
        const ingredientsData = req.body;

        // Kiểm tra xem dữ liệu gửi lên có phải là một mảng không
        if (!Array.isArray(ingredientsData) || ingredientsData.length === 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ. Vui lòng gửi một mảng JSON." });
        }

        const importedIngredients = [];
        let skippedCount = 0;

        // 🎯 LƯU Ý KỸ: Dùng vòng lặp for...of kết hợp .save() thay vì .insertMany() 
        // Lý do: .save() sẽ kích hoạt được middleware pre('save') để tự động tạo 'slug'
        for (const item of ingredientsData) {
            try {
                // Kiểm tra xem nguyên liệu đã tồn tại chưa (dựa vào tên) để tránh trùng lặp
                const existing = await Ingredient.findOne({ name: item.name });
                
                if (!existing) {
                    const newIngredient = new Ingredient({
                        name: item.name,
                        baseUnit: item.baseUnit || '100g',
                        referencePrice: item.referencePrice || 0,
                        nutritionalValue: item.nutritionalValue || { calories: 0, protein: 0, carbs: 0, fat: 0 },
                        description: item.description || '',
                        isActive: item.isActive !== undefined ? item.isActive : true
                    });
                    
                    await newIngredient.save();
                    importedIngredients.push(newIngredient);
                } else {
                    skippedCount++; // Bỏ qua nếu đã có trong DB
                }
            } catch (err) {
                console.error(`Lỗi khi import nguyên liệu ${item.name}:`, err);
                skippedCount++;
            }
        }

        res.status(201).json({
            message: `Import hoàn tất! Đã thêm ${importedIngredients.length} nguyên liệu. Bỏ qua/Lỗi ${skippedCount} mục.`,
            importedCount: importedIngredients.length,
            skippedCount: skippedCount,
            // Trả về danh sách vừa import nếu Frontend cần hiển thị
            ingredients: importedIngredients 
        });

    } catch (error) {
        console.error("Lỗi khi gọi importIngredients:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi import dữ liệu." });
    }
};