import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  firstName: { type: String, required: true },
  lastName: { type: String },
  phone: { type: Number },
  // profilePicture: { type: String },
  role: {
    type: String,
    enum: ["user", "moderator", "admin"],
    default: "user",
  },
  contact: { type: String, },
  verified: { type: String, default: "false" },
  vehicle: { type: String, },
  avatar: {
    type: String,
    default: "/avatars/red.jpg",
    // Remove any custom validation that might be blocking updates
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});


const User = mongoose.model("User", UserSchema);
// const User = mongoose.model("User", UserSchema);
export default User;
