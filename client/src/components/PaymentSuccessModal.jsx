import {
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Button,
    Typography
} from "@material-tailwind/react";
import { jsPDF } from "jspdf";

const PaymentSuccessModal = ({ open, onClose, bookingDetails }) => {
    const handleDownloadBooking = () => {
        if (!bookingDetails) return;
        console.log("bookingDetails : " + bookingDetails)
        // Create a new PDF document
        const doc = new jsPDF();

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
        doc.text(`Booking ID: ${bookingDetails._id || 'N/A'}`, 20, 55);
        doc.text(`Slot Number: ${bookingDetails.slotNumber || "N/A"}`, 20, 65);
        doc.text(`Vehicle Number: ${bookingDetails.vehicleNumber || 'N/A'}`, 20, 75);
        doc.text(`From Date: ${new Date(bookingDetails.fromDate).toLocaleDateString() || 'N/A'}`, 20, 85);
        doc.text(`To Date: ${new Date(bookingDetails.toDate).toLocaleDateString() || 'N/A'}`, 20, 95);

        // Add another divider
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 100, 190, 100);

        // Add payment details
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Payment Details", 20, 115);

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text(`Duration: ${bookingDetails.totalDays || 0} day(s)`, 20, 125);
        doc.text(`Daily Rate: $${bookingDetails.dailyRate?.toFixed(2) || '0.00'}`, 20, 135);
        doc.text(`Total Amount: $${bookingDetails.totalAmount?.toFixed(2) || '0.00'}`, 20, 145);

        // Add footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Thank you for choosing our parking service!", 105, 180, { align: 'center' });
        doc.text("For any queries, contact: support@parking.com", 105, 185, { align: 'center' });
        doc.text("Generated on: " + new Date().toLocaleDateString(), 105, 190, { align: 'center' });

        // Save the PDF
        doc.save(`Parking_Receipt_${bookingDetails._id?.slice(0, 8) || 'receipt'}.pdf`);
    };

    return (
        <Dialog open={open} handler={onClose} size="md">
            <DialogHeader className="flex justify-between items-center">
                <div>
                    <Typography variant="h5" color="blue-gray">
                        Booking Confirmed!
                    </Typography>
                    <Typography color="green" className="mt-1">
                        Payment Successful
                    </Typography>
                </div>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-8 w-8 text-green-500"
                >
                    <path
                        fillRule="evenodd"
                        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                    />
                </svg>
            </DialogHeader>

            <DialogBody divider>
                <div className="space-y-4">
                    <div className="flex justify-between">
                        <Typography variant="paragraph">Booking ID:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?._id || 'N/A'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">Slot Number:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?.slotNumber || 'N/A'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">Vehicle Number:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?.vehicleNumber || 'N/A'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">From:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?.fromDate ? new Date(bookingDetails.fromDate).toLocaleString() : 'N/A'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">To:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?.toDate ? new Date(bookingDetails.toDate).toLocaleString() : 'N/A'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">Duration:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            {bookingDetails?.totalDays || 0} day(s)
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">Daily Rate:</Typography>
                        <Typography variant="paragraph" className="font-semibold">
                            ${bookingDetails?.dailyRate?.toFixed(2) || '0.00'}
                        </Typography>
                    </div>

                    <div className="flex justify-between border-t-2 pt-2">
                        <Typography variant="lead">Total Amount:</Typography>
                        <Typography variant="lead" className="font-bold text-green-600">
                            ${bookingDetails?.totalAmount?.toFixed(2) || '0.00'}
                        </Typography>
                    </div>

                    <div className="flex justify-between">
                        <Typography variant="paragraph">Status:</Typography>
                        <Typography variant="paragraph" className="font-semibold capitalize">
                            {bookingDetails?.status?.toLowerCase() || 'N/A'}
                        </Typography>
                    </div>
                </div>
            </DialogBody>

            <DialogFooter className="space-x-2">
                <Button variant="text" color="gray" onClick={onClose}>
                    Close
                </Button>
                <Button color="green" onClick={handleDownloadBooking}>
                    Download Receipt
                </Button>
            </DialogFooter>
        </Dialog>
    );
}

export default PaymentSuccessModal;