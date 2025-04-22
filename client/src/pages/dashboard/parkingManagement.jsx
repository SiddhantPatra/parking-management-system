import React, { useState, useEffect, lazy, Suspense } from "react";
import {
    Typography,
    Card,
    CardHeader,
    CardBody,
    Button,
    Chip,
    Select,
    Option,
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Input,
    Rating,
} from "@material-tailwind/react";
import { useSelector } from "react-redux";
import {
    fetchParkingSlots,
    createParkingSlot,
    updateParkingSlot,
    deleteParkingSlot,
    fetchParkingLots,
    fetchLevelsByLot,
    createParkingLot,
    updateParkingLot,
    deleteParkingLot,
    addParkingLevel,
    updateParkingLevel,
    deleteParkingLevel,
} from "@/redux/apiCalls";
import { debounce } from "lodash";
import DatePicker from "react-datepicker";
import enGB from 'date-fns/locale/en-GB'; 
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { publicRequest, userRequest } from "@/requestMethods";
import { toast } from "react-toastify";
import ReviewsDialog from "@/components/ReviewsDialog";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";

function ErrorBoundary({ children }) {
    const [hasError, setHasError] = React.useState(false);

    React.useEffect(() => {
        const handleError = (error) => {
            console.error("Error caught by ErrorBoundary:", error);
            setHasError(true);
        };

        window.addEventListener("error", handleError);
        return () => window.removeEventListener("error", handleError);
    }, []);

    if (hasError) {
        return <div>Something went wrong. Please try again later.</div>;
    }

    return children;
}

const BookingDialog = lazy(() => import("../../components/BookingDialog"));
const EditSlotDialog = lazy(() => import("../../components/EditSlotDialog"));
const AddSlotDialog = lazy(() => import("../../components/AddSlotDialog"));

const ParkingManagement = () => {
    const [parkingSlots, setParkingSlots] = useState([]);
    const [parkingLots, setParkingLots] = useState([]);
    const [levels, setLevels] = useState([]);
    const [selectedLot, setSelectedLot] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openAddLotDialog, setOpenAddLotDialog] = useState(false);
    const [openEditLotDialog, setOpenEditLotDialog] = useState(false);
    const [openAddLevelDialog, setOpenAddLevelDialog] = useState(false);
    const [openEditLevelDialog, setOpenEditLevelDialog] = useState(false);
    const [newSlot, setNewSlot] = useState({ slotNumber: "", location: "", price: 0, fineAmount: 0 });
    const [editSlot, setEditSlot] = useState({ _id: "", slotNumber: "", location: "", price: 0, fineAmount: 0 });
    const [newLot, setNewLot] = useState({ name: "", address: "" });
    const [editLot, setEditLot] = useState({ _id: "", name: "", address: "" });
    const [newLevel, setNewLevel] = useState({ name: "", parkingLot: "" });
    const [editLevel, setEditLevel] = useState({ _id: "", name: "", parkingLot: "" });
    const userRole = useSelector((state) => state.user.currentUser?.role || "guest");
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fromDate, setFromDate] = useState(new Date());
    const [toDate, setToDate] = useState(new Date());
    const [openBookingDialog, setOpenBookingDialog] = useState(false);


    const [openReviewsDialog, setOpenReviewsDialog] = useState(false);
    const [currentSlotReviews, setCurrentSlotReviews] = useState({
        reviews: [],
        averageRating: 0,
        reviewCount: 0
    });

    const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
    const [bookingDetails, setBookingDetails] = useState(null);

    // function to fetch reviews
    const fetchSlotReviews = async (slotId) => {
        const token = localStorage.getItem("token");
        try {
            const response = await publicRequest.get(`/bookings/slots/${slotId}/reviews`, { headers: { Authorization: `Bearer ${token}` } });
            setCurrentSlotReviews(response.data.data);
            setOpenReviewsDialog(true);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            toast.error("Failed to load reviews");
        }
    };

    // Automatically set toDate to one day after fromDate
    useEffect(() => {
        const nextDay = new Date(fromDate);
        nextDay.setDate(fromDate.getDate() + 1); // Add 1 day to fromDate
        setToDate(nextDay);
    }, [fromDate]);
    const [availability, setAvailability] = useState({});

    useEffect(() => {
        const updateAvailability = async () => {
            const availabilityMap = {};
            console.log("Slots array:", slots); // Debugging log
            for (const slot of slots) {
                console.log("Checking availability for slot:", slot._id); // Debugging log
                const isAvailable = await checkAvailability(slot._id);
                availabilityMap[slot._id] = isAvailable;
            }
            setAvailability(availabilityMap);
        };

        if (slots?.length > 0) {
            updateAvailability();
        }
    }, [slots, fromDate, toDate]);

    const checkAvailability = async (slotId) => {
        try {
            const token = localStorage.getItem("token");
            // console.log("Sending request for slotId:", slotId);

            const response = await publicRequest.get(`/parking/slots/availability`, {
                params: {
                    slotId,
                    fromDate: new Date(fromDate).toISOString(),
                    toDate: new Date(toDate).toISOString()
                },
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data.available;
        } catch (error) {
            console.error("Error checking availability:", error.response?.data || error.message);
            return false;
        }
    };

    const handleStatusChange = async (slotId, newStatus) => {
        try {
            const token = localStorage.getItem("token");
            await publicRequest.put(
                `/parking/updateSlotStatus`,
                { slotId, status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setSlots(prevSlots =>
                prevSlots.map(slot =>
                    slot._id === slotId ? { ...slot, status: newStatus } : slot
                )
            );
            toast.success("Slot status updated successfully!");
        } catch (error) {
            console.error("Error updating slot status:", error);
            toast.error("Failed to update slot status");
        }
    };
   
    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        console.log("Selected Slot:", slot);
    };
    // Fetch parking lots
    useEffect(() => {
        const loadParkingLots = async () => {
            try {
                const lotsRes = await fetchParkingLots();
                setParkingLots(lotsRes.data);
            } catch (error) {
                console.error("Error fetching parking lots:", error);
            }
        };
        loadParkingLots();
    }, []);

    // Fetch levels by selected parking lot
    useEffect(() => {
        if (selectedLot) {
            const loadLevels = async () => {
                try {
                    const levelsRes = await fetchLevelsByLot(selectedLot);
                    setLevels(levelsRes.data);
                } catch (error) {
                    console.error("Error fetching levels:", error); 
                    toast.error("Failed to fetch levels");
                }
            };
            loadLevels();
        }
    }, [selectedLot]);

    // Fetch slots by selected level
    useEffect(() => {
        if (selectedLevel) {
            const fetchSlots = async () => {
                setLoading(true);
                setError(null);

                try {
                    const data = await fetchParkingSlots(selectedLevel, "Available");


                    setSlots(Array.isArray(data) ? data : []); // data already includes review info
                    toast.success("Slot fetched successfully!"); 
                } catch (err) {
                    setError(err.message); 
                    toast.error("Failed to fetch slot  ");
                    setSlots([]);
                } finally {
                    setLoading(false);
                }
            };

            fetchSlots();
        }
    }, [selectedLevel]);

    // Handle adding a new slot
    const handleAddSlot = async () => {
        try {
            await createParkingSlot({
                slotNumber: newSlot.slotNumber,
                parkingLevel: selectedLevel,
                location: newSlot.location,
                price: newSlot.price,
                fineAmount: newSlot.fineAmount
            });
            // Refetch slots after adding
            const data = await fetchParkingSlots(selectedLevel, "Available");
            setSlots(slots);
            setOpenAddDialog(false);
            setNewSlot({ slotNumber: "", location: "", price: 0, fineAmount: 0 });
            toast.success("Slot added successfully!");
        } catch (error) {
            console.error("Error creating slot:", error);
            toast.error("Failed to add slot");
        }
    };

    // Handle editing a slot
    const handleEditSlot = async () => {
        try {
            await updateParkingSlot(editSlot._id, {
                slotNumber: editSlot.slotNumber,
                location: editSlot.location,
                price: editSlot.price,
                fineAmount: editSlot.fineAmount // Include fine amount in update
            });

            // Refetch slots after editing
            const data = await fetchParkingSlots(selectedLevel, "Available");
            setSlots(data.data);
            setOpenEditDialog(false);
            toast.success("Slot updated successfully!");
        } catch (error) {
            console.error("Error updating slot:", error);
            toast.error("Failed to update slot");
        }
    };

    // Handle deleting a slot
    const handleDeleteSlot = async (id) => {
        try {
            await deleteParkingSlot(id);
            // Refetch slots after deleting
            const data = await fetchParkingSlots(selectedLevel, "Available");
            setSlots(data.data);
            toast.success("Slot deleted successfully!");
        } catch (error) {
            console.error("Error deleting slot:", error);
            toast.error("Failed to delete slot");
        }
    };

    // Handle adding a new parking lot
    const handleAddLot = async () => {
        try {
            await createParkingLot(newLot);
            // Refetch parking lots
            const lotsRes = await fetchParkingLots();
            setParkingLots(lotsRes.data);
            setOpenAddLotDialog(false);
            setNewLot({ name: "", address: "" });
            toast.success("Parking lot added successfully!");
        } catch (error) {
            console.error("Error creating parking lot:", error);
            toast.error("Failed to add parking lot");
        }
    };
    // Handle editing a parking lot
    const handleEditLot = async () => {
        try {
            await updateParkingLot(editLot._id, editLot);
            // Refetch parking lots
            const lotsRes = await fetchParkingLots();
            setParkingLots(lotsRes.data);
            setOpenEditLotDialog(false);
            toast.success("Parking lot updated successfully!");
        } catch (error) {
            console.error("Error updating parking lot:", error);
            toast.error(error.response?.data?.message || "Failed to update parking lot");
        }
    };


    // Handle deleting a parking lot
    const handleDeleteLot = async (id) => {
        if (window.confirm("Are you sure you want to delete this parking lot?")) {
            try {
                await deleteParkingLot(id);
                // Refetch parking lots
                const lotsRes = await fetchParkingLots();
                setParkingLots(lotsRes.data);
                toast.success("Parking lot deleted successfully!");
            } catch (error) {
                console.error("Error deleting parking lot:", error);
                toast.error(error.response?.data?.message || "Failed to delete parking lot");
            }
        }
    };

    // Handle adding a new parking level
    const handleAddLevel = async () => {
        try {
            await addParkingLevel({
                name: newLevel.name,
                parkingLot: selectedLot,
            });
            // Refetch levels
            const levelsRes = await fetchLevelsByLot(selectedLot);
            setLevels(levelsRes.data);
            setOpenAddLevelDialog(false);
            setNewLevel({ name: "", parkingLot: "" });
            toast.success("Parking level added successfully!");
        } catch (error) {
            console.error("Error creating parking level:", error);
            toast.error("Failed to add parking level");
        }
    };

    // Handle editing a parking level
    const handleEditLevel = async () => {
        try {
            await updateParkingLevel(editLevel._id, editLevel);
            // Refetch levels
            const levelsRes = await fetchLevelsByLot(selectedLot);
            setLevels(levelsRes.data);
            setOpenEditLevelDialog(false);
            toast.success("Parking level updated successfully!");
        } catch (error) {
            console.error("Error updating parking level:", error);
            toast.error(error.response?.data?.message || "Failed to update parking level");
        }
    };

    // Handle deleting a parking level
    const handleDeleteLevel = async (id) => {
        if (window.confirm("Are you sure you want to delete this parking level?")) {
            try {
                await deleteParkingLevel(id);
                // Refetch levels
                const levelsRes = await fetchLevelsByLot(selectedLot);
                setLevels(levelsRes.data);
                toast.success("Parking level deleted successfully!");
            } catch (error) {
                console.error("Error deleting parking level:", error);
                toast.error(error.response?.data?.message || "Failed to delete parking level");
            }
        }
    };

    const handleBookSlot = async (slotId, fromDate, toDate, vehicleNumber, closeDialog) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("User is not authenticated. Token missing.");

            console.log("Booking slot:", slotId, "Vehicle:", vehicleNumber);

            const response = await publicRequest.post(
                `/parking/slots/${slotId}/book`,
                { fromDate, toDate, vehicleNumber },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Calculate total days and amount
            const totalDays = Math.ceil((new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24));
            const dailyRate = selectedSlot.price;
            const totalAmount = totalDays * dailyRate;

            setBookingDetails({
                ...response.data?.booking,
                slotNumber: selectedSlot.slotNumber,
                fromDate,
                toDate,
                vehicleNumber,
                totalDays,
                dailyRate,
                totalAmount,
                status: "confirmed"
            });
            // ✅ Show success message
            toast.success("Slot booked successfully!");

            // ✅ Show payment success modal
            setShowPaymentSuccessModal(true);


            // ✅ Close the modal
            closeDialog();

            // ✅ Reset fields
            setFromDate(new Date());
            setToDate(new Date(new Date().getTime() + 24 * 60 * 60 * 1000)); // Next day
            // setBookingDetails(null)
            // setSelectedLot("")
            // setSelectedLevel("")
        } catch (error) {
            console.error("Error booking slot:", error.response?.data || error.message);
            toast.error("Failed to book slot. Please try again.");
        }
    };
    return (
        <>
            <div className="mt-12 mb-8 flex flex-col gap-12">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="p-6 flex justify-between">
                        <Typography variant="h6" color="white">
                            Parking Management
                        </Typography>
                        {(userRole === "admin" || userRole === "moderator") && (
                            <div className="flex gap-2">
                                {userRole === "admin" && ( // Only admin can add lots
                                    <Button color="white" onClick={() => setOpenAddLotDialog(true)}>
                                        + Add Lot
                                    </Button>
                                )}
                                <Button color="white" onClick={() => setOpenAddLevelDialog(true)}>
                                    + Add Level
                                </Button>
                                <Button color="white" onClick={() => setOpenAddDialog(true)}>
                                    + Add Slot
                                </Button>
                            </div>
                        )}
                    </CardHeader>
                    <CardBody>

                        <div className="my-4 flex flex-row max-sm:flex-col w-full gap-8">
                            <div className="my-4 ">
                                <label className="px-4">From Date:</label>
                                <DatePicker className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    selected={fromDate}
                                    onChange={(date) => setFromDate(date)}
                                    dateFormat="dd/MM/yyyy"
    locale="en-GB"
                                    minDate={new Date()} // Prevent selecting past dates  
                                />
                            </div>
                            <div className="my-4  px-4">
                                <label className="px-4">To Date:</label>
                                <DatePicker className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    selected={toDate}
                                    onChange={(date) => setToDate(date)}
                                    dateFormat="dd/MM/yyyy"
    locale="en-GB"
                                    minDate={new Date(fromDate.getTime() + 24 * 60 * 60 * 1000)} // Prevent selecting dates before fromDate + 1 day
                                />
                            </div>
                        </div>
                        {/* Parking Lot Selection */}
                        <div className="mb-4">
                            {parkingLots?.length > 0 ? (
                                <div className="relative">
                                    <Select
                                        label="Select Parking Lot"
                                        value={selectedLot}
                                        onChange={(e) => {
                                            console.log("Selected Lot:", e);
                                            setSelectedLot(e);
                                            setSelectedLevel("");
                                        }}
                                        className="z-0" // Ensure select stays behind action buttons
                                    >
                                        {parkingLots.map((lot) => (
                                            <Option key={lot._id} value={lot._id}>
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="truncate">{lot.name}</span>
                                                    {/* Empty div to maintain alignment */}
                                                    <div className="w-24"></div>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>

                                    {/* Action buttons positioned absolutely */}
                                    {selectedLot && (
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2 z-10">
                                            {userRole != "user" && (
                                                <Button
                                                    size="sm"
                                                    variant="text"
                                                    color="blue"
                                                    className="p-1"
                                                    onClick={() => {
                                                        const lot = parkingLots.find(l => l._id === selectedLot);
                                                        if (lot) {
                                                            setEditLot(lot);
                                                            setOpenEditLotDialog(true);
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Button>
                                            )}
                                            {userRole === "admin" && (
                                                <Button
                                                    size="sm"
                                                    variant="text"
                                                    color="red"
                                                    className="p-1"
                                                    onClick={() => handleDeleteLot(selectedLot)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Typography variant="small" color="gray">
                                    No parking lots available.
                                </Typography>
                            )}
                        </div>

                        {/* Parking Level Selection */}
                        <div className="mb-4">
                            {selectedLot && levels?.length > 0 ? (
                                <div className="relative">
                                    <Select
                                        label="Select Level"
                                        value={selectedLevel}
                                        onChange={(e) => {
                                            console.log("Selected Level:", e);
                                            setSelectedLevel(e);
                                        }}
                                        className="z-0"
                                    >
                                        {levels.map((level) => (
                                            <Option key={level._id} value={level._id}>
                                                <div className="flex justify-between items-center w-full">
                                                    <span className="truncate">{level.name}</span>
                                                    {/* Empty div to maintain alignment */}
                                                    <div className="w-24"></div>
                                                </div>
                                            </Option>
                                        ))}
                                    </Select>

                                    {/* Action buttons positioned absolutely */}
                                    {selectedLevel && (
                                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2 z-10">
                                            {userRole != "user" && (
                                                <Button
                                                    size="sm"
                                                    variant="text"
                                                    color="blue"
                                                    className="p-1"
                                                    onClick={() => {
                                                        const level = levels.find(l => l._id === selectedLevel);
                                                        if (level) {
                                                            setEditLevel(level);
                                                            setOpenEditLevelDialog(true);
                                                        }
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Button>
                                            )}
                                            {userRole === "admin" && (
                                                <Button
                                                    size="sm"
                                                    variant="text"
                                                    color="red"
                                                    className="p-1"
                                                    onClick={() => handleDeleteLevel(selectedLevel)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : selectedLot ? (
                                <Typography variant="small" color="gray">
                                    No levels available for this lot.
                                </Typography>
                            ) : null}
                        </div>


                        {/* Display Slots */}
                        {selectedLevel && (
                            <table className="w-full min-w-[640px] table-auto">
                                <thead>
                                    <tr>
                                        {["Slot Number", "Status", "Rating", "Price", "Fine Amount", "Actions"].map((el) => (
                                            <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
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
                                    {slots?.length > 0 ? (
                                        slots.map((slot) => {
                                            const isAvailable = availability[slot._id] || false;
                                            return (
                                                <tr key={slot._id}>
                                                    <td className="py-3 px-5">{slot.slotNumber}</td>
                                                    <td>
                                                        {(userRole === "admin" || userRole === "moderator") ? (
                                                            <Select
                                                                value={slot.status}
                                                                onChange={(e) => handleStatusChange(slot._id, e)}
                                                            >
                                                                <Option value="Available">Available</Option>
                                                                <Option value="Unavailable">Unavailable</Option>
                                                                <Option value="Booked">Booked</Option>
                                                                <Option value="Maintenance">Maintenance</Option>
                                                            </Select>
                                                        ) : (
                                                            <Chip
                                                                variant="gradient"
                                                                color={
                                                                    isAvailable ? "green" :
                                                                        slot.status === "unavailable" ? "amber" : "red"
                                                                }
                                                                value={ ""}
                                                            />
                                                        )}
                                                    </td>
                                                    <td>
                                                        {slot.reviewCount > 0 ? (
                                                            <div className="flex items-center">
                                                                <Rating
                                                                    value={Math.round(slot.averageRating)}
                                                                    readonly
                                                                    ratedColor="amber"
                                                                    size="sm"
                                                                />
                                                                <Typography variant="small" className="ml-2">
                                                                    ({slot.reviewCount})
                                                                </Typography>
                                                            </div>
                                                        ) : (
                                                            <Typography variant="small" color="gray">
                                                                No reviews
                                                            </Typography>
                                                        )}
                                                    </td>
                                                    <td>${slot.price}  </td>
                                                    <td>${slot.fineAmount || 0}</td>
                                                    <td>
                                                        <Button
                                                            color="blue-gray"
                                                            size="sm"
                                                            onClick={() => fetchSlotReviews(slot._id)}
                                                            className="mr-2"
                                                        >
                                                            View Reviews ({slot.reviewCount || 0})
                                                        </Button>
                                                        {(userRole === "admin" || userRole === "moderator") && (
                                                            <>
                                                                <Button
                                                                    color="blue"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditSlot(slot);
                                                                        setOpenEditDialog(true);
                                                                    }}
                                                                    className="mr-2"
                                                                >
                                                                    Edit
                                                                </Button>
                                                                {userRole === "admin" && ( // Only show delete for admin
                                                                    <Button
                                                                        color="red"
                                                                        size="sm"
                                                                        onClick={() => handleDeleteSlot(slot._id)}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                )}
                                                            </>
                                                        )}
                                                        {userRole === "user" && (
                                                            <Button
                                                                className="bg-green-500"
                                                                disabled={!isAvailable}
                                                                onClick={() => {
                                                                    setSelectedSlot(slot);
                                                                    setOpenBookingDialog(true);
                                                                }}
                                                            >
                                                                Book Now
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4 text-gray-500">
                                                No available slots for this level.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </CardBody>
                </Card>
                <ErrorBoundary>
                    <Suspense fallback={<p>Loading...</p>}>
                        <BookingDialog
                            open={openBookingDialog}
                            handleClose={() => setOpenBookingDialog(false)}
                            handleSubmit={handleBookSlot}
                            selectedSlot={selectedSlot}
                            fromDate={fromDate}
                            toDate={toDate}
                            setFromDate={setFromDate}
                            setToDate={setToDate}
                        />

                        <AddSlotDialog
                            open={openAddDialog}
                            handleClose={() => setOpenAddDialog(false)}
                            handleSubmit={handleAddSlot}
                            newSlot={newSlot}
                            setNewSlot={setNewSlot}
                        />
                        <EditSlotDialog
                            open={openEditDialog}
                            handleClose={() => setOpenEditDialog(false)}
                            handleEditSubmit={handleEditSlot}
                            editSlot={editSlot}
                            setEditSlot={setEditSlot}
                        />
                    </Suspense>
                </ErrorBoundary>

                {/* review dialog */}
                <ReviewsDialog
                    open={openReviewsDialog}
                    handleClose={() => setOpenReviewsDialog(false)}
                    reviewsData={currentSlotReviews}
                />


                {bookingDetails && (
                    <PaymentSuccessModal
                        open={showPaymentSuccessModal}
                        onClose={() => {
                            setShowPaymentSuccessModal(false)
                            setBookingDetails(null)
                            setSelectedLot("")
                            setSelectedLevel("")
                        }}
                        bookingDetails={bookingDetails}
                    />
                )}

                {/* Add Parking Lot Dialog */}
                <Dialog open={openAddLotDialog} handler={() => setOpenAddLotDialog(false)}>
                    <DialogHeader>Add New Parking Lot</DialogHeader>
                    <DialogBody>
                        <Input
                            label="Name"
                            value={newLot.name}
                            onChange={(e) => setNewLot({ ...newLot, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Address"
                            value={newLot.address}
                            onChange={(e) => setNewLot({ ...newLot, address: e.target.value })}
                            required
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setOpenAddLotDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="gradient" color="green" onClick={handleAddLot}>
                            Add Lot
                        </Button>
                    </DialogFooter>
                </Dialog>

                {/* Edit Parking Lot Dialog */}
                <Dialog open={openEditLotDialog} handler={() => setOpenEditLotDialog(false)}>
                    <DialogHeader>Edit Parking Lot</DialogHeader>
                    <DialogBody>
                        <Input
                            label="Name"
                            value={editLot.name}
                            onChange={(e) => setEditLot({ ...editLot, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Address"
                            value={editLot.address}
                            onChange={(e) => setEditLot({ ...editLot, address: e.target.value })}
                            required
                        />
                        <Input
                            label="Contact Number"
                            value={editLot.contactNumber || ''}
                            onChange={(e) => setEditLot({ ...editLot, contactNumber: e.target.value })}
                        />
                        <Input
                            label="Capacity"
                            type="number"
                            min="0"
                            value={editLot.capacity || ''}
                            onChange={(e) => setEditLot({ ...editLot, capacity: e.target.value })}
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setOpenEditLotDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="gradient" color="green" onClick={handleEditLot}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </Dialog>

                {/* Add Parking Level Dialog */}
                <Dialog open={openAddLevelDialog} handler={() => setOpenAddLevelDialog(false)}>
                    <DialogHeader>Add New Parking Level</DialogHeader>
                    <DialogBody>
                        <Input
                            label="Name"
                            value={newLevel.name}
                            onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                            required
                        />
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setOpenAddLevelDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="gradient" color="green" onClick={handleAddLevel}>
                            Add Level
                        </Button>
                    </DialogFooter>
                </Dialog>

                {/* Edit Parking Level Dialog */}
                <Dialog open={openEditLevelDialog} handler={() => setOpenEditLevelDialog(false)}>
                    <DialogHeader>Edit Parking Level</DialogHeader>
                    <DialogBody>
                        <Input
                            label="Name"
                            value={editLevel.name}
                            onChange={(e) => setEditLevel({ ...editLevel, name: e.target.value })}
                            required
                        />
                        {/* <Input
                            label="Floor Number"
                            type="number"
                            value={editLevel.floorNumber || ''}
                            onChange={(e) => setEditLevel({ ...editLevel, floorNumber: e.target.value })}
                            required
                        /> */}
                        {/* <Input
                            label="Capacity"
                            type="number"
                            min="0"
                            value={editLevel.capacity || ''}
                            onChange={(e) => setEditLevel({ ...editLevel, capacity: e.target.value })}
                        /> */}
                    </DialogBody>
                    <DialogFooter>
                        <Button variant="text" color="red" onClick={() => setOpenEditLevelDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="gradient" color="green" onClick={handleEditLevel}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </Dialog>
            </div>
        </>
    );
};

export default ParkingManagement;