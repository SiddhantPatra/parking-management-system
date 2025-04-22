import {
  loginStart,
  loginSuccess,
  loginFailure,
  logOut,
  signupStart,
  signupSuccess,
  signupFailure,
} from "@/redux/userRedux";
import { publicRequest } from "../requestMethods";

// User Authentication
export const signup = async (dispatch, user) => {
  dispatch(signupStart());
  try {
    const res = await publicRequest.post("/auth/signup", user);
    dispatch(signupSuccess(res.data));
    return res.data;
  } catch (err) {
    console.error("Signup Error:", err.response?.data || err.message);
    dispatch(signupFailure(err.response?.data || "Signup failed"));
  }
};

export const login = async (dispatch, user) => {
  dispatch(loginStart());
  try {
    const res = await publicRequest.post("/auth/signin", user);
    dispatch(loginSuccess(res.data));
    return { success: true, ...res.data };
  } catch (err) {
    console.error("Login Error:", err.response?.data || err.message);
    dispatch(loginFailure(err.response?.data || "Login failed"));
    return { success: false, message: err.response?.data || "Login failed" };
  }
};

export const logout = async (dispatch) => {
  try {
    const res = await publicRequest.post("/auth/logout"); // eslint-disable-line
    dispatch(logOut());
  } catch (err) {
    console.log(err);
  }
};

// Parking Slots 
export const fetchParkingSlots = async (levelId, status = "Available") => {
  const token = localStorage.getItem("token");

  try {
    const url = `/parking/levels/${levelId}/slots${status ? `?status=${status}` : ""}`;
    const response = await publicRequest.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const slotsData = Array.isArray(response.data?.data) ? response.data.data : [];
    
    if (slotsData.length === 0) return [];

    // Process slots with review counts
    const slotsWithReviews = await Promise.all(
      slotsData.map(async (slot) => {
        try {
          const reviewsRes = await publicRequest.get(
            `/bookings/slots/${slot._id}/reviews`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (reviewsRes.data.success) {
            return {
              ...slot,
              reviewCount: reviewsRes.data.data.reviewCount,
              averageRating: reviewsRes.data.data.averageRating
            };
          }
          return {
            ...slot,
            reviewCount: 0,
            averageRating: 0
          };
        } catch (error) {
          console.error(`Error fetching reviews for slot ${slot._id}:`, error);
          return {
            ...slot,
            reviewCount: 0,
            averageRating: 0
          };
        }
      })
    );

    return slotsWithReviews;
  } catch (error) {
    console.error("Error fetching parking slots:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch parking slots");
  }
};

export const fetchUserBookings = async () => {
  const token = localStorage.getItem("token");
  return publicRequest.get("/bookings/user", { headers: { Authorization: `Bearer ${token}` } });
};

export const createParkingSlot = async (slotData) => {
  const token = localStorage.getItem("token");
  return publicRequest.post("/parking/slots", slotData, { headers: { Authorization: `Bearer ${token}` } });
};

export const updateParkingSlot = async (slotId, updatedSlot) => {
  const token = localStorage.getItem("token");
  return publicRequest.put(`/parking/slots/${slotId}`, updatedSlot, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteParkingSlot = async (slotId) => {
  const token = localStorage.getItem("token");
  return publicRequest.delete(`/parking/slots/${slotId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const bookParkingSlot = async (bookingData) => {
  const token = localStorage.getItem("token");
  return publicRequest.post("/bookings", bookingData, { headers: { Authorization: `Bearer ${token}` } });
};

// Fetch Levels by Parking Lot
export const fetchLevelsByLot = async (lotId) => {
  const token = localStorage.getItem("token");
  return publicRequest.get(`/parking/levels/${lotId}`, { headers: { Authorization: `Bearer ${token}` } });
};

// Fetch All Parking Lots
export const fetchParkingLots = async () => {
  const token = localStorage.getItem("token");
  return publicRequest.get("/parking/lots", { headers: { Authorization: `Bearer ${token}` } });
};

// Add a Parking Level
export const addParkingLevel = async (levelData) => {
  const token = localStorage.getItem("token");
  return publicRequest.post("/parking/levels", levelData, { headers: { Authorization: `Bearer ${token}` } });
};

// Update a Parking Level
export const updateParkingLevel = async (levelId, updatedLevel) => {
  const token = localStorage.getItem("token");
  return publicRequest.put(`/parking/levels/${levelId}`, updatedLevel, { headers: { Authorization: `Bearer ${token}` } });
};

// Delete a Parking Level
export const deleteParkingLevel = async (levelId) => {
  const token = localStorage.getItem("token");
  return publicRequest.delete(`/parking/levels/${levelId}`, { headers: { Authorization: `Bearer ${token}` } });
};

// Add a Parking Lot
export const createParkingLot = async (lotData) => {
  const token = localStorage.getItem("token");
  return publicRequest.post("/parking/lots", lotData, { headers: { Authorization: `Bearer ${token}` } });
};

// Update a Parking Lot
export const updateParkingLot = async (lotId, updatedLot) => {
  const token = localStorage.getItem("token");
  return publicRequest.put(`/parking/lots/${lotId}`, updatedLot, { headers: { Authorization: `Bearer ${token}` } });
};

// Delete a Parking Lot
export const deleteParkingLot = async (lotId) => {
  const token = localStorage.getItem("token");
  return publicRequest.delete(`/parking/lots/${lotId}`, { headers: { Authorization: `Bearer ${token}` } });
};

export const bookSlot = async (slotId, fromDate, toDate) => {
  try {
    const response = await publicRequest.post("/api/bookSlot", { slotId, fromDate, toDate });
    return response.data;
  } catch (error) {
    console.error("Error booking slot:", error);
    throw error;
  }
};
export const handleBookSlot = async (slotId, fromDate, toDate) => {
  try {
    const response = await publicRequest.post("/api/bookSlot", { slotId, fromDate, toDate });
    // Update the slots state or refetch slots
    console.log("Booking successful:", response.data);
  } catch (error) {
    console.error("Error booking slot:", error);
  }
};

// Update Booking
export const updateBooking = async (bookingId, updatedData) => {
  const token = localStorage.getItem("token");
  return publicRequest.put(`/bookings/${bookingId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// Delete Booking
export const deleteBooking = async (bookingId) => {
  const token = localStorage.getItem("token");
  return publicRequest.delete(`/bookings/${bookingId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};


// Review
export const submitReview = async (bookingId, reviewData) => {
  const token = localStorage.getItem("token");
  return publicRequest.post(`/bookings/${bookingId}/review`, reviewData, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

