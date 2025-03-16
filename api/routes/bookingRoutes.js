import express from "express";
import {
    createBooking,
    getUserBookings,
    deleteBooking,
    getAllBookings,
} from "../controllers/bookingController.js";
import { verifyToken } from "./verifyToken.js";

const router = express.Router();

// Get all bookings (for all authenticated users)
router.get("/", verifyToken, getAllBookings);

// Get all bookings (for admins/moderators only)
router.get("/", verifyToken, (req, res) => {
    if (req.user.role === "admin" || req.user.role === "moderator") {
        return getAllBookings(req, res);
    } else {
        return res.status(403).json({ message: "Unauthorized" });
    }
});

// Get all bookings for the logged-in user
router.get("/user", verifyToken, getUserBookings);
 
// Create a new booking
router.post("/", verifyToken, createBooking); 
 
// Get all bookings for a user
router.get("/user/:userId", verifyToken, getUserBookings);

// Delete a booking
router.delete("/:bookingId", verifyToken, deleteBooking);

export default router;