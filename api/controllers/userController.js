import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
// Get User
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
}

// Get all User
export const getAllUser = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default page 1
    const limit = parseInt(req.query.limit) || 10; // Default limit 10
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .exec();

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      users,
      totalPages,
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }

}
// Avatar upload controller
export const uploadUserAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const avatarPath = `/avatars/${req.file.filename}`;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { avatar: avatarPath } },
      { new: true }
    );

    res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatar: updatedUser.avatar
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading avatar' });
  }
};

// Password change controller
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    console.log(`Password change request for user: ${userId}`);
    console.log(`Payload received:`, req.body);

    // 1. Find the user
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ message: 'User not found' });
    }

    // 2. Verify current password
    console.log('Verifying current password...');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      console.log('Current password mismatch');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // 3. Hash the new password
    console.log('Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // 4. Save the user
    console.log('Saving user with new password...');
    await user.save();
    
    console.log('Password updated successfully');
    res.status(200).json({ message: 'Password updated successfully' });
    
  } catch (err) {
    console.error('Error in changePassword:', err);
    res.status(500).json({ 
      message: 'Error changing password',
      error: err.message,
      stack: err.stack
    });
  }
};
// UPDATE User
export const updateUser = async (req, res) => {
  try {
    console.log("INCOMING DATA:", req.body); // Debug log
    
    const updateData = {
      avatar: req.body.avatar, // Explicitly include avatar
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      contact: req.body.contact,
      vehicle: req.body.vehicle,
      email: req.body.email,
    };

    console.log("UPDATE DATA TO SAVE:", updateData); // Debug log

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log("UPDATED USER FROM DB:", updatedUser); // Debug log
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("UPDATE ERROR:", err); // Debug log
    res.status(500).json({ 
      message: "Error updating user",
      error: err.message 
    });
  }
};
// update user Role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Prevent admins from changing their own role
    if (req.user._id === id && req.user.role === 'admin') {
      return res.status(403).json({ error: "Admins cannot change their own role." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true } // Return the updated user
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// Delete User
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json("User has been deleted...");
  } catch (err) {
    res.status(500).json(err);
  }
}