import mongoose from "mongoose";

const ParkingLotSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const ParkingLot = mongoose.model("ParkingLot", ParkingLotSchema);
export default ParkingLot;
