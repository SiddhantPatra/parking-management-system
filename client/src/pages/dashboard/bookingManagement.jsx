import React, { useState, useEffect } from "react";
import {
    Card, CardHeader, CardBody, Typography, Button, Dialog,
    DialogHeader, DialogBody, DialogFooter, Input,
    Chip, Rating, Textarea
} from "@material-tailwind/react";
import { publicRequest } from "@/requestMethods";
import { deleteBooking, updateBooking } from "@/redux/apiCalls";
import jsPDF from "jspdf";
import enGB from 'date-fns/locale/en-GB';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [userRole, setUserRole] = useState("");
    const [userId, setUserId] = useState("");

    // Edit Booking State
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editError, setEditError] = useState("");


    // Rating and Review State
    const [openReviewDialog, setOpenReviewDialog] = useState(false);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewError, setReviewError] = useState("");

    // Handle Submit Review
    const handleSubmitReview = async (bookingId) => {
        if (!reviewRating) {
            setReviewError("Please provide a rating");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setReviewError("Authentication required");
                return;
            }

            await publicRequest.post(
                `/bookings/${bookingId}/review`,
                { rating: reviewRating, comment: reviewComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state or refetch bookings
            setBookings(bookings.map(b =>
                b._id === bookingId ? { ...b, review: { rating: reviewRating, comment: reviewComment } } : b
            ));

            setOpenReviewDialog(false);
            setReviewRating(0);
            setReviewComment("");
            setReviewError("");
        } catch (error) {
            console.error("Error submitting review:", error);
            setReviewError(error.response?.data?.message || "Failed to submit review");
        }
    };


    useEffect(() => {
        try {
            const persistedState = JSON.parse(localStorage.getItem("persist:root"));
            if (!persistedState || !persistedState.user) return;

            const user = JSON.parse(persistedState.user);
            if (!user || !user.currentUser) return;

            setUserId(user.currentUser._id);
            setUserRole(user.currentUser.role || "guest");
        } catch (error) {
            console.error("Error parsing user data:", error);
            setUserRole("guest");
        }
    }, []);

    // Fetch bookings
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                let url = `/bookings/user/${userId}`;
                if (userRole === "admin" || userRole === "moderator") url = "/bookings";

                const response = await publicRequest.get(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setBookings(Array.isArray(response.data) ? response.data : []);
            } catch (error) {
                setError("Error fetching bookings.");
                setBookings([]);
            }
        };

        if (userId) fetchBookings();
    }, [userId, userRole]);

    // Handle Edit
    const handleEditClick = (booking) => {
        setSelectedBooking(booking);
        setVehicleNumber(booking.vehicleNumber);
        setFromDate(new Date(booking.fromDate).toISOString().split("T")[0]);
        setToDate(new Date(booking.toDate).toISOString().split("T")[0]);
        setOpenEditDialog(true);
        setEditError("");
    };

    // Handle Booking Update
    const handleUpdateBooking = async () => {
        if (!selectedBooking) return;

        // Validate dates
        if (new Date(toDate) <= new Date(fromDate)) {
            setEditError("To date must be after from date");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setEditError("Authentication required");
                return;
            }

            const updatedData = { vehicleNumber, fromDate, toDate };
            const response = await publicRequest.put(
                `/bookings/${selectedBooking._id}`,
                updatedData,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setBookings(bookings.map(b =>
                b._id === selectedBooking._id ? { ...b, ...updatedData } : b
            ));
            setOpenEditDialog(false);
        } catch (error) {
            console.error("Error updating booking:", error);
            setEditError(error.response?.data?.message || "Failed to update booking");
        }
    };

    // Handle Booking Delete
    const handleDeleteBooking = async (bookingId) => {
        if (!window.confirm("Are you sure you want to delete this booking?")) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Authentication required");
                return;
            }

            await publicRequest.delete(`/bookings/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBookings(bookings.filter(b => b._id !== bookingId));
        } catch (error) {
            console.error("Error deleting booking:", error);
            setError(error.response?.data?.message || "Failed to delete booking");
        }
    };

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = bookings.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleStatusUpdate = async (bookingId, status) => {
        try {
            const token = localStorage.getItem("token");
            const response = await publicRequest.patch(
                `/bookings/${bookingId}/status`,
                { status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local state or refetch bookings
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleFinePayment = async (bookingId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await publicRequest.patch(
                `/bookings/${bookingId}/status`,
                { isFinePaid: true },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // Update local state or refetch bookings
        } catch (error) {
            console.error("Error updating fine payment:", error);
        }
    };

    const formatDateDDMMYYYY = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}/${month}/${year}`; // or `${day}${month}${year}` if you want no slashes
    };

    // Bookong PDF Download
    const handleDownloadBooking = (bookingId) => {
        const booking = bookings.find(b => b._id === bookingId);
        if (!booking) return;

        // Create a new PDF document
        const doc = new jsPDF();

        // Add logo or header image (optional)
        // You would need to add an image file and use doc.addImage()

        // Add title
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "bold");
        doc.text("PARKING BOOKING RECEIPT", 105, 25, { align: 'center' });

        // Add divider line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, 30, 190, 30);

        // Add booking details section
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "bold");
        doc.text("Booking Details", 20, 45);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Booking ID: ${booking._id}`, 20, 55);
        doc.text(`Slot Number: ${booking.parkingSlot?.slotNumber || "N/A"}`, 20, 65);
        doc.text(`Vehicle Number: ${booking.vehicleNumber}`, 20, 75);


        // Usage in your PDF generation
        doc.text(`From Date: ${formatDateDDMMYYYY(booking.fromDate)}`, 20, 85);
        doc.text(`To Date: ${formatDateDDMMYYYY(booking.toDate)}`, 20, 95);

        // Add another divider
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 100, 190, 100);

        // Add parking slot details if available
        if (booking.parkingSlot) {
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Parking Slot Details", 20, 115);

            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.text(`Parking Lot: ${booking.parkingSlot?.parkingLevel?.parkingLot?.name || "N/A"}`, 20, 125);
            doc.text(`Parking Lot Location: ${booking.parkingSlot?.parkingLevel?.parkingLot?.address || "N/A"}`, 20, 135);
            doc.text(`Level: ${booking.parkingSlot?.parkingLevel?.name || "N/A"}`, 20, 145);
        }

        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Thank you for choosing our parking service!", 105, 180, { align: 'center' });
        doc.text("For any queries, contact: support@parking.com", 105, 185, { align: 'center' });
        doc.text("Generated on: " + new Date().toLocaleDateString(), 105, 190, { align: 'center' });

        // Save the PDF
        doc.save(`Parking_Receipt_${booking._id.slice(0, 8)}.pdf`);
    };

    return (
        <>
            <div className="mt-12 mb-8 flex flex-col gap-12">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="white">Booking Management</Typography>
                    </CardHeader>
                    <CardBody className="overflow-x-scroll pt-0 pb-2">
                        {error && (
                            <Typography color="red" className="mb-4">
                                {error}
                            </Typography>
                        )}
                        {bookings.length === 0 ? (
                            <div className="my-4 flex flex-row max-sm:flex-col w-full gap-8">
                                <Typography variant="h6" color="blue-gray" className="text-center py-8">
                                    No bookings available
                                </Typography>
                            </div>
                        ) : (
                            <div className="my-4 flex flex-row max-sm:flex-col w-full gap-8">
                                <table className="w-full min-w-[640px] table-auto">
                                    <thead>
                                        <tr>
                                            {["Slot Details", "Vehicle", "From", "To", "Status", "Actions"].map((el) => (
                                                <th key={el} className="border-b py-3 px-5 text-left text-blue-gray-400 text-[11px] font-bold uppercase">
                                                    {el}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentItems.map((booking) => (
                                            <tr key={booking._id}>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">{booking.parkingSlot?.parkingLevel?.parkingLot?.name ? (
                                                    <>
                                                        <p>Slot No: {booking.parkingSlot?.slotNumber || "N/A"}</p>
                                                        <p>Level: {booking.parkingSlot.parkingLevel.name}</p>
                                                        <p>Lot: {booking.parkingSlot.parkingLevel.parkingLot.name}</p>
                                                        <p>Address: {booking.parkingSlot?.parkingLevel?.parkingLot?.address}</p>
                                                    </>
                                                ) : "N/A"}</td>
                                                 
                                                <td>{booking.vehicleNumber}</td>
                                                <td>{formatDateDDMMYYYY(booking.fromDate)}</td>
                                                <td>{formatDateDDMMYYYY(booking.toDate)}</td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Chip
                                                        color={
                                                            booking.status === "Completed" ? "green" :
                                                                booking.status === "Overstayed" ? "red" :
                                                                    booking.status === "Active" ? "blue" : "amber"
                                                        }
                                                        value={booking.status}
                                                    />
                                                    {booking.status === "Completed" && booking.review && (
                                                        <div className="mt-2">
                                                            <div className="flex items-center">
                                                                <Rating value={booking.review.rating} readonly ratedColor="amber" />
                                                                <span className="ml-2 text-sm">{booking.review.rating}/5</span>
                                                            </div>
                                                            {booking.review.comment && (
                                                                <Typography className="text-xs mt-1">
                                                                    "{booking.review.comment}"
                                                                </Typography>
                                                            )}
                                                        </div>
                                                    )}
                                                    {booking.status === "Overstayed" && (
                                                        <div className="mt-1">
                                                            <Typography className="text-xs">
                                                                Overstay: {booking.overstayDays} day(s)
                                                            </Typography>
                                                            <Typography className="text-xs font-semibold">
                                                                Fine: $ {booking.fineAmount} (${booking.dailyRate}/day)
                                                            </Typography>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="flex gap-2">
                                                    {(userRole === "admin" || userRole === "moderator") && (
                                                        <div className="flex gap-2">
                                                            {["Active", "Completed", "Overstayed"].includes(booking.status) && (
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(booking._id, "Completed")}
                                                                    disabled={booking.status === "Completed"}
                                                                >
                                                                    Mark Completed
                                                                </Button>
                                                            )}
                                                            {booking.status === "Overstayed" && !booking.isFinePaid && (
                                                                <Button
                                                                    size="sm"
                                                                    color="green"
                                                                    onClick={() => handleFinePayment(booking._id)}
                                                                >
                                                                    Mark Fine Paid
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(userRole === "admin" || userRole === "moderator") && (
                                                        <Button color="blue" onClick={() => handleEditClick(booking)}>
                                                            Edit
                                                        </Button>
                                                    )}
                                                    {userRole === "admin" && (
                                                        <Button color="red" onClick={() => handleDeleteBooking(booking._id)}>
                                                            Delete
                                                        </Button>
                                                    )}
                                                    {booking.status === "Completed" && !booking.review && (
                                                        <Button
                                                            color="amber"
                                                            onClick={() => {
                                                                setSelectedBooking(booking);
                                                                setOpenReviewDialog(true);
                                                            }}
                                                        >
                                                            Rate & Review
                                                        </Button>
                                                    )}
                                                    <Button color="green" onClick={() => handleDownloadBooking(booking._id)}>
                                                        Download
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {bookings.length > itemsPerPage && (
                                        <div className="flex justify-center mt-4">
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    onClick={() => paginate(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                >
                                                    Previous
                                                </Button>

                                                {Array.from({ length: Math.ceil(bookings.length / itemsPerPage) }).map((_, index) => (
                                                    <Button
                                                        key={index}
                                                        variant={currentPage === index + 1 ? "filled" : "outlined"}
                                                        size="sm"
                                                        onClick={() => paginate(index + 1)}
                                                    >
                                                        {index + 1}
                                                    </Button>
                                                ))}

                                                <Button
                                                    variant="outlined"
                                                    size="sm"
                                                    onClick={() => paginate(currentPage + 1)}
                                                    disabled={currentPage === Math.ceil(bookings.length / itemsPerPage)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Add Review Dialog */}
            <Dialog open={openReviewDialog} handler={() => setOpenReviewDialog(false)}>
                <DialogHeader>Rate Your Parking Experience</DialogHeader>
                <DialogBody>
                    <div className="flex flex-col gap-4">
                        <div>
                            <Typography variant="h6" className="mb-2">Rating</Typography>
                            <Rating
                                value={reviewRating}
                                onChange={(value) => setReviewRating(value)}
                                ratedColor="amber"
                            />
                        </div>
                        <div>
                            <Typography variant="h6" className="mb-2">Review (Optional)</Typography>
                            <Textarea
                                label="Your review"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                            />
                        </div>
                        {reviewError && (
                            <Typography color="red" className="mt-2">
                                {reviewError}
                            </Typography>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setOpenReviewDialog(false)}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={() => handleSubmitReview(selectedBooking?._id)}
                    >
                        Submit Review
                    </Button>
                </DialogFooter>
            </Dialog>

            {/* Edit Booking Dialog */}
            <Dialog open={openEditDialog} handler={() => setOpenEditDialog(false)}>
                <DialogHeader>Edit Booking</DialogHeader>
                <DialogBody>
                    <div className="flex flex-col gap-4">
                        <Input
                            label="Vehicle Number"
                            value={vehicleNumber}
                            onChange={(e) => setVehicleNumber(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="From Date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            label="To Date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                        />
                        {editError && (
                            <Typography color="red" className="mt-2">
                                {editError}
                            </Typography>
                        )}
                    </div>
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setOpenEditDialog(false)}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button variant="gradient" color="green" onClick={handleUpdateBooking}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </Dialog>
        </>
    );
};

export default BookingManagement;