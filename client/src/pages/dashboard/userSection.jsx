import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Typography,
    Avatar,
    Chip,
    Button,
    Select,
    Option,
    Input,
} from "@material-tailwind/react";
import { publicRequest } from "@/requestMethods";
import { UserModal } from "@/components/UserModal";

export function UserSection() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null); // Track which user is being edited
    const [editedUserDetails, setEditedUserDetails] = useState({}); // Store edited details
    const [currentUserRole, setCurrentUserRole] = useState(""); // Track the role of the logged-in user


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token"); // Get the token from localStorage
                if (!token) {
                    throw new Error("No token found. Please log in.");
                }

                const res = await publicRequest.get(`/user?page=${currentPage}&limit=10`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include the token in the request headers
                    },
                });
                setUsers(res.data.users);
                setTotalPages(res.data.totalPages);
            } catch (err) {
                console.error("Error fetching users:", err);
                alert(err.response?.data?.error || "Failed to fetch users. Please log in.");
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No token found. Please log in.");
            }

            const res = await publicRequest.put(
                `/user/${userId}/role`,
                { role: newRole },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const updatedUser = res.data;

            // Update the user list
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user._id === updatedUser._id ? updatedUser : user
                )
            );
        } catch (err) {
            console.error("Error updating user role:", err.response?.data?.error || err.message);
            alert(err.response?.data?.error || "Failed to update user role.");
        }
    };

    const handleEditUser = (user) => {
        setEditingUserId(user._id);
        setEditedUserDetails({
            firstName: user.firstName,
            lastName: user.lastName,
            contact: user.contact,
            vehicle: user.vehicle,
        });
    };

    const handleDeleteUser = async (user) => {

        if (!window.confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
            return;
        }
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No token found. Please log in.");
            }

            await publicRequest.delete(`/user/${user._id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Remove the deleted user from the state
            setUsers(prevUsers => prevUsers.filter(u => u._id !== user._id));

            // Show success message
            alert("User deleted successfully");
        } catch (err) {
            console.error("Error deleting user:", err.response?.data?.error || err.message);
            alert(err.response?.data?.error || "Failed to delete user.");
        }
    }

    const handleSaveUser = async (userId) => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                throw new Error("No token found. Please log in.");
            }

            const res = await publicRequest.put(
                `/user/${userId}`,
                editedUserDetails,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const updatedUser = res.data;

            // Update the user list
            setUsers((prevUsers) =>
                prevUsers.map((user) =>
                    user._id === updatedUser._id ? updatedUser : user
                )
            );

            // Reset editing state
            setEditingUserId(null);
            setEditedUserDetails({});
        } catch (err) {
            console.error("Error updating user details:", err.response?.data?.error || err.message);
            alert(err.response?.data?.error || "Failed to update user details.");
        }
    };

    const handleCancelEdit = () => {
        setEditingUserId(null);
        setEditedUserDetails({});
    };

    const handleInputChange = (e, field) => {
        setEditedUserDetails({
            ...editedUserDetails,
            [field]: e.target.value,
        });
    };

    // Check if the current user can edit a specific user
    const canEditUser = (targetUserRole, targetUserId) => {
        // Check if localStorage is available
        if (typeof window === "undefined") {
            console.error("localStorage is not available.");
            return false;
        }

        // Parse the persisted state from localStorage
        const persistedState = JSON.parse(localStorage.getItem("persist:root"));
        if (!persistedState || !persistedState.user) {
            console.error("No user data found in localStorage.");
            return false;
        }

        // Parse the user data from the persisted state
        const user = JSON.parse(persistedState.user);
        if (!user || !user.currentUser) {
            console.error("No currentUser found in the user data.");
            return false;
        }

        // Extract current user's ID and role
        const currentUserId = user.currentUser._id;
        const currentUserRole = user.currentUser.role;

        // Admin can edit all users (including other admins and moderators)
        if (currentUserRole === "admin") {
            return true;
        }

        // Moderator can edit users and themselves, but not other moderators or admins
        if (currentUserRole === "moderator") {
            return (
                targetUserRole === "user" || // Moderator can edit users
                targetUserId === currentUserId // Moderator can edit themselves
            );
        }

        // Default: no permission
        return false;
    };

    const canDeleteUser = (targetUserRole, targetUserId) => {
        // Similar to canEditUser but with stricter rules
        const persistedState = JSON.parse(localStorage.getItem("persist:root"));
        if (!persistedState || !persistedState.user) {
            console.error("No user data found in localStorage.");
            return false;
        }
    
        const user = JSON.parse(persistedState.user);
        if (!user || !user.currentUser) {
            console.error("No currentUser found in the user data.");
            return false;
        }
    
        const currentUserId = user.currentUser._id;
        const currentUserRole = user.currentUser.role;
    
        // Only admin can delete users
        if (currentUserRole === "admin") {
            // Admin can delete anyone except themselves
            return targetUserId !== currentUserId;
        }
    
        // Moderators and regular users cannot delete anyone
        return false;
    };

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
                    <Typography variant="h6" color="white">
                        Authors Table
                    </Typography>
                </CardHeader>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>
                                {["Author", "Contact", "Vehicle", "Role", "Status", "Actions"].map((el) => (
                                    <th
                                        key={el}
                                        className="border-b border-blue-gray-50 py-3 px-5 text-left"
                                    >
                                        <Typography
                                            variant="small"
                                            className="text-[11px] font-bold uppercase text-blue-gray-400"
                                        >
                                            {el}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(({ _id, profilePicture, firstName, lastName, email, role, verified, contact, vehicle }) => {
                                const fullName = `${firstName} ${lastName}`;
                                const isEditing = editingUserId === _id;
                                const canEdit = canEditUser(role, _id); // Check if the current user can edit this user
                                const canDelete = canDeleteUser(role, _id); // Check if the current user can edit this user

                                return (
                                    <tr key={_id}>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            <div className="flex items-center gap-4">
                                                <Avatar src={profilePicture || "/img/bruce-mars.jpeg"} alt={fullName} size="sm" variant="rounded" />
                                                <div>
                                                    {isEditing ? (
                                                        <>
                                                            <Input
                                                                value={editedUserDetails.firstName}
                                                                onChange={(e) => handleInputChange(e, "firstName")}
                                                                placeholder="First Name"
                                                                className="mb-2"
                                                            />
                                                            <Input
                                                                value={editedUserDetails.lastName}
                                                                onChange={(e) => handleInputChange(e, "lastName")}
                                                                placeholder="Last Name"
                                                            />
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Typography variant="small" color="blue-gray" className="font-semibold">
                                                                {fullName}
                                                            </Typography>
                                                            <Typography className="text-xs font-normal text-blue-gray-500">
                                                                {email}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            {isEditing ? (
                                                <Input
                                                    value={editedUserDetails.contact}
                                                    onChange={(e) => handleInputChange(e, "contact")}
                                                    placeholder="Contact"
                                                />
                                            ) : (
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {contact || "N/A"}
                                                </Typography>
                                            )}
                                        </td>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            {isEditing ? (
                                                <Input
                                                    value={editedUserDetails.vehicle}
                                                    onChange={(e) => handleInputChange(e, "vehicle")}
                                                    placeholder="Vehicle"
                                                />
                                            ) : (
                                                <Typography className="text-xs font-semibold text-blue-gray-600">
                                                    {vehicle || "N/A"}
                                                </Typography>
                                            )}
                                        </td>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            {role !== 'admin' ? (
                                                <Select
                                                    value={role}
                                                    onChange={(newRole) => handleRoleChange(_id, newRole)}
                                                    className="w-full"
                                                >
                                                    <Option value="user">User</Option>
                                                    <Option value="moderator">Moderator</Option>
                                                </Select>
                                            ) : (
                                                <p>Admin</p>
                                            )}
                                        </td>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            <Chip
                                                variant="gradient"
                                                color={verified === "true" ? "green" : "blue-gray"}
                                                value={verified === "true" ? "Verified" : "Not Verified"}
                                                className="py-0.5 px-2 text-[11px] font-medium w-fit"
                                            />
                                        </td>
                                        <td className="py-3 px-5 flex flex-row border-b border-blue-gray-50 justify-around">
                                            {isEditing ? (
                                                <>
                                                    <Button
                                                        color="green"
                                                        size="sm"
                                                        onClick={() => handleSaveUser(_id)}
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        color="red"
                                                        size="sm"
                                                        onClick={handleCancelEdit}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Typography
                                                        as="a"
                                                        href="#"
                                                        className="text-xs font-semibold text-blue-gray-600 cursor-pointer"
                                                        onClick={() => handleViewUser({ _id, profilePicture, firstName, lastName, email, role, verified, contact, vehicle })}
                                                    >
                                                        View
                                                    </Typography>
                                                    {canEdit && (
                                                        <Typography
                                                            as="a"
                                                            href="#"
                                                            className="text-xs font-semibold text-blue-600 cursor-pointer"
                                                            onClick={() => handleEditUser({ _id, profilePicture, firstName, lastName, email, role, verified, contact, vehicle })}
                                                        >
                                                            Edit
                                                        </Typography>
                                                    )}
                                                    {canDelete && (
                                                        <Typography
                                                            as="a"
                                                            href="#"
                                                            className="text-xs font-semibold text-red-600"
                                                            onClick={() => handleDeleteUser({ _id, profilePicture, firstName, lastName, email, role, verified, contact, vehicle })}
                                                        >
                                                            Delete
                                                        </Typography>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardBody>
            </Card>

            {/* Pagination Controls */}
            <div className="flex justify-center gap-2">
                <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <Typography className="flex items-center gap-2">
                    Page {currentPage} of {totalPages}
                </Typography>
                <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>

            {/* User Modal */}
            <UserModal
                user={selectedUser}
                open={isModalOpen}
                handleClose={handleCloseModal}
            />
        </div>
    );
}

export default UserSection;