import Category from "../models/Category.js";

// 1. Lấy tất cả danh mục (Dành cho trang Admin)
export const getAllCategories = async (req, res) => {
    try { 
        // Sắp xếp theo thời gian tạo mới nhất
        const categories = await Category.find().sort({ createdAt: -1 });

        res.status(200).json(categories);
    } catch(error) {
        console.error("Lỗi khi gọi getAllCategories", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// Import hàng loạt danh mục từ mảng JSON (Dành cho Admin)

// 2. Tạo danh mục mới
export const createCategory = async (req, res) => {
    try {
        const { name, type, description, isActive } = req.body;
        
        // Model sẽ tự động tạo 'slug' nhờ vào middleware pre-save
        const category = new Category({ 
            name, 
            type, 
            description, 
            isActive 
        });

        const newCategory = await category.save();
        
        // 🎯 CHUẨN HÓA TRẢ VỀ: Gói object vào trong 'category' để Frontend dễ lấy
        res.status(201).json({
            message: "Thêm danh mục thành công",
            category: newCategory
        });
    } catch (error) {
        console.error("Lỗi khi gọi createCategory", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 3. Cập nhật danh mục
export const updateCategory = async (req, res) => {
    try {
        const { name, type, description, isActive } = req.body;
        
        // 🎯 ĐÃ SỬA: Phải dùng findById để lấy ra Document thực sự
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: "Thể loại không tồn tại" });
        }

        // Gán các giá trị mới nếu có người dùng gửi lên
        if (name) category.name = name;
        if (type) category.type = type;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        // 🎯 Dùng .save() để kích hoạt hook pre('save') -> Tự động sinh lại slug mới nếu name thay đổi
        const updatedCategory = await category.save();

        res.status(200).json({ 
            message: "Cập nhật thể loại thành công", 
            category: updatedCategory 
        });

    } catch (error) {
        console.error("Lỗi khi gọi updateCategory", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

// 4. Xóa danh mục
export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await Category.findByIdAndDelete(req.params.id);

        if (!deletedCategory) {
            return res.status(404).json({ message: "Thể loại không tồn tại" });
        }

        res.status(200).json({ 
            message: "Xóa thể loại thành công", 
            category: deletedCategory 
        });

    } catch (error) {
        console.error("Lỗi khi gọi deleteCategory", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};

export const importCategories = async (req, res) => {
    try {
        const categoriesData = req.body;

        // Kiểm tra xem dữ liệu gửi lên có phải là một mảng không
        if (!Array.isArray(categoriesData) || categoriesData.length === 0) {
            return res.status(400).json({ message: "Dữ liệu không hợp lệ. Vui lòng gửi một mảng JSON." });
        }

        const importedCategories = [];
        let skippedCount = 0;

        for (const item of categoriesData) {
            try {
                // Tránh import trùng lặp tên danh mục
                const existing = await Category.findOne({ name: item.name });
                
                if (!existing) {
                    const newCategory = new Category({
                        name: item.name,
                        type: item.type,
                        description: item.description,
                        isActive: item.isActive
                    });
                    
                    await newCategory.save();
                    importedCategories.push(newCategory);
                } else {
                    skippedCount++; 
                }
            } catch (err) {
                console.error(`Lỗi khi import danh mục ${item.name}:`, err);
                skippedCount++;
            }
        }

        res.status(201).json({
            message: `Import hoàn tất! Đã thêm ${importedCategories.length} danh mục. Bỏ qua/Lỗi ${skippedCount} mục.`,
            importedCount: importedCategories.length,
            skippedCount: skippedCount,
            categories: importedCategories 
        });

    } catch (error) {
        console.error("Lỗi khi gọi importCategories:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi import dữ liệu." });
    }
};
