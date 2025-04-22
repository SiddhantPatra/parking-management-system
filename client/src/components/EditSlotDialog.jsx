import React from "react";
import { Dialog, DialogHeader, DialogBody, DialogFooter, Input, Button } from "@material-tailwind/react";

const EditSlotDialog = ({ open, handleClose, handleEditSubmit, editSlot, setEditSlot }) => {
    return (
        <Dialog open={open} handler={handleClose}>
            <DialogHeader>Edit Parking Slot</DialogHeader>
            <DialogBody>
                <Input
                    label="Slot Number"
                    name="slotNumber"
                    value={editSlot.slotNumber}
                    onChange={(e) => setEditSlot({ ...editSlot, slotNumber: e.target.value })}
                    required
                />
                {/* <Input
                    label="Location"
                    name="location"
                    value={editSlot.location}
                    onChange={(e) => setEditSlot({ ...editSlot, location: e.target.value })}
                    required
                /> */}
                <Input
                    label="Price  (per day)"
                    name="price"
                    type="number"
                    value={editSlot.price}
                    onChange={(e) => setEditSlot({ ...editSlot, price: e.target.value })}
                    min="0"
                    required
                />
                <Input
                        label="Fine Amount (per day)"
                        type="number"
                        value={editSlot.fineAmount || 0}
                        onChange={(e) => setEditSlot({ ...editSlot, fineAmount: Number(e.target.value) })}
                        required
                    />
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={handleClose}>Cancel</Button>
                <Button variant="gradient" color="green" onClick={handleEditSubmit}>Save Changes</Button>
            </DialogFooter>
        </Dialog>
    );
};

export default EditSlotDialog;
