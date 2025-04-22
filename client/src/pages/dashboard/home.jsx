import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
  Avatar,
  Tooltip,
  Progress,
  Pagination,
  Button
} from "@material-tailwind/react";
import {
  EllipsisVerticalIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";
import { StatisticsCard } from "@/widgets/cards";
import { StatisticsChart } from "@/widgets/charts";
import {
  CheckCircleIcon,
  ClockIcon,
  BanknotesIcon,
  UserPlusIcon,
  UsersIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/solid";
import { publicRequest } from "@/requestMethods";
import { projectsTableData } from "@/data";
import { exportToCSV, exportToPDF } from "@/configs/exportUtils";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


export function Home() {
  const [totalLots, setTotalLots] = useState(0);
  const [totalLevels, setTotalLevels] = useState(0);
  const [totalSlots, setTotalSlots] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [activeBookings, setActiveBookings] = useState(0);
  const [revenueThisMonth, setRevenueThisMonth] = useState(0);
  const [loading, setLoading] = useState(true);

  // fetch upcoming booking
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [userId, setUserId] = useState("");

  const [pastBookings, setPastBookings] = useState([]);
  const [overstayedBookings, setOverstayedBookings] = useState([]);
  const [error, setError] = useState(null);

  // states for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5); // Adjust as needed
  const [activeTab, setActiveTab] = useState("upcoming");

  // Get current bookings based on active tab
  const getCurrentBookings = () => {
    switch (activeTab) {
      case "past":
        return pastBookings;
      case "overstayed":
        return overstayedBookings;
      default:
        return upcomingBookings.filter(a =>
          a.status !== "Completed" && new Date(a.fromDate) >= new Date().setHours(0, 0, 0, 0)
        );
    }
  };

  // Get current items for pagination
  const currentBookings = getCurrentBookings();
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentItems = currentBookings.slice(indexOfFirstItem, indexOfLastItem);
  // const totalPages = Math.ceil(currentBookings.length / itemsPerPage);
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = currentBookings.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);



  // Handle export
  const handleExport = (type) => {
    const fileName = `${activeTab}_bookings`;
    if (type === "csv") {
      exportToCSV(currentBookings, fileName);
    } else {
      exportToPDF(currentBookings, fileName, activeTab);
    }
  };

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    try {
      const persistedState = JSON.parse(localStorage.getItem("persist:root"));
      if (!persistedState || !persistedState.user) return;

      const user = JSON.parse(persistedState.user);
      if (!user || !user.currentUser) return;

      setUserId(user.currentUser._id);
      setUserRole(user.currentUser.role || "guest");
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUserRole("guest");
    }
  }, []);

  // Fetch bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        let url = `/bookings/user/${userId}`;
        if (userRole === "admin" || userRole === "moderator") url = "/bookings";

        const response = await publicRequest.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const allBookings = Array.isArray(response.data) ? response.data : [];
        setUpcomingBookings(allBookings);

        // Pre-compute filtered bookings
        const now = new Date().setHours(0, 0, 0, 0);

        setPastBookings(
          allBookings
            .filter(a => a.status === "Completed" || new Date(a.fromDate) < now)
            .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate))
        );

        setOverstayedBookings(
          allBookings
            .filter(a => a.fineAmount > 0 && new Date(a.toDate) < now)
            .sort((a, b) => new Date(a.toDate) - new Date(b.toDate))
        );

      } catch (error) {
        setError("Failed to load bookings. Please try again later.");
        console.error("Booking fetch error:", error);
      }
    };

    if (userId) fetchBookings();
  }, [userId, userRole]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await publicRequest.get('/stats/dashboard');

        setTotalLots(response.data.totalLots || 0);
        setTotalLevels(response.data.totalLevels || 0);
        setTotalSlots(response.data.totalSlots || 0);
        setTotalBookings(response.data.totalBookings || 0);
        setActiveBookings(response.data.activeBookings || 0);
        setRevenueThisMonth(response.data.monthlyRevenue || 0);

      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatDateDDMMYYYY = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parkingStatsCardsData = [
    {
      color: "blue",
      icon: BanknotesIcon,
      title: "Total Parking Lots",
      value: loading ? "Loading..." : totalLots,
      footer: {
        color: "text-green-500",
        value: "",
        label: "parking lots"
      }
    },
    {
      color: "orange",
      icon: ChartBarIcon,
      title: "Total Floors",
      value: loading ? "Loading..." : totalLevels,
      footer: {
        color: "text-blue-500",
        value: "",
        label: "floors across all lots"
      }
    },
    {
      color: "green",
      icon: UsersIcon,
      title: "Total Slots",
      value: loading ? "Loading..." : totalSlots,
      footer: {
        color: "text-amber-500",
        value: "",
        label: "parking slots available"
      }
    },
    {
      color: "purple",
      icon: UserPlusIcon,
      title: "Active Bookings",
      value: loading ? "Loading..." : activeBookings,
      footer: {
        color: "text-purple-500",
        value: "",
        label: "slots currently in use"
      }
    },
    {
      color: "red",
      icon: BanknotesIcon,
      title: "Monthly Revenue",
      value: loading ? "Loading..." : `$ ${revenueThisMonth.toFixed(2)}`,
      footer: {
        color: "text-blue-500",
        value: "",
        label: "earned this month"
      }
    }
  ];

  const renderBookingsTable = (bookings, emptyMessage) => {
    if (error) return <Typography color="red">{error}</Typography>;
    if (bookings.length === 0) return <Typography>{emptyMessage}</Typography>;

    return (
      <table className="w-full min-w-[640px] table-auto">
        <thead>
          <tr>
            {["Parking Spot", "Vehicle Number", "From Date", "To Date"].map((el) => (
              <th key={el} className="border-b border-blue-gray-50 py-3 px-6 text-left">
                <Typography variant="small" className="text-[11px] font-medium uppercase text-blue-gray-400">
                  {el}
                </Typography>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id}>
              <td className="py-3 px-5 border-b border-blue-gray-50">
                {booking.parkingSlot?.parkingLevel?.parkingLot?.name ? (
                  <>
                    <p>Slot No: {booking.parkingSlot?.slotNumber || "N/A"}</p>
                    <p>Level: {booking.parkingSlot.parkingLevel.name}</p>
                    <p>Lot: {booking.parkingSlot.parkingLevel.parkingLot.name}</p>
                    <p>Address: {booking.parkingSlot?.parkingLevel?.parkingLot?.address}</p>
                  </>
                ) : "N/A"}
              </td>
              <td>{booking.vehicleNumber}</td>
              <td>{formatDateDDMMYYYY(booking.fromDate)}</td>
              <td>{formatDateDDMMYYYY(booking.toDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCardHeader = (title) => (
    <CardHeader
      floated={false}
      shadow={false}
      color="transparent"
      className="m-0 flex flex-col items-start justify-between p-6"
    >
      <div className="w-full flex justify-between items-center mb-4">
        <Typography variant="h6" color="blue-gray" className="mb-1">
          {title}
        </Typography>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleExport("csv")}
            className="flex items-center gap-1"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            CSV
          </Button>
          <Button
            size="sm"
            onClick={() => handleExport("pdf")}
            className="flex items-center gap-1"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 w-full">
        {["upcoming", "past", "overstayed"].map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 font-medium text-sm ${activeTab === tab
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
              }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>
    </CardHeader>
  );

  return (
    <div className="mt-12">
      {userRole !== "user" && (
        <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-2 xl:grid-cols-5">
          {parkingStatsCardsData.map(({ icon, title, footer, ...rest }) => (
            <StatisticsCard
              key={title}
              {...rest}
              title={title}
              icon={React.createElement(icon, {
                className: "w-6 h-6 text-white",
              })}
              footer={
                <Typography className="font-normal text-blue-gray-600">
                  <strong className={footer.color}>{footer.value}</strong>
                  &nbsp;{footer.label}
                </Typography>
              }
            />
          ))}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-6 xl:grid-cols-1">
        <Card className="overflow-hidden xl:col-span-1 border border-blue-gray-100 shadow-sm">
          {renderCardHeader(
            activeTab === "upcoming"
              ? "Upcoming Bookings"
              : activeTab === "past"
                ? "Past Bookings"
                : "Overstayed Bookings"
          )}
          <CardBody className="overflow-scroll h-[60vh] px-0 pt-0 pb-2">
            {renderBookingsTable(
              currentItems,
              activeTab === "upcoming"
                ? (<div className="flex justify-center mt-4">No upcoming bookings found</div>)
                : activeTab === "past"
                  ? (<div className="flex justify-center mt-4">No past bookings found</div>)
                  : (<div className="flex justify-center mt-4">No overstayed bookings found</div>)
            )}

            {currentBookings.length > itemsPerPage && (
              <div className="flex justify-center mt-4">
                <div className="flex gap-1">
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {Array.from({ length: Math.ceil(currentBookings.length / itemsPerPage) }).map((_, index) => (
                    <Button
                      key={index}
                      variant={currentPage === index + 1 ? "filled" : "outlined"}
                      size="sm"
                      onClick={() => paginate(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === Math.ceil(currentBookings.length / itemsPerPage)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* You can keep the other cards if needed, but they seem redundant now */}
      </div>
    </div>
  );
}

export default Home;