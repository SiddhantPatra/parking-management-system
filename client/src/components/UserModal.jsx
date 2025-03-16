import React from "react";
import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Typography,
    Button,
    Chip, // Import the Chip component
} from "@material-tailwind/react";

export function UserModal({ user, open, handleClose }) {
    if (!user) return null;

    return (
        <Dialog open={open} handler={handleClose}>
            <DialogHeader>User Details</DialogHeader>
            <DialogBody>
                <div className="space-y-4">
                    <Typography variant="h6">
                        {user.firstName} {user.lastName}
                    </Typography>
                    <Typography>
                        <strong>Email:</strong> {user.email}
                    </Typography>
                    <Typography>
                        <strong>Contact:</strong> {user.contact || "N/A"}
                    </Typography>
                    <Typography>
                        <strong>Vehicle:</strong> {user.vehicle || "N/A"}
                    </Typography>
                    <Typography>
                        <strong>Role:</strong> {user.role}
                    </Typography>
                    <Typography>
                        <strong>Status:</strong>{" "}
                        <Chip
                            variant="gradient"
                            color={user.verified === "true" ? "green" : "blue-gray"}
                            value={user.verified === "true" ? "Verified" : "Not Verified"}
                            className="py-0.5 px-2 text-[11px] font-medium w-fit"
                        />
                    </Typography>
                </div>
            </DialogBody>
            <DialogFooter>
                <Button variant="text" color="red" onClick={handleClose}>
                    Close
                </Button>
            </DialogFooter>
        </Dialog>
    );
}