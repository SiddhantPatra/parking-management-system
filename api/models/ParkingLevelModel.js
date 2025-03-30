import mongoose from "mongoose";

const ParkingLevelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    parkingLot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ParkingLot", // Linked to the location
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Add a compound index to enforce uniqueness on name and parkingLot
ParkingLevelSchema.index({ name: 1, parkingLot: 1 }, { unique: true });

const ParkingLevel = mongoose.model("ParkingLevel", ParkingLevelSchema);
export default ParkingLevel;