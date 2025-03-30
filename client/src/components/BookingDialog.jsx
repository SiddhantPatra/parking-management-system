import React, { useState } from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Button, Input } from "@material-tailwind/react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingDialog = ({ open, handleClose, handleSubmit, selectedSlot, fromDate, toDate, setFromDate, setToDate }) => {
    const [vehicleNumber, setVehicleNumber] = useState("");

    const handleBooking = () => {
        if (!vehicleNumber.trim()) {
            alert("Please enter your vehicle number.");
            return;
        }
        handleSubmit(selectedSlot._id, fromDate, toDate, vehicleNumber, handleClose);
    };

    return (
        <Dialog open={open} handler={handleClose}>
            <DialogHeader>Book Slot</DialogHeader>
            <DialogBody>
                <div className="mb-4">
                    <label>Vehicle Number:</label>
                    <Input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value)}
                        placeholder="Enter vehicle number"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label>From Date:</label>
                    <DatePicker
                        selected={fromDate}
                        onChange={(date) => setFromDate(date)}
                        minDate={new Date()}
                        dateFormat="dd/MM/yyyy"
                        locale="en-GB"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="mb-4">
                    <label>To Date:</label>
                    <DatePicker
                        selected={toDate}
                        onChange={(date) => setToDate(date)}
                        minDate={new Date(fromDate.getTime() + 24 * 60 * 60 * 1000)}
                        dateFormat="dd/MM/yyyy"
                        locale="en-GB"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="gradient" color="green" onClick={handleBooking}>
                    Book
                </Button>
            </DialogFooter>
        </Dialog>
    );
};

export default BookingDialog;
