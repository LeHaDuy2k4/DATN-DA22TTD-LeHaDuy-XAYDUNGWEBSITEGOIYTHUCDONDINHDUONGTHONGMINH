import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    type: { 
        type: String, 
        enum: ['REMINDER', 'SYSTEM', 'AI_COMPLETED'], // Phân loại theo mô tả của bạn
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    content: { 
        type: String, 
        required: true 
    },
    isRead: { 
        type: Boolean, 
        default: false 
    }
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;