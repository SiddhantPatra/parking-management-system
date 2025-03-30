import jwt from "jsonwebtoken";
import User from "../models/UserModel.js"; // Import the User model


// Verify JWT token
export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from headers
  if (!token) {
    return res.status(401).json({ error: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Attach the decoded user data to req.user
    req.user = decoded; 
    next();
  });
};
// Verify token and authorization
export const verifyTokenAndAuthorization = async (req, res, next) => {
  verifyToken(req, res, async () => { 
    const { id } = req.params; // ID of the user being updated
    const { id: _id, role } = req.user; // ID and role of the logged-in user 
    
    // Allow the user to update their own account
    if (_id === id) {
      return next();
    }

    // Allow admins to update any account
    if (role === 'admin') {
      return next();
    }

    // Allow moderators to update regular user accounts
    if (role === 'moderator') {
      const userToUpdate = await User.findById(id);
      if (userToUpdate && userToUpdate.role === 'user') {
        return next();
      }
    }

    // Deny access for all other cases
    return res.status(403).json({ error: "You are not authorized to perform this action." });
  });
};

// Verify token and admin role
export const verifyTokenAndAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ error: "Only admins are allowed to perform this action." });
    }
  });
};

// Verify token and moderator role
export const verifyTokenAndModerator = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'moderator') {
      next();
    } else {
      return res.status(403).json({ error: "Only moderators are allowed to perform this action." });
    }
  });
};

// Verify token and admin or moderator role
export const verifyTokenAndAdminOrModerator = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === 'admin' || req.user.role === 'moderator') {
      next();
    } else {
      return res.status(403).json({ error: "Only admins or moderators are allowed to perform this action." });
    }
  });
};