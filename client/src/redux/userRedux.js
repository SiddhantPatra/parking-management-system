import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    currentUser: null,
    isFetching: false,
    error: false,
  },
  reducers: {
    loginStart: (state) => {
      state.isFetching = true;
      state.error = null; // Reset errors on new attempt
    },
    loginSuccess: (state, action) => {
      state.isFetching = false;
      state.currentUser = action.payload.user; // Ensure user is stored properly
      localStorage.setItem("token", action.payload.token); // Store token
    },
    loginFailure: (state, action) => {
      state.isFetching = false;
      state.error = action.payload;
    },
    logOut: (state) => {
      state.currentUser = null;
      localStorage.removeItem("token");
    },
    signupStart: (state) => {
      state.isFetching = true;
    },
    signupSuccess: (state, action) => {
      state.isFetching = false;
      state.currentUser = action.payload;
    },
    signupFailure: (state) => {
      state.isFetching = false;
      state.error = true;
    },
    updateUser: (state, action) => {
      if (state.currentUser) {
        // Merge the updated fields into the current user object
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
  },
});

// Corrected export: Use `logout` instead of `logOut`
export const { loginStart, loginSuccess, loginFailure, logOut, signupStart, signupSuccess, signupFailure ,updateUser} = userSlice.actions;

export default userSlice.reducer;