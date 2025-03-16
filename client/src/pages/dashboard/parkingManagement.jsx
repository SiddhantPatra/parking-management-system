import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Chip,
    Button,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, BookmarkIcon } from "@heroicons/react/24/outline";
import { publicRequest } from "@/requestMethods";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ParkingManagement = () => {
    const [parkingSlots, setParkingSlots] = useState([]);
    const [bookings, setBookings] = useState([]); // State for bookings
    const [openDialog, setOpenDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openBookingDialog, setOpenBookingDialog] = useState(false);
    const [newSlot, setNewSlot] = useState({ slotNumber: "", location: "", price: 0 });
    const [editSlot, setEditSlot] = useState({ _id: "", slotNumber: "", location: "", price: 0 });
    const [bookingSlot, setBookingSlot] = useState({ _id: "", vehicleNumber: "", fromDate: new Date(), toDate: new Date() });
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [userRole, setUserRole] = useState("");

    // Fetch user role from localStorage
    useEffect(() => {
        try {
            const persistedState = JSON.parse(localStorage.getItem("persist:root"));
            if (!persistedState || !persistedState.user) {
                console.error("No user data found in localStorage.");
                return false;
            }

            const user = JSON.parse(persistedState.user);
            if (!user || !user.currentUser) {
                console.error("No currentUser found in the user data.");
                return false;
            }

            const currentUserRole = user.currentUser.role;
            if (currentUserRole) {
                setUserRole(currentUserRole);
            } else {
                console.error("User role not found in localStorage.");
                setUserRole("guest"); // Fallback role
            }
        } catch (error) {
            console.error("Error parsing user data from localStorage:", error);
            setUserRole("guest"); // Fallback role
        }
    }, []);

    // Fetch parking slots
    useEffect(() => {
        const fetchParkingSlots = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No token found. Please log in.");
                    return;
                }

                const response = await publicRequest.get("/parking/slots", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setParkingSlots(response.data);
            } catch (error) {
                console.error("Error fetching parking slots:", error);
            }
        };

        fetchParkingSlots();
    }, []);

    // Fetch bookings
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No token found. Please log in.");
                    return;
                }

                const response = await publicRequest.get("/bookings/user", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setBookings(response.data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
                setError("An error occurred while fetching bookings.");
            }
        };
        fetchBookings();
    }, []);

    // Handle form input change
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewSlot({ ...newSlot, [name]: value });
    };

    // Handle edit form input change
    const handleEditInputChange = (e) => {
        const { name, value } = e.target;
        setEditSlot({ ...editSlot, [name]: value });
    };

    // Handle booking form input change
    const handleBookingInputChange = (e) => {
        const { name, value } = e.target;
        setBookingSlot({ ...bookingSlot, [name]: value });
    };

    // Handle booking date change
    const handleBookingDateChange = (date, field) => {
        setBookingSlot({ ...bookingSlot, [field]: date });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { slotNumber, location, price } = newSlot;

            // Validate input fields
            if (!slotNumber || !location || price === undefined) {
                setError("Slot number, location, and price are required.");
                return;
            }

            // Validate that slotNumber and location are not the same
            if (slotNumber.toLowerCase() === location.toLowerCase()) {
                setError("Slot number and location cannot be the same.");
                return;
            }

            // Validate that price is not negative
            if (price < 0) {
                setError("Price cannot be negative.");
                return;
            }

            const slotToCreate = {
                slotNumber,
                location,
                price,
                status: "Available", // Default status
            };

            const token = localStorage.getItem("token");
            const response = await publicRequest.post("/parking/slots", slotToCreate, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Add the new slot to the list
            setParkingSlots([...parkingSlots, response.data]);
            setOpenDialog(false);
            setNewSlot({ slotNumber: "", location: "", price: 0 }); // Reset form
            setError(""); // Clear any previous errors
        } catch (error) {
            console.error("Error creating parking slot:", error);
            setError("An error occurred while creating the parking slot.");
        }
    };

    // Handle edit submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { _id, slotNumber, location, price } = editSlot;

            // Validate that slotNumber and location are not the same
            if (slotNumber.toLowerCase() === location.toLowerCase()) {
                setError("Slot number and location cannot be the same.");
                return;
            }

            // Validate that price is not negative
            if (price < 0) {
                setError("Price cannot be negative.");
                return;
            }

            const updatedSlot = {
                slotNumber,
                location,
                price,
            };

            const token = localStorage.getItem("token");
            const response = await publicRequest.put(`/parking/slots/${_id}`, updatedSlot, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Update the slot in the list
            setParkingSlots(parkingSlots.map(slot => (slot._id === _id ? response.data : slot)));
            setOpenEditDialog(false);
            setError(""); // Clear any previous errors
        } catch (error) {
            console.error("Error updating parking slot:", error);
            setError("An error occurred while updating the parking slot.");
        }
    };

    // Handle delete
    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem("token");
            await publicRequest.delete(`/parking/slots/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Remove the slot from the list
            setParkingSlots(parkingSlots.filter(slot => slot._id !== id));
        } catch (error) {
            console.error("Error deleting parking slot:", error);
        }
    };

    // Handle booking
    const handleBooking = async (e) => {
        e.preventDefault();
        try {
            const { _id, vehicleNumber, fromDate, toDate } = bookingSlot;

            // Validate input fields
            if (!vehicleNumber || !fromDate || !toDate) {
                setError("Vehicle number, from date, and to date are required.");
                return;
            }

            // Validate that toDate is after or equal to fromDate
            if (toDate < fromDate) {
                setError("To date must be after or equal to from date.");
                return;
            }

            const bookingData = {
                parkingSlot: _id,
                vehicleNumber,
                fromDate,
                toDate,
            };

            const token = localStorage.getItem("token"); // Get the token from localStorage
            if (!token) {
                setError("No token found. Please log in.");
                return;
            }

            const response = await publicRequest.post("/bookings", bookingData, {
                headers: {
                    Authorization: `Bearer ${token}`, // Send the token in the Authorization header
                },
            });

            // Update the bookings list
            setBookings([...bookings, response.data]);
            setOpenBookingDialog(false);
            setError(""); // Clear any previous errors
        } catch (error) {
            console.error("Error booking parking slot:", error);
            setError("An error occurred while booking the parking slot.");
        }
    };

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = parkingSlots.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <div className="mt-12 mb-8 flex flex-col gap-12">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="white">
                            Parking Slots Management
                        </Typography>
                        {userRole == "admin" && (
                            <Button
                                color="white"
                                className="flex items-center gap-2"
                                onClick={() => setOpenDialog(true)}
                            >
                                <PlusIcon className="h-5 w-5" />
                                Add New Slot
                            </Button>
                        )}
                    </CardHeader>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        {parkingSlots.length === 0 ? (
                            <Typography variant="h6" color="blue-gray" className="text-center py-8">
                                No data available
                            </Typography>
                        ) : (
                            <>
                                <table className="w-full min-w-[640px] table-auto">
                                    <thead>
                                        <tr>
                                            {["Slot Number", "Location", "Status", "Price", "Vehicle Number", "Booked By", "Actions"].map((el) => (
                                                <th
                                                    key={el}
                                                    className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                                >
                                                    <Typography
                                                        variant="small"
                                                        className="text-[11px] font-bold uppercase text-blue-gray-400"
                                                    >
                                                        {el}
                                                    </Typography>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((slot) => (
                                            <tr key={slot._id}>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {slot.slotNumber}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {slot.location}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Chip
                                                        variant="gradient"
                                                        color={slot.status === "Available" ? "green" : "red"}
                                                        value={slot.status}
                                                        className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                                    />
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        &#8377; {slot.price}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {slot.vehicleNumber || "N/A"}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {slot.bookedBy?.username || "N/A"}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    {userRole === "user" ? (
                                                        <Button className=" flex flex-row "
                                                            color="blue"
                                                            size="sm"
                                                            onClick={() => {
                                                                setBookingSlot({ _id: slot._id, vehicleNumber: "", fromDate: new Date(), toDate: new Date() });
                                                                setOpenBookingDialog(true);
                                                            }}
                                                        >
                                                            <BookmarkIcon className="h-4 w-4" />
                                                            Book
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                color="blue"
                                                                size="sm"
                                                                className="mr-2"
                                                                onClick={() => {
                                                                    setEditSlot(slot);
                                                                    setOpenEditDialog(true);
                                                                }}
                                                            >
                                                                <PencilIcon className="h-4 w-4" />
                                                            </Button>
                                                            {userRole == "admin" && (<Button
                                                                color="red"
                                                                size="sm"
                                                                onClick={() => handleDelete(slot._id)}
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </Button>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination Controls */}
                                <div className="flex justify-center mt-4">
                                    {Array.from({ length: Math.ceil(parkingSlots.length / itemsPerPage) }, (_, i) => (
                                        <Button
                                            key={i + 1}
                                            color={currentPage === i + 1 ? "blue" : "gray"}
                                            onClick={() => paginate(i + 1)}
                                            className="mx-1"
                                        >
                                            {i + 1}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Dialog for adding new parking slots */}
            <Dialog open={openDialog} handler={() => setOpenDialog(!openDialog)}>
                <DialogHeader>Add New Parking Slot</DialogHeader>
                <DialogBody>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Slot Number"
                                name="slotNumber"
                                value={newSlot.slotNumber}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Location"
                                name="location"
                                value={newSlot.location}
                                onChange={handleInputChange}
                                required
                            />
                            <Input
                                label="Price"
                                name="price"
                                type="number"
                                value={newSlot.price}
                                onChange={handleInputChange}
                                min="0" // Ensure price cannot be negative
                                required
                            />
                        </div>
                    </form>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setOpenDialog(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleSubmit}>
                        Add Slot
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Dialog for editing parking slots */}
            <Dialog open={openEditDialog} handler={() => setOpenEditDialog(!openEditDialog)}>
                <DialogHeader>Edit Parking Slot</DialogHeader>
                <DialogBody>
                    <form onSubmit={handleEditSubmit}>
                        <div className="space-y-4">
                            <Input
                                label="Slot Number"
                                name="slotNumber"
                                value={editSlot.slotNumber}
                                onChange={handleEditInputChange}
                                required
                            />
                            <Input
                                label="Location"
                                name="location"
                                value={editSlot.location}
                                onChange={handleEditInputChange}
                                required
                            />
                            <Input
                                label="Price"
                                name="price"
                                type="number"
                                value={editSlot.price}
                                onChange={handleEditInputChange}
                                min="0" // Ensure price cannot be negative
                                required
                            />
                        </div>
                    </form>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setOpenEditDialog(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleEditSubmit}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Dialog for booking parking slots */}
            <Dialog open={openBookingDialog} handler={() => setOpenBookingDialog(!openBookingDialog)}>
                <DialogHeader>Book Parking Slot</DialogHeader>
                <DialogBody>
                    <form onSubmit={handleBooking}>
                        <div className="space-y-4">
                            <Input
                                label="Vehicle Number"
                                name="vehicleNumber"
                                value={bookingSlot.vehicleNumber}
                                onChange={handleBookingInputChange}
                                required
                            />
                            <div>
                                <label>From Date</label>
                                <DatePicker
                                    selected={bookingSlot.fromDate}
                                    onChange={(date) => handleBookingDateChange(date, "fromDate")}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={new Date()}
                                />
                            </div>
                            <div>
                                <label>To Date</label>
                                <DatePicker
                                    selected={bookingSlot.toDate}
                                    onChange={(date) => handleBookingDateChange(date, "toDate")}
                                    dateFormat="yyyy-MM-dd"
                                    minDate={bookingSlot.fromDate}
                                />
                            </div>
                        </div>
                    </form>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setOpenBookingDialog(false)}
                        className="mr-2"
                    >
                        Cancel
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleBooking}>
                        Book Slot
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Display error messages */}
            {error && (
                <Typography color="red" className="text-center mt-4">
                    {error}
                </Typography>
            )}
        </>
    );
};

export default ParkingManagement;