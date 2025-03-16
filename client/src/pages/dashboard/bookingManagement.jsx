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
import { publicRequest } from "@/requestMethods";

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [userRole, setUserRole] = useState("");
    const [userId, setUserId] = useState("");

    // Fetch user role and ID from localStorage
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

            const currentUserId = user.currentUser._id;
            const currentUserRole = user.currentUser.role;

            setUserId(currentUserId);
            setUserRole(currentUserRole || "guest");
        } catch (error) {
            console.error("Error parsing user data from localStorage:", error);
            setUserRole("guest");
        }
    }, []);

    // Fetch bookings based on user role
    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No token found. Please log in.");
                    return;
                }

                let url = `/bookings/user/${userId}`; // Fetch bookings for the logged-in user
                if (userRole === "admin" || userRole === "moderator") {
                    url = "/bookings"; // Admins/moderators can fetch all bookings
                }

                const response = await publicRequest.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                // Ensure the response data is an array
                if (Array.isArray(response.data)) {
                    setBookings(response.data);
                } else {
                    console.error("Invalid bookings data:", response.data);
                    setBookings([]); // Set bookings to an empty array if the data is invalid
                }
            } catch (error) {
                console.error("Error fetching bookings:", error);
                setError("An error occurred while fetching bookings.");
                setBookings([]); // Set bookings to an empty array in case of an error
            }
        };

        fetchBookings();
    }, [userId, userRole]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = bookings.slice(indexOfFirstItem, indexOfLastItem);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <div className="mt-12 mb-8 flex flex-col gap-12">
                <Card>
                    <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
                        <Typography variant="h6" color="white">
                            Booking Management
                        </Typography>
                    </CardHeader>
                    <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                        {!bookings || bookings.length === 0 ? (
                            <Typography variant="h6" color="blue-gray" className="text-center py-8">
                                No bookings available
                            </Typography>
                        ) : (
                            <>
                                <table className="w-full min-w-[640px] table-auto">
                                    <thead>
                                        <tr>
                                            {["Slot Number", "Location", "Vehicle Number", "From Date", "To Date", "Booked By"].map((el) => (
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
                                        {bookings.map((booking) => (
                                            <tr key={booking._id}>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {booking.parkingSlot?.slotNumber || "N/A"}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {booking.parkingSlot?.location || "N/A"}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {booking.vehicleNumber || "N/A"}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {new Date(booking.fromDate).toLocaleDateString()}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {new Date(booking.toDate).toLocaleDateString()}
                                                    </Typography>
                                                </td>
                                                <td className="py-3 px-5 border-b border-blue-gray-50">
                                                    <Typography className="text-xs font-semibold text-blue-gray-600">
                                                        {booking.bookedBy?.firstName  || "N/A"}
                                                    </Typography>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Pagination Controls */}
                                <div className="flex justify-center mt-4">
                                    {Array.from({ length: Math.ceil(bookings.length / itemsPerPage) }, (_, i) => (
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

            {/* Display error messages */}
            {error && (
                <Typography color="red" className="text-center mt-4">
                    {error}
                </Typography>
            )}
        </>
    );
};

export default BookingManagement;