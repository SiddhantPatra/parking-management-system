import mongoose from "mongoose";

const BookingSchema = new mongoose.Schema({
    parkingSlot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Parking", // Reference to the ParkingSlot model
        required: true,
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
    },
    vehicleNumber: {
        type: String,
        required: true,
    },
    fromDate: {
        type: Date,
        required: true,
    },
    toDate: {
        type: Date,
        required: true,
        validate: {
            validator: function (value) {
                return value > this.fromDate; // Ensures toDate is after fromDate
            },
            message: "To date must be after from date",
        },
    },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Cancelled"],
        default: "Pending",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for faster queries
BookingSchema.index({ parkingSlot: 1 });
BookingSchema.index({ bookedBy: 1 });

// Update `updatedAt` before saving
BookingSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Booking = mongoose.model("Booking", BookingSchema);
export default Booking;