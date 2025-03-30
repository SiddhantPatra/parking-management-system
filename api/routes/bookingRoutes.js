import express from "express";
import {
    createBooking,
    getUserBookings,
    deleteBooking,
    getAllBookings,
    updateBooking,
    updateBookingStatus,
    submitReview,
    getReviewsByParkingSlot
} from "../controllers/bookingController.js";
import { verifyToken, verifyTokenAndAdminOrModerator } from "./verifyToken.js";

const router = express.Router();

// Get all bookings (admin/moderator) or user's bookings (regular user)
router.get("/", verifyToken, getAllBookings);

// Get all bookings for the logged-in user
router.get("/user", verifyToken, getUserBookings);

// Create a new booking
router.post("/", verifyToken, createBooking);

// Get all bookings for a specific user (admin/moderator only)
router.get("/user/:userId", verifyToken, getUserBookings);

// Update a booking
router.put("/:bookingId", verifyToken, updateBooking);
router.patch('/:bookingId/status', verifyTokenAndAdminOrModerator, updateBookingStatus);

// Delete a booking
router.delete("/:bookingId", verifyToken, deleteBooking);

// Booking review
router.post('/:id/review', verifyToken, submitReview);
// router.get('/slots/:slotId/reviews',  getReviewsByParkingSlot); 
router.get('/slots/:slotId/reviews', verifyToken, getReviewsByParkingSlot);
export default router;