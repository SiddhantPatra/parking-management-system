import React from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Input, Button } from "@material-tailwind/react";

const AddSlotDialog = ({ open, handleClose, handleSubmit, newSlot, setNewSlot }) => {
    return (
        <Dialog open={open} handler={handleClose}>
            <DialogHeader>Add New Parking Slot</DialogHeader>
            <DialogBody>
                <Input
                    label="Slot Number"
                    name="slotNumber"
                    value={newSlot.slotNumber}
                    onChange={(e) => setNewSlot({ ...newSlot, slotNumber: e.target.value })}
                    required
                />
                <Input
                    label="Price (per day)"
                    name="price"
                    type="number"
                    value={newSlot.price}
                    onChange={(e) => setNewSlot({ ...newSlot, price: e.target.value })}
                    min="0"
                    required
                />
                <Input
                    label="Fine Amount (per day)"
                    type="number"
                    value={newSlot.fineAmount || 0}
                    onChange={(e) => setNewSlot({ ...newSlot, fineAmount:e.target.value })}
                    required
                />
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={handleClose}>Cancel</Button>
                <Button variant="gradient" color="green" onClick={handleSubmit}>Add Slot</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default AddSlotDialog;
