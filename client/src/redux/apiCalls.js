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
export const signup = async (dispatch, user) => {
  dispatch(signupStart());
  try {
    const res = await publicRequest.post("/auth/signup", user);
    // console.log("API Response:", res.data); // ✅ Log API response 
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
    // console.log("API Response:", res.data); // ✅ Log API response
    dispatch(loginSuccess(res.data));
    return { success: true, ...res.data }; // Ensure consistent response
  } catch (err) {
    console.error("Login Error:", err.response?.data || err.message);
    dispatch(loginFailure(err.response?.data || "Login failed"));
    return { success: false, message: err.response?.data || "Login failed" }; // Consistent error response
  }
};
// export const login = async (dispatch, user) => {
//   dispatch(loginStart());
//   try {
//     const res = await publicRequest.post("/auth/signin", user);
//     console.log("API Response:", res.data); // ✅ Log API response 
//     dispatch(loginSuccess(res.data));
//     return res.data;
//   } catch (err) {
//     console.error("Login Error:", err.response?.data || err.message);
//     dispatch(loginFailure(err.response?.data || "Login failed"));
//   }
// };

export const logout = async (dispatch) => {
  try {
    const res = await publicRequest.post("/auth/logout"); // eslint-disable-line
    dispatch(logOut()); // Use `logout` action
  } catch (err) {
    console.log(err);
  }
};
