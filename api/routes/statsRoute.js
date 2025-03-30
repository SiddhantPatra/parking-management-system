import express from "express";
import { getDashboardStats, getMonthlyRevenue } from "../controllers/statsController.js";

const router = express.Router();

// Get all dashboard statistics
router.get("/dashboard", getDashboardStats);

// Get monthly revenue (optional separate endpoint)
router.get("/monthly-revenue", getMonthlyRevenue);

export default router;