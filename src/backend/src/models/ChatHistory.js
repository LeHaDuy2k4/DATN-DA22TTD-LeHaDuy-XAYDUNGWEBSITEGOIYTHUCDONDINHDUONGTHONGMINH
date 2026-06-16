import mongoose from 'mongoose';

// Lược đồ cho từng tin nhắn đơn lẻ
const messageSchema = new mongoose.Schema({
  sender: { 
    type: String, 
    enum: ['user', 'ai'], 
    required: true 
  },
  content: { 
    type: String, 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false }); // Không tạo _id phụ cho từng tin nhắn để tiết kiệm dung lượng

// Lược đồ chính cho Phiên trò chuyện (ChatHistory)
const chatHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  messages: [messageSchema],
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true // Tự động sinh createdAt và updatedAt
});

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;