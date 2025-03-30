import { useSelector } from "react-redux";
import {
  HomeIcon,
  UserCircleIcon,
  TableCellsIcon,
  InformationCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/solid";
import { Home, Profile, Tables, Notifications, UserSection } from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";
import ParkingManagement from "./pages/dashboard/parkingManagement";
import BookingManagement from "./pages/dashboard/bookingManagement";

const icon = {
  className: "w-5 h-5 text-inherit",
};

// Define all routes with role-based access
const allRoutes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
        roles: ["admin", "moderator", "user"],  
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
        roles: ["admin", "moderator", "user"],
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Parking Management",
        path: "/parkingmanagement",
        element: <ParkingManagement />,
        roles: ["admin", "moderator", "user"],
      },
      {
        icon: <TableCellsIcon {...icon} />,
        name: "Booking Management",
        path: "/bookingmanagement",
        element: <BookingManagement />,
        roles: ["admin", "moderator", "user"],
      }, 
      {
        icon: <TableCellsIcon {...icon} />,
        name: "User Management",
        path: "/users",
        element: <UserSection />,
        roles: ["admin", "moderator",],  
      }, 
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
    ],
  },
];

// Function to get filtered routes
const useRoutes = () => {
  const user = useSelector((state) => state.user.currentUser);
  const userRole = user?.role || "guest"; // Default to "guest" if no user

  return allRoutes.map((route) => ({
    ...route,
    pages: route.pages.filter((page) => !page.roles || page.roles.includes(userRole)),
  }));
};


export default useRoutes;