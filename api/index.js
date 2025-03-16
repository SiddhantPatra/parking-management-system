import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// ✅ Add Custom CORS Middleware (Fix Preflight Issues)
const allowedOrigins = [
  "https://parkingsystem-gules.vercel.app",
  "http://localhost:5173",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// ✅ Enable JSON parsing
app.use(express.json());

// ✅ Debugging: Log All Incoming Requests
// app.use((req, res, next) => {
//   if (process.env.NODE_ENV !== "production") {
// console.log(`Incoming request: ${req.method} ${req.path}`);
// console.log("Headers:", req.headers);
//   }
//   next();
// });

// ✅ Import Routes
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import parkingRoutes from "./routes/parkingRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

// ✅  Routes
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);

app.get("/", (req, res) => {
  res.send("Hello! From ParkingSystem API");
});

const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
