import Parking from "../models/ParkingModel.js";
// Create a parking slot (Admin only)
export const createParkingSlot = async (req, res) => {
    try {
      const { slotNumber, location, price } = req.body;
      const newSlot = new Parking({ slotNumber, location, price });
      await newSlot.save();
      res.status(201).json(newSlot);
    } catch (error) {
      res.status(500).json({ message: "Error creating parking slot", error });
    }
  };
 
// Update a parking slot (Admin or Moderator)
export const updateParkingSlot = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSlot = await Parking.findByIdAndUpdate(id, updates, { new: true });
      res.json(updatedSlot);
    } catch (error) {
      res.status(500).json({ message: "Error updating parking slot", error });
    }
  };

// Delete a parking slot (Admin only)
export const deleteParkingSlot = async (req, res) => {
    try {
        const { id } = req.params;
        await Parking.findByIdAndDelete(id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: "Error deleting parking slot", error });
    }
};

// Get all parking slots (All users)
export const getAllParkingSlots = async (req, res) => {
    try {
        const slots = await Parking.find();
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching parking slots", error });
    }
};

// Get available parking slots (All users)
export const getAvailableParkingSlots = async (req, res) => {
    try {
        const availableSlots = await Parking.find({ status: "Available" });
        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching available slots", error });
    }
};

// Book a parking slot (All users)
export const bookParkingSlot = async (req, res) => {
    const { id } = req.params;
    const { vehicleNumber, fromDate, toDate } = req.body;
    const userId = req.user._id; // Assuming the user ID is available in the request

    try {
        // Find the parking slot
        const parkingSlot = await Parking.findById(id);
        if (!parkingSlot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Check for overlapping bookings
        const overlappingBooking = parkingSlot.bookings.some(
            (booking) =>
                (fromDate <= booking.toDate && toDate >= booking.fromDate)
        );

        if (overlappingBooking) {
            return res.status(400).json({ message: "The parking slot is already booked for the selected date range" });
        }

        // Add the booking
        parkingSlot.bookings.push({ vehicleNumber, fromDate, toDate });

        // Update the parking slot status and bookedBy field
        parkingSlot.status = "Occupied";
        parkingSlot.bookedBy = userId;

        await parkingSlot.save();

        res.status(200).json(parkingSlot);
    } catch (error) {
        res.status(500).json({ message: "Error booking parking slot", error });
    }
};