// cronJobs.js
import cron from 'node-cron';
import Booking from './models/BookingModel.js';

// This will use your existing Mongoose connection
const checkOverstays = async () => {
  console.log('🔵 Running overstay check at', new Date().toLocaleString());
  
  try {
    const activeBookings = await Booking.find({
      status: "Active",
      toDate: { $lt: new Date() }
    }).populate('parkingSlot');

    for (const booking of activeBookings) {
      const overstayDays = Math.ceil((Date.now() - booking.toDate) / (86400000)); // 86400000 ms per day
      const fineAmount = overstayDays * (booking.dailyRate || 10); // Default $10 if no rate

      await Booking.findByIdAndUpdate(booking._id, {
        status: "Overstayed",
        overstayDays,
        fineAmount,
        lastChecked: new Date()
      });

      console.log(`⚠️ Booking ${booking._id} marked as overstayed (${overstayDays} days)`);
    }
  } catch (error) {
    console.error('❌ Overstay check error:', error);
  }
};

// Schedule to run every hour for testing (change to '0 0 * * *' for daily in production)
cron.schedule('0 * * * *', checkOverstays, {
  scheduled: true,
  timezone: "UTC"
});

// Manual trigger for testing
export const manualTrigger = async () => {
  console.log('🟢 Manually triggering overstay check');
  await checkOverstays();
};