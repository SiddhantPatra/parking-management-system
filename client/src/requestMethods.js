import axios from "axios";

const BASE_URL = "http://localhost:5001/api"; 

const TOKEN = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("persist:root"))?.user;
const currentUser = user && JSON.parse(user)?.currentUser;
 

 
export const publicRequest = axios.create({
  baseURL: BASE_URL, withCredentials: true
});

export const userRequest = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${TOKEN}` },
  withCredentials: true,
});
