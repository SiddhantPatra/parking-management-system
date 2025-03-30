import express from "express";
import {
    createParkingLot,
    addParkingLevel,
    createParkingSlot,
    getParkingSlotsByLevel,
    getAvailableParkingSlots,
    bookParkingSlot,
    getParkingLots,
    getLevelsByLot,
    updateParkingLot,
    updateParkingLevel,
    updateParkingSlot,
    deleteParkingSlot,
    getAllParkingSlots,
    deleteParkingLevel,
    deleteParkingLot,
    getParkingSlot,
    checkSlotAvailability,
    updateSlotStatus,
    getBookingsBySlot,
    cancelBooking,
} from "../controllers/parkingController.js";

import { verifyToken, verifyTokenAndAdmin, verifyTokenAndAdminOrModerator } from "./verifyToken.js";

const router = express.Router();
// Availability Check
router.get("/slots/availability", checkSlotAvailability);

// Parking Lot Routes
router.post("/lots", verifyTokenAndAdmin, createParkingLot);
router.get("/lots", getParkingLots);
router.put("/lots/:id", verifyTokenAndAdmin, updateParkingLot);
router.delete("/lots/:id", verifyTokenAndAdmin, deleteParkingLot);

// Parking Level Routes
router.post("/levels", verifyTokenAndAdminOrModerator, addParkingLevel);
router.get("/levels/:lotId", getLevelsByLot);
router.put("/levels/:id", verifyTokenAndAdminOrModerator, updateParkingLevel);
router.delete("/levels/:id", verifyTokenAndAdmin, deleteParkingLevel);

// Parking Slot Routes
router.post("/slots", verifyTokenAndAdminOrModerator, createParkingSlot);
router.get("/levels/:levelId/slots", getParkingSlotsByLevel);
router.put("/slots/:id", verifyTokenAndAdminOrModerator, updateParkingSlot);
router.delete("/slots/:id", verifyTokenAndAdmin, deleteParkingSlot);

// General Slot Routes
router.get("/slots", verifyToken, getAllParkingSlots);
router.get("/slots/:id", verifyToken, getParkingSlot);
router.get("/slots/available", verifyToken, getAvailableParkingSlots);

// Booking Routes
router.post("/slots/:id/book", verifyToken, bookParkingSlot);
router.get("/slots/:id/bookings", verifyToken, getBookingsBySlot);
router.delete("/bookings/:id", verifyToken, cancelBooking);

// Slot Status Management
router.put("/slots/:id/status", verifyTokenAndAdminOrModerator, updateSlotStatus);


export default router;