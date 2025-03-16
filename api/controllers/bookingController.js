import Booking from "../models/BookingModel.js";
import Parking from "../models/ParkingModel.js";

// Create a new booking
export const createBooking = async (req, res) => {
    // console.log("Request user:", req.user); // Log the request user
    try {
        const { parkingSlot, vehicleNumber, fromDate, toDate } = req.body;
        const userId = req.user.id; // Get the user ID from the token payload

        // Check if the parking slot exists
        const parking = await Parking.findById(parkingSlot);
        if (!parking) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Create the booking
        const booking = new Booking({
            parkingSlot,
            bookedBy: userId,
            vehicleNumber,
            fromDate,
            toDate,
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking", error });
    }
};

// Get all bookings for a user
export const getUserBookings = async (req, res) => {
    try { 
        const userId = req.params.userId;
        const bookings = await Booking.find({ bookedBy: userId })
            .populate("parkingSlot") // Populate parkingSlot details
            .populate("bookedBy", "firstName email"); // Populate bookedBy with username and email
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};

export const getAllBookings = async (req, res) => {
    try { 
        const bookings = await Booking.find()
            .populate("parkingSlot") // Populate parkingSlot details
            .populate("bookedBy", "firstName email"); // Populate bookedBy with username and email
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching all bookings", error });
    }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
    const { bookingId } = req.params;

    try {
        const booking = await Booking.findByIdAndDelete(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update the parking slot status to "Available"
        const parkingSlot = await Parking.findById(booking.parkingSlot);
        if (parkingSlot) {
            parkingSlot.status = "Available";
            parkingSlot.bookedBy = null;
            await parkingSlot.save();
        }

        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting booking", error });
    }
};