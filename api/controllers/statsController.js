import mongoose from "mongoose";
import ParkingLot from "../models/ParkingLotModel.js";
import ParkingLevel from "../models/ParkingLevelModel.js";
import Parking from "../models/ParkingModel.js";
import Booking from "../models/BookingModel.js";

// Get all statistics in one endpoint
export const getDashboardStats = async (req, res) => {
    try {
        // Count all parking lots
        const totalLots = await ParkingLot.countDocuments();

        // Count all parking levels
        const totalLevels = await ParkingLevel.countDocuments();

        // Count all parking slots
        const totalSlots = await Parking.countDocuments();

        // Count all bookings
        const totalBookings = await Booking.countDocuments();

        // Count active bookings
        const activeBookings = await Booking.countDocuments({ fromDate:{ $lte: new Date().setHours(0, 0, 0, 0) } , toDate: { $gte: new Date().setHours(0, 0, 0, 0) }});

        // Calculate monthly revenue
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyBookings = await Booking.find({
            status: "Completed",
            fromDate: { $gte: firstDayOfMonth }
        });

        const monthlyRevenue = monthlyBookings.reduce((total, booking) => {
            const bookingDays = Math.ceil(
                (new Date(booking.toDate) - new Date(booking.fromDate)) / (1000 * 60 * 60 * 24)
            );
            return total + (bookingDays * (booking.dailyRate || 0));
        }, 0);

        res.status(200).json({
            totalLots,
            totalLevels,
            totalSlots,
            totalBookings,
            activeBookings,
            monthlyRevenue
        });

    } catch (error) {
        console.error("Error fetching dashboard statistics:", error);
        res.status(500).json({
            message: "Error fetching dashboard statistics",
            error: error.message
        });
    }
};

// Get monthly revenue separately (if needed)
export const getMonthlyRevenue = async (req, res) => {
    try {
        const { year, month } = req.query;
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const monthlyBookings = await Booking.find({
            status: "Completed",
            fromDate: { $gte: startDate, $lte: endDate }
        });

        const revenue = monthlyBookings.reduce((total, booking) => {
            const bookingDays = Math.ceil(
                (new Date(booking.toDate) - new Date(booking.fromDate)) / (1000 * 60 * 60 * 24
                ));
            return total + (bookingDays * (booking.dailyRate || 0));
        }, 0);

        res.status(200).json({ revenue });

    } catch (error) {
        console.error("Error calculating monthly revenue:", error);
        res.status(500).json({
            message: "Error calculating monthly revenue",
            error: error.message
        });
    }
};