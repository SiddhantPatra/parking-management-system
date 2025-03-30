import mongoose from "mongoose";

const ParkingSchema = new mongoose.Schema({
    slotNumber: {
        type: String,
        required: true,
    },
    parkingLevel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParkingLevel", // Linked to a specific level
        required: true,
    },
    status: {
        type: String,
        enum: ["Available", "Unavailable", "Booked"],
        default: "Available"
    },
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    averageRating: { type: Number, default: 0 },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    fineAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add a compound index to enforce uniqueness on slotNumber and parkingLevel
ParkingSchema.index({ slotNumber: 1, parkingLevel: 1 }, { unique: true });

const Parking = mongoose.model("Parking", ParkingSchema);
export default Parking;