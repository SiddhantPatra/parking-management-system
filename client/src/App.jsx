import { Routes, Route, Navigate } from "react-router-dom";
import { Dashboard, Auth } from "@/layouts";
import { useSelector } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const user = useSelector((state) => state.user.currentUser);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <Routes>
        {user ? (
          <>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/dashboard/home" replace />} />
          </>
        ) : (
          <>
            <Route path="/auth/*" element={<Auth />} />
            <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
          </>
        )}
      </Routes>
    </>
  );
}

export default App;
