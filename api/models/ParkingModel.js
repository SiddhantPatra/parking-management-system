import mongoose from "mongoose";

const ParkingSchema = new mongoose.Schema({
    slotNumber: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ["Available", "Occupied", "Reserved"],
        default: "Available",
    },
    location: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    vehicleNumber: {
        type: String,
        default: null,
    },
    bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
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

// Update `updatedAt` before saving
ParkingSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

const Parking = mongoose.model("Parking", ParkingSchema);
export default Parking;