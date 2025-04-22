import mongoose from "mongoose";
import ParkingLot from "../models/ParkingLotModel.js";
import ParkingLevel from "../models/ParkingLevelModel.js";
import Parking from "../models/ParkingModel.js";
import Booking from "../models/BookingModel.js";


// ✅ 1️⃣ Create a Parking Lot (Admin Only)
export const createParkingLot = async (req, res) => {
    try {
        const { name, address } = req.body;

        // Check if a parking lot with the same name already exists
        const existingLot = await ParkingLot.findOne({ name });

        if (existingLot) {
            return res.status(400).json({ message: "A parking lot with this name already exists" });
        }

        // Create a new parking lot
        const newLot = new ParkingLot({ name, address });
        await newLot.save();
        res.status(201).json(newLot);
    } catch (error) {
        res.status(500).json({ message: "Error creating parking lot", error });
    }
};

// ✅ 2️⃣ Add a Floor to a Parking Lot
export const addParkingLevel = async (req, res) => {
    try {
        const { name, parkingLot } = req.body;

        // Ensure the parking lot exists
        const lotExists = await ParkingLot.findById(parkingLot);
        if (!lotExists) {
            return res.status(404).json({ message: "Parking lot not found" });
        }

        // Check if a level with the same name already exists in the same parking lot
        const existingLevel = await ParkingLevel.findOne({ name, parkingLot });
        if (existingLevel) {
            return res.status(400).json({ message: "A level with this name already exists in this location" });
        }

        // Create a new parking level
        const newLevel = new ParkingLevel({ name, parkingLot });
        await newLevel.save();
        res.status(201).json(newLevel);
    } catch (error) {
        console.error("Error adding parking level:", error);
        res.status(500).json({ message: "Error adding parking level", error });
    }
};

// ✅ 3️⃣ Create a Parking Slot in a Floor
export const createParkingSlot = async (req, res) => {
    try {
        const { slotNumber, parkingLevel, price } = req.body;

        // Ensure the parking level exists
        const levelExists = await ParkingLevel.findById(parkingLevel);
        if (!levelExists) {
            return res.status(404).json({ message: "Parking level not found" });
        }

        // Create a new parking slot with a default status
        const newSlot = new Parking({ slotNumber, parkingLevel, price, status: "Available" });
        await newSlot.save();
        res.status(201).json(newSlot);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "A slot with the same name already exists on this level",
            });
        }
        console.error("Error creating parking slot:", error);
        res.status(500).json({ message: "Error creating parking slot", error });
    }
};

// ✅ 4️⃣ Get Parking Slots by Level
export const getParkingSlotsByLevel = async (req, res) => {
    try {
        const { levelId } = req.params;
        const { status } = req.query;

        // Validate levelId
        if (!mongoose.Types.ObjectId.isValid(levelId)) {
            return res.status(400).json({ message: "Invalid Parking Level ID" });
        }

        // Define the filter
        const filter = { parkingLevel: levelId };
        if (status) filter.status = status;

        // Fetch slots
        const slots = await Parking.find(filter);
        res.status(200).json({ data: slots });
    } catch (error) {
        console.error("Error fetching parking slots:", error);
        res.status(500).json({ message: "Error fetching parking slots", error: error.message });
    }
};

// ✅ 5️⃣ Get Available Parking Slots (All Users)
export const getAvailableParkingSlots = async (req, res) => {
    try {
        const { level, fromDate, toDate } = req.query;

        // Validate level if provided
        if (level && !mongoose.Types.ObjectId.isValid(level)) {
            return res.status(400).json({ message: "Invalid Parking Level ID" });
        }

        // Define the filter
        const filter = { status: "Available" };
        if (level) filter.parkingLevel = level;

        // Fetch available slots
        const availableSlots = await Parking.find(filter);

        // Filter slots based on date range (if provided)
        if (fromDate && toDate) {
            const filteredSlots = await Promise.all(
                availableSlots.map(async (slot) => {
                    const overlappingBooking = await Booking.findOne({
                        parkingSlot: slot._id,
                        $or: [
                            { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }, // Overlapping bookings
                        ],
                    });
                    return !overlappingBooking ? slot : null;
                })
            );

            // Remove null values from the filtered slots
            const result = filteredSlots.filter((slot) => slot !== null);
            return res.status(200).json({ data: result });
        }

        // Return all available slots if no date range is provided
        res.status(200).json({ data: availableSlots });
    } catch (error) {
        console.error("Error fetching available parking slots:", error);
        res.status(500).json({ message: "Error fetching available parking slots", error: error.message });
    }
};
export const checkSlotAvailability = async (req, res) => {
    try {
        const { slotId, fromDate, toDate } = req.query;

        console.log("Received slotId:", slotId);
        console.log("Valid ObjectId?", mongoose.Types.ObjectId.isValid(slotId));

        if (!mongoose.Types.ObjectId.isValid(slotId)) {
            return res.status(400).json({ message: "Invalid Parking Slot ID" });
        }

        const slot = await Parking.findById(slotId);
        if (!slot) {
            console.log("Slot not found in database:", slotId);
            return res.status(404).json({ message: "Parking slot not found" });
        }

        const existingBooking = await Booking.findOne({
            parkingSlot: slotId,
            $or: [
                { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } } // Overlapping bookings
            ],
        });

        // A slot is available if no overlapping bookings exist and the status is "Available"
        const isAvailable = !existingBooking && slot.status === "Available";

        res.status(200).json({ available: isAvailable });

    } catch (error) {
        console.error("Error checking slot availability:", error);
        res.status(500).json({ message: "Failed to check slot availability" });
    }
};
// ✅ 6️⃣ Book a Parking Slot (Fixed for Future Reservations)
export const bookParkingSlot = async (req, res) => {
    try {
        const { fromDate, toDate, vehicleNumber } = req.body;
        const { id } = req.params; // Slot ID from URL
        const userId = req.user.id; // User ID from token

        // Validate input dates
        if (!fromDate || !toDate) {
            return res.status(400).json({ message: "Both fromDate and toDate are required" });
        }

        if (new Date(fromDate) >= new Date(toDate)) {
            return res.status(400).json({ message: "End date must be after start date" });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to midnight for an accurate date-only comparison
        
        const fromDateObj = new Date(fromDate);
        fromDateObj.setHours(0, 0, 0, 0); // Reset fromDate time to midnight
        
        if (fromDateObj < today) {
            return res.status(400).json({ message: "Cannot book for past dates" });
        } 

        // Validate vehicle number
        if (!vehicleNumber || vehicleNumber.trim() === "") {
            return res.status(400).json({ message: "Vehicle number is required" });
        }

        // Check if slot exists and get its price
        const slot = await Parking.findById(id);
        if (!slot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Check slot availability
        const isAvailable = await checkSlotAvailabilitys(id, fromDate, toDate);
        if (!isAvailable) {
            return res.status(400).json({ message: "Slot not available for the selected dates" });
        }

        // Create booking with status "Confirmed" and store the daily rate
        const booking = new Booking({
            parkingSlot: id,
            bookedBy: userId,
            vehicleNumber,
            fromDate,
            toDate,
            status: "Confirmed",
            dailyRate: slot.price // Store the rate at time of booking
        });

        await booking.save();
 

        res.status(201).json({
            message: "Booking successful",
            booking,
            receipt: {
                slotNumber: slot.slotNumber,
                totalDays: calculateDaysDifference(fromDate, toDate),
                dailyRate: slot.price,
                totalAmount: calculateDaysDifference(fromDate, toDate) * slot.price
            }
        });

    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({
            message: "Booking failed",
            error: error.message
        });
    }
};

// Helper function to check slot availability
async function checkSlotAvailabilitys(slotId, fromDate, toDate) {
    // Check if slot exists and is available
    const slot = await Parking.findById(slotId);
    if (!slot || slot.status !== "Available") return false;

    // Check for overlapping bookings
    const overlappingBooking = await Booking.findOne({
        parkingSlot: slotId,
        status: { $ne: "Cancelled" },
        $or: [
            { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }
        ]
    });

    return !overlappingBooking;
}

// Helper function to calculate days difference
function calculateDaysDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
}

// Helper function to check if two dates are the same day
function isSameDay(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

// ✅ 7️⃣ Get All Parking Slots (for Admin or Users)
export const getAllParkingSlots = async (req, res) => {
    try {
        const slots = await Parking.find();
        res.status(200).json(slots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching all parking slots", error });
    }
};
// ✅ Get Parking Slot by ID
export const getParkingSlot = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("Received ID:", id); // Debugging log

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid Parking Slot ID" });
        }

        // Fetch the parking slot by ID
        const slot = await Parking.findById(id); // Use the correct model name
        console.log("Found Slot:", slot); // Debugging log

        // Check if the slot exists
        if (!slot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Return the slot data
        res.status(200).json({ data: slot });
    } catch (error) {
        console.error("Error fetching parking slot:", error); // Debugging log
        res.status(500).json({ message: "Error fetching parking slot", error: error.message });
    }
};

// ✅ 7️⃣ Get All Parking Lots (for Admin or Users)
export const getParkingLots = async (req, res) => {
    try {
        const lots = await ParkingLot.find();
        res.status(200).json(lots);
    } catch (error) {
        res.status(500).json({ message: "Error fetching parking lots", error });
    }
};

// ✅ 8️⃣ Get All Levels for a Specific Lot
export const getLevelsByLot = async (req, res) => {
    try {
        const { lotId } = req.params;
        const levels = await ParkingLevel.find({ parkingLot: lotId });
        res.status(200).json(levels);
    } catch (error) {
        res.status(500).json({ message: "Error fetching parking levels", error });
    }
};

// ✅ 8️⃣ Update ParkingLot
export const updateParkingLot = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, address, contactNumber, capacity } = req.body;

        const lot = await ParkingLot.findById(id);
        if (!lot) {
            return res.status(404).json({ message: "Parking lot not found" });
        }

        // Check for duplicate name
        const existingLot = await ParkingLot.findOne({ name, _id: { $ne: id } });
        if (existingLot) {
            return res.status(400).json({ message: "A parking lot with this name already exists" });
        }

        // Update fields
        lot.name = name || lot.name;
        lot.address = address || lot.address;
        lot.contactNumber = contactNumber || lot.contactNumber;
        lot.capacity = capacity || lot.capacity;

        await lot.save();
        res.status(200).json(lot);
    } catch (error) {
        res.status(500).json({ message: "Error updating parking lot", error });
    }
};

// ✅ 8️⃣ Update ParkingLevel
export const updateParkingLevel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, floorNumber, capacity } = req.body;

        const level = await ParkingLevel.findById(id).populate('parkingLot');
        if (!level) {
            return res.status(404).json({ message: "Parking level not found" });
        }

        // Check for duplicate name in same parking lot
        const existingLevel = await ParkingLevel.findOne({
            name,
            parkingLot: level.parkingLot._id,
            _id: { $ne: id }
        });
        if (existingLevel) {
            return res.status(400).json({
                message: "A level with this name already exists in this parking lot"
            });
        }

        // Update fields
        level.name = name || level.name;
        level.floorNumber = floorNumber || level.floorNumber;
        level.capacity = capacity || level.capacity;

        await level.save();
        res.status(200).json(level);
    } catch (error) {
        res.status(500).json({ message: "Error updating parking level", error });
    }
};


// ✅ 8️⃣ Update ParkingSlot
export const updateParkingSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const { slotNumber, parkingLevel, price,fineAmount , status } = req.body;
        const userRole = req.user.role;

        const slot = await Parking.findById(id);
        if (!slot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Only admin can change parking level
        if (parkingLevel && parkingLevel !== slot.parkingLevel.toString() && userRole !== "admin") {
            return res.status(403).json({ message: "Only admin can change parking level" });
        }

        const existingSlot = await Parking.findOne({
            slotNumber,
            parkingLevel: parkingLevel || slot.parkingLevel,
            _id: { $ne: id }
        });

        if (existingSlot) {
            return res.status(400).json({ message: "A slot with this name already exists on this level" });
        }

        slot.slotNumber = slotNumber || slot.slotNumber;
        slot.parkingLevel = parkingLevel || slot.parkingLevel;
        slot.price = price || slot.price;
        slot.fineAmount = fineAmount || slot.fineAmount;
        slot.status = status || slot.status;
        await slot.save();

        res.status(200).json(slot);
    } catch (error) {
        res.status(500).json({ message: "Error updating parking slot", error });
    }
};






// ✅ 8️⃣ Delete ParkingLot
export const deleteParkingLot = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if parking lot exists
        const lot = await ParkingLot.findById(id);
        if (!lot) {
            return res.status(404).json({ message: "Parking lot not found" });
        }

        // Check if there are any levels associated
        const levelsCount = await ParkingLevel.countDocuments({ parkingLot: id });
        if (levelsCount > 0) {
            return res.status(400).json({
                message: "Cannot delete parking lot with associated levels. Delete levels first."
            });
        }

        await ParkingLot.findByIdAndDelete(id);
        res.status(200).json({ message: "Parking lot deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting parking lot", error });
    }
};

// ✅ 8️⃣ Delete ParkingLevel
export const deleteParkingLevel = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if parking level exists
        const level = await ParkingLevel.findById(id);
        if (!level) {
            return res.status(404).json({ message: "Parking level not found" });
        }

        // Check if there are any slots associated
        const slotsCount = await Parking.countDocuments({ parkingLevel: id });
        if (slotsCount > 0) {
            return res.status(400).json({
                message: "Cannot delete parking level with associated slots. Delete slots first."
            });
        }

        await ParkingLevel.findByIdAndDelete(id);
        res.status(200).json({ message: "Parking level deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting parking level", error });
    }
};

// ✅ 8️⃣ Delete ParkingSlot 
export const deleteParkingSlot = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.user.role;

        // Check if the parking slot exists
        const slot = await Parking.findById(id);
        if (!slot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Check for active bookings
        const activeBookings = await Booking.find({
            parkingSlot: id,
            toDate: { $gte: new Date() }
        });

        if (activeBookings.length > 0 && userRole !== "admin") {
            return res.status(400).json({
                message: "Cannot delete slot with active bookings. Contact admin."
            });
        }

        // Delete all related bookings first if admin
        if (userRole === "admin") {
            await Booking.deleteMany({ parkingSlot: id });
        }

        await Parking.findByIdAndDelete(id);
        res.status(200).json({ message: "Parking slot deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting parking slot", error });
    }
};
// ✅ 8️⃣ Delete check Slot Availability
// export const checkSlotAvailability = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { fromDate, toDate } = req.query;

//         // Validate the slot ID
//         if (!mongoose.Types.ObjectId.isValid(id)) {
//             return res.status(400).json({ message: "Invalid Parking Slot ID" });
//         }

//         // Check if the slot exists
//         const slot = await Parking.findById(id);
//         if (!slot) {
//             return res.status(404).json({ message: "Parking slot not found" });
//         }

//         // Check for overlapping bookings
//         const overlappingBooking = await Booking.findOne({
//             parkingSlot: id,
//             $or: [
//                 { fromDate: { $lte: toDate }, toDate: { $gte: fromDate } }, // Overlapping bookings
//             ],
//         });

//         // Return availability status
//         const isAvailable = !overlappingBooking && slot.status === "Available";
//         res.status(200).json({ available: isAvailable });
//     } catch (error) {
//         console.error("Error checking slot availability:", error);
//         res.status(500).json({ message: "Error checking slot availability", error: error.message });
//     }
// };
export const updateSlotStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Ensure the slot exists
        const slot = await Parking.findById(id);
        if (!slot) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        // Update the slot status
        slot.status = status;
        await slot.save();

        res.status(200).json(slot);
    } catch (error) {
        console.error("Error updating slot status:", error);
        res.status(500).json({ message: "Error updating slot status", error });
    }
};
export const getBookingsBySlot = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch all bookings for the slot
        const bookings = await Booking.find({ parkingSlot: id });

        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};
export const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Ensure the booking exists
        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Delete the booking
        await Booking.findByIdAndDelete(id);

        res.status(200).json({ message: "Booking canceled successfully" });
    } catch (error) {
        console.error("Error canceling booking:", error);
        res.status(500).json({ message: "Error canceling booking", error });
    }
};
