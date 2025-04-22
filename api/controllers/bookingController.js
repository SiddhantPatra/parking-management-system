import mongoose from "mongoose";

import Booking from "../models/BookingModel.js";
import Parking from "../models/ParkingModel.js";
import User from "../models/UserModel.js";
// Create a new booking
export const createBooking = async (req, res) => {
    try {
        const { parkingSlot, vehicleNumber, fromDate, toDate } = req.body;
        const userId = req.user.id;

        const parking = await Parking.findById(parkingSlot);
        if (!parking) {
            return res.status(404).json({ message: "Parking slot not found" });
        }

        const booking = new Booking({
            parkingSlot,
            bookedBy: userId,
            vehicleNumber,
            fromDate,
            toDate,
            dailyRate: parking.fineAmount, // Store the daily rate
            status: "Confirmed"
        });

        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking", error });
    }
};

// Get all bookings for a user
// export const getUserBookings = async (req, res) => {
//     try {
//         console.log('Incoming request headers:', req.headers);
//         console.log('Request user:', req.user);

//         const userId = req.params.userId || req.user.id;
//         console.log('Using userId:', userId);

//         if (!mongoose.Types.ObjectId.isValid(userId)) {
//             console.log('Invalid user ID format');
//             return res.status(400).json({ message: 'Invalid user ID format' });
//         }

//         const bookings = await Booking.find({ bookedBy: userId })
//             .populate({
//                 path: 'parkingSlot',
//                 select: 'slotNumber status price',
//                 populate: {
//                     path: 'parkingLevel',
//                     select: 'name',
//                     populate: {
//                         path: 'parkingLot',
//                         select: 'name address'
//                     }
//                 }
//             })
//             .populate("bookedBy", "firstName email")
//             .lean();

//         console.log('Successfully fetched bookings:', bookings.length);
//         return res.status(200).json(bookings);

//     } catch (error) {
//         console.error('Full error stack:', error.stack);
//         console.error('Error details:', {
//             name: error.name,
//             message: error.message,
//             code: error.code,
//             keyPattern: error.keyPattern,
//             keyValue: error.keyValue
//         });

//         return res.status(500).json({
//             message: 'Failed to fetch bookings',
//             error: process.env.NODE_ENV === 'development' ? {
//                 name: error.name,
//                 message: error.message,
//                 stack: error.stack
//             } : null
//         });
//     }
// };
export const getUserBookings = async (req, res) => {
    try {


        const userId = req.params.userId || req.user.id;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User not found' });
        }

        const bookings = await Booking.find({ bookedBy: userId })
            .populate({
                path: 'parkingSlot',
                select: 'slotNumber status price',
                populate: {
                    path: 'parkingLevel',
                    select: 'name',
                    populate: {
                        path: 'parkingLot',
                        select: 'name address'
                    }
                }
            })
            .populate("bookedBy", "firstName email")
            .lean();

        return res.status(200).json(bookings);

    } catch (error) {
        console.error('Full error stack:', error.stack);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            keyPattern: error.keyPattern,
            keyValue: error.keyValue
        });

        return res.status(500).json({
            message: 'Failed to fetch bookings',
            error: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : null
        });
    }
};
// Get all bookings (for admin/moderator)
export const getAllBookings = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from token
        const userRole = req.user.role; // Get user role

        let query = {};
        if (userRole !== "admin" && userRole !== "moderator") {
            query = { bookedBy: userId }; // Restrict to only user's bookings
        }

        const bookings = await Booking.find(query)
            .populate({
                path: "parkingSlot",
                select: "slotNumber parkingLevel",
                populate: {
                    path: "parkingLevel",
                    select: "name parkingLot ",
                    populate: {
                        path: "parkingLot",
                        select: "name address ",
                    },
                },
            })
            .populate("bookedBy", "firstName email");

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error });
    }
};

export const updateBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userRole = req.user.role; // Get user role

        if (userRole !== "admin" && userRole !== "moderator") {
            return res.status(403).json({ message: "Unauthorized: Only admins and moderators can edit bookings" });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            req.body, // Allow updates based on request body
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: "Error updating booking", error });
    }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status, exitTime, isFinePaid } = req.body;

        const updateData = { status };

        if (exitTime) {
            updateData.actualExitTime = exitTime;

            // Calculate overstay days if applicable
            const booking = await Booking.findById(bookingId).populate('parkingSlot');
            if (new Date(exitTime) > booking.toDate) {
                const timeDiff = new Date(exitTime) - booking.toDate;
                const daysOverstay = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                updateData.overstayDays = daysOverstay;
                updateData.fineAmount = daysOverstay * booking.dailyRate;
                updateData.status = "Overstayed";
            }
        }

        if (isFinePaid !== undefined) {
            updateData.isFinePaid = isFinePaid;
            if (isFinePaid) {
                updateData.status = "Completed";
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            updateData,
            { new: true }
        ).populate({
            path: 'parkingSlot',
            populate: {
                path: 'parkingLevel',
                populate: {
                    path: 'parkingLot'
                }
            }
        });

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: "Error updating booking status", error });
    }
};

// Delete a booking
export const deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userRole = req.user.role; // Get user role

        if (userRole !== "admin") {
            return res.status(403).json({ message: "Unauthorized: Only admins can delete bookings" });
        }

        const booking = await Booking.findByIdAndDelete(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Update parking slot status to "Available"
        const parkingSlot = await Parking.findById(booking.parkingSlot);
        if (parkingSlot) {
            parkingSlot.status = "Available";
            await parkingSlot.save();
        }

        res.status(200).json({ message: "Booking deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting booking", error });
    }
};

export const checkOverstayBookings = async () => {
    try {
        const activeBookings = await Booking.find({
            status: "Active",
            toDate: { $lt: new Date() }
        }).populate('parkingSlot');

        for (const booking of activeBookings) {
            const endDate = new Date(booking.toDate);
            const currentDate = new Date();

            // Calculate full days overstay (rounded up)
            const timeDiff = currentDate - endDate;
            const daysOverstay = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            // Calculate fine (daily rate * overstay days)
            const fineAmount = daysOverstay * booking.dailyRate;

            await Booking.findByIdAndUpdate(booking._id, {
                status: "Overstayed",
                overstayDays: daysOverstay,
                fineAmount,
                // Keep the original daily rate for reference
            });
        }
    } catch (error) {
        console.error("Error checking overstay bookings:", error);
    }
};

// Submit review for booking
export const submitReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const bookingId = req.params.id;

        // Validate rating input
        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid rating between 1 and 5'
            });
        }

        // Find the booking with minimal data first
        const booking = await Booking.findById(bookingId).lean();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Debug: Log the actual booking data from DB
        console.log('Raw booking data from DB:', JSON.stringify(booking, null, 2));

        // Check for review existence more thoroughly
        const hasReview = booking.review &&
            (booking.review.rating || booking.review.comment || booking.review.reviewedAt);

        if (hasReview) {
            return res.status(400).json({
                success: false,
                message: 'This booking already has a review',
                debug: {
                    actualReviewField: booking.review,
                    isObjectEmpty: Object.keys(booking.review || {}).length === 0
                }
            });
        }

        // Verify booking ownership
        if (booking.bookedBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized - You can only review your own bookings'
            });
        }

        // Check booking status
        if (booking.status !== 'Completed') {
            return res.status(400).json({
                success: false,
                message: 'Only completed bookings can be reviewed'
            });
        }

        // Now get the full booking document to update
        const bookingToUpdate = await Booking.findById(bookingId)
            .populate('parkingSlot', 'slotNumber parkingLevel');

        // Create and save review
        bookingToUpdate.review = {
            rating,
            comment: comment || '',
            reviewedAt: new Date(),
            parkingSlot: {
                _id: bookingToUpdate.parkingSlot._id,
                slotNumber: bookingToUpdate.parkingSlot.slotNumber,
                level: bookingToUpdate.parkingSlot.parkingLevel
            }
        };

        await bookingToUpdate.save();

        return res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: {
                bookingId: bookingToUpdate._id,
                review: {
                    rating: bookingToUpdate.review.rating,
                    comment: bookingToUpdate.review.comment
                }
            }
        });

    } catch (error) {
        console.error('Review submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit review',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};



export const getReviewsByParkingSlot = async (req, res) => {
    try {
        const { slotId } = req.params;

        // Verify the slot exists
        const slotExists = await Parking.findById(slotId);
        if (!slotExists) {
            return res.status(404).json({
                success: false,
                message: 'Parking slot not found'
            });
        }

        // Find all completed bookings for this parking slot with reviews
        const bookings = await Booking.find({
            'parkingSlot': slotId,
            'status': 'Completed',
            'review': { $exists: true, $ne: null }
        })
            .populate('bookedBy', 'firstName email')  // Changed from 'user' to 'bookedBy'
            .select('review vehicleNumber fromDate bookedBy');  // Changed from 'user' to 'bookedBy'

        // Calculate average rating
        let totalRating = 0;
        const reviews = bookings.map(booking => {
            totalRating += booking.review.rating;
            return {
                user: booking.bookedBy,  // Changed from user to bookedBy
                rating: booking.review.rating,
                comment: booking.review.comment,
                reviewedAt: booking.review.reviewedAt,
                vehicleNumber: booking.vehicleNumber,
                bookingDate: booking.fromDate
            };
        });

        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

        res.json({
            success: true,
            data: {
                reviews,
                averageRating,
                reviewCount: reviews.length
            }
        });
    } catch (error) {
        console.error('Error fetching slot reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch slot reviews',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};