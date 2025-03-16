import express from 'express';
const router = express.Router();

import {
  verifyTokenAndAdmin,
  verifyTokenAndAuthorization,
  verifyTokenAndAdminOrModerator,
} from './verifyToken.js';
import {
  deleteUser,
  getAllUser,
  getUser,
  updateUser,
  updateUserRole,
} from '../controllers/userController.js';

// UPDATE User (only the user themselves or an admin can update)
router.put("/:id", verifyTokenAndAuthorization, updateUser);

// DELETE User (only admins can delete users)
router.delete("/:id", verifyTokenAndAdmin, deleteUser);

// GET User (public or restricted based on your requirements)
router.get("/:id", getUser);

// GET ALL Users (only admins or moderators can view all users)
router.get("/", verifyTokenAndAdminOrModerator, getAllUser);

// Update user role (only admins can update roles)
router.put("/:id/role", verifyTokenAndAdmin, updateUserRole);

export default router;