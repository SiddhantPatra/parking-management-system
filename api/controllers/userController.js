import User from "../models/UserModel.js";

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

// UPDATE User
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, contact, vehicle, avatar } = req.body;

    const updateFields = {
      firstName,
      lastName,
      contact,
      vehicle
    };

    // Only update avatar if it's provided
    if (avatar) {
      updateFields.avatar = avatar;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }

    res.status(200).json(updatedUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
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