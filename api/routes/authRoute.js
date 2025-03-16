import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/UserModel.js";

const router = express.Router();

// Cookie options for authentication
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 3600000 * 24 // 24 hours
};

///////////////////// LOG IN //////////////////////
/**
 * @route   POST /signin
 * @desc    Authenticate user & return token
 * @access  Public
 */ 
router.post(
  `/signin`,
  [
    body("email", "Enter a valid email!").isEmail(),
    body("password", "Password can't be blank").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ message: "User doesn't exist!" });
      }

      // Validate password
      const isPasswordOk = await bcrypt.compare(password, existingUser.password);
      if (!isPasswordOk) {
        return res.status(400).json({ message: "Invalid credentials!" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: existingUser._id, email: existingUser.email, role: existingUser.role },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      // Set authentication cookies
      res.cookie("token", token, COOKIE_OPTIONS);
      res.cookie("user", JSON.stringify(existingUser), COOKIE_OPTIONS);
      return res.status(200).json({ user: existingUser, token });
    } catch (err) {
      console.error("Signin Error:", err);
      return res.status(500).json({ message: "Something went wrong!" });
    }
  }
);

///////////////////// REGISTER //////////////////////
/**
 * @route   POST /signup
 * @desc    Register a new user
 * @access  Public
 */
router.post(`/signup`, async (req, res) => {
  const { firstName, lastName, contact, vehicle, email, password, confirmPassword } = req.body;

  // Validate input fields
  if (!firstName || !lastName || !contact || !vehicle || !email || !password || password !== confirmPassword || password.length < 4) {
    return res.status(400).json({ message: "Invalid field!" });
  }

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      vehicle,
      contact
    });
    // Generate JWT token for the new user
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Automatically log in the user by setting authentication cookies
    res.cookie("token", token, COOKIE_OPTIONS);
    res.cookie("user", JSON.stringify(newUser), COOKIE_OPTIONS);

    // Send success response
    res.status(200).json({ success: true, user: newUser, token, message: "Successfully Registered and Logged In!" });
  } catch (err) {
    res.status(500).json({ message: "Something went wrong!" });
  }
});

////////////////////////LOG OUT////////////////////////////////
/**
 * @route   POST /logout
 * @desc    Logout user and clear cookies
 * @access  Private
 */
router.post("/logout", (req, res) => {
  try {
    // Clear cookies with secure options
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Ensure secure in production
      sameSite: "strict",
    });
    res.clearCookie("user", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    //  Destroy session if applicable
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ status: "error", message: "Logout failed" });
        }
      });
    }

    // Send logout success response
    res.status(200).json({ status: "success", message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});
export default router;
