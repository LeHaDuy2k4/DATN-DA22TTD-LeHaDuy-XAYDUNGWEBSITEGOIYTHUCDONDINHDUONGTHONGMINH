import express from 'express';
import { 
    authMe, 
    getAllUsers, 
    updateUserProfile, 
    updateUserRole, 
    deleteUser 
} from '../controllers/usersControllers.js';
import { isAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Vì server.js đã dùng protectedRoute cho toàn bộ /api/users, 
// nên ở đây ta chỉ cần định nghĩa các route con:

router.get('/me',  authMe);
router.put('/profile', updateUserProfile);

// Route Admin: Cần isAdmin đứng trước để kiểm tra quyền
router.get("/", isAdmin, getAllUsers);
router.put("/role/:id", isAdmin, updateUserRole);
router.delete("/:id", isAdmin, deleteUser);

export default router;