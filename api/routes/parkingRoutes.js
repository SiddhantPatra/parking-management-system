import express from "express";
import {
    createParkingSlot,
    updateParkingSlot,
    deleteParkingSlot,
    getAllParkingSlots,
    getAvailableParkingSlots,
    bookParkingSlot,createBulkParkingSlot
} from "../controllers/parkingController.js"; 
import {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndModerator,
    verifyTokenAndAdminOrModerator,
} from "./verifyToken.js"; 

const router = express.Router();

// Admin-only routes
router.post("/slots", verifyTokenAndAdmin, createParkingSlot); // Only admin can create slots
router.delete("/slots/:id", verifyTokenAndAdmin, deleteParkingSlot); // Only admin can delete slots 


// Admin or Moderator routes
router.put("/slots/:id", verifyTokenAndAdminOrModerator, updateParkingSlot); // Admin or moderator can update slots

// All users routes (protected by token)
router.get("/slots", verifyToken, getAllParkingSlots); // All authenticated users can view all slots
router.get("/slots/available", verifyToken, getAvailableParkingSlots); // All authenticated users can view available slots
router.post("/book", verifyToken, bookParkingSlot); // All authenticated users can book slots

// Book a parking slot
router.put("/slots/:id/book", verifyToken, bookParkingSlot);
export default router;