import React, { useState, useEffect, useRef } from "react";
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
    Dialog,
    DialogHeader,
    DialogBody,
    DialogFooter,
    Tooltip,
} from "@material-tailwind/react";
import { publicRequest } from "@/requestMethods";
import { UserModal } from "@/components/UserModal";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { PencilIcon } from "@heroicons/react/24/solid";


const avatarOptions = [
    "/avatars/yellow.png",
    "/avatars/red.jpg",
    "/avatars/sky.jpg",
    "/avatars/black.jpg",
    "/avatars/green.jpg",
];
const UsersPDF = ({ users }) => {
    const styles = StyleSheet.create({
        page: {
            padding: 30,
            fontSize: 10
        },
        header: {
            fontSize: 18,
            marginBottom: 20,
            textAlign: 'center',
            fontWeight: 'bold'
        },
        table: {
            display: "table",
            width: "100%",
            borderStyle: "solid",
            borderWidth: 1,
            borderRightWidth: 0,
            borderBottomWidth: 0
        },
        tableRow: {
            margin: "auto",
            flexDirection: "row"
        },
        tableColHeader: {
            width: "16.66%",
            borderStyle: "solid",
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            backgroundColor: '#f0f0f0',
            padding: 5
        },
        tableCol: {
            width: "16.66%",
            borderStyle: "solid",
            borderWidth: 1,
            borderLeftWidth: 0,
            borderTopWidth: 0,
            padding: 5
        },
        textHeader: {
            fontWeight: 'bold',
            fontSize: 12
        },
        footer: {
            position: 'absolute',
            bottom: 30,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontSize: 10,
            color: 'grey'
        }
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Users Report</Text>
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableRow}>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.textHeader}>Name</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.textHeader}>Email</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.textHeader}>Contact</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.textHeader}>Role</Text>
                        </View>
                        <View style={styles.tableColHeader}>
                            <Text style={styles.textHeader}>Status</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    {users.map((user, index) => (
                        <View key={index} style={styles.tableRow}>
                            <View style={styles.tableCol}>
                                <Text>{`${user.firstName} ${user.lastName}`}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text>{user.email}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text>{user.contact || "N/A"}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text>{user.role}</Text>
                            </View>
                            <View style={styles.tableCol}>
                                <Text>{user.verified === "true" ? "Verified" : "Not Verified"}</Text>
                            </View>
                        </View>
                    ))}
                </View>
                <Text style={styles.footer}>
                    Generated on {new Date().toLocaleDateString()} | Total Users: {users.length}
                </Text>
            </Page>
        </Document>
    );
};
export function UserSection() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [editedUserDetails, setEditedUserDetails] = useState({});
    const [showAvatarDialog, setShowAvatarDialog] = useState(false);
    const fileInputRef = useRef(null);


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    throw new Error("No token found. Please log in.");
                }

                const res = await publicRequest.get(`/user?page=${currentPage}&limit=10`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
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

    const handleAvatarUpload = async (userId, file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await publicRequest.post(
                `/user/${userId}/upload-avatar`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            // Update the user list with new avatar
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === userId ? { ...user, avatar: res.data.avatar } : user
                )
            );

            alert('Avatar updated successfully!');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Error uploading avatar');
        }
    };

    const handleAvatarSelect = (userId, avatarUrl) => {
        // Update the edited user details if in edit mode
        if (editingUserId === userId) {
            setEditedUserDetails(prev => ({
                ...prev,
                avatar: avatarUrl
            }));
        }

        // Update the user in the list immediately
        setUsers(prevUsers =>
            prevUsers.map(user =>
                user._id === userId ? { ...user, avatar: avatarUrl } : user
            )
        );

        setShowAvatarDialog(false);
    };

    const handleSaveUser = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("No token found. Please log in.");
            }

            // Include profile picture in the update if it was changed
            const updateData = {
                ...editedUserDetails,
                ...(editedUserDetails.profilePicture && {
                    profilePicture: editedUserDetails.profilePicture
                })
            };

            const res = await publicRequest.put(
                `/user/${userId}`,
                updateData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Update the user list
            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user._id === res.data._id ? res.data : user
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

    // const handleSaveUser = async (userId) => {
    //     try {
    //         const token = localStorage.getItem("token");

    //         if (!token) {
    //             throw new Error("No token found. Please log in.");
    //         }

    //         const res = await publicRequest.put(
    //             `/user/${userId}`,
    //             editedUserDetails,
    //             {
    //                 headers: {
    //                     Authorization: `Bearer ${token}`,
    //                 },
    //             }
    //         );
    //         const updatedUser = res.data;

    //         // Update the user list
    //         setUsers((prevUsers) =>
    //             prevUsers.map((user) =>
    //                 user._id === updatedUser._id ? updatedUser : user
    //             )
    //         );

    //         // Reset editing state
    //         setEditingUserId(null);
    //         setEditedUserDetails({});
    //     } catch (err) {
    //         console.error("Error updating user details:", err.response?.data?.error || err.message);
    //         alert(err.response?.data?.error || "Failed to update user details.");
    //     }
    // };

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
    // Excel Download Handler
    const handleExcelDownload = (users) => {
        const worksheet = XLSX.utils.json_to_sheet(
            users.map(user => ({
                "Name": `${user.firstName} ${user.lastName}`,
                "Email": user.email,
                "Contact": user.contact || "N/A",
                "Vehicle": user.vehicle || "N/A",
                "Role": user.role,
                "Status": user.verified === "true" ? "Verified" : "Not Verified"
            }))
        );

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

        // Generate Excel file and download
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, `users_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Simple PDF Download Handler (using jsPDF)
    const handleTablePDFDownload = (users) => {
        const doc = new jsPDF();

        // Title
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Users Report", 105, 15, { align: 'center' });

        // Date
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });

        // Table headers
        const headers = [
            "Name",
            "Email",
            "Contact",
            "Role",
            "Status"
        ];

        // Table data
        const data = users.map(user => [
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.contact || "N/A",
            user.role,
            user.verified === "true" ? "Verified" : "Not Verified"
        ]);

        // Add table
        doc.autoTable({
            head: [headers],
            body: data,
            startY: 30,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total Users: ${users.length}`, 105, doc.lastAutoTable.finalY + 10, { align: 'center' });

        // Save the PDF
        doc.save(`users_report_${new Date().toISOString().split('T')[0]}.pdf`);
    };
    return (
        <div className="mt-12 mb-8 flex flex-col gap-12">
            <Card>
                <CardHeader variant="gradient" color="gray" className="mb-8 p-6 flex justify-between items-center">
                    <Typography variant="h6" color="white">
                        Authors Table
                    </Typography>
                    <div className="flex gap-2">
                        <Button
                            color="green"
                            onClick={() => handleExcelDownload(users)}
                            disabled={users.length === 0}
                            className="flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel
                        </Button>

                        <Button
                            color="red"
                            onClick={() => handleTablePDFDownload(users)}
                            disabled={users.length === 0}
                            className="flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                        </Button>

                        {/* Alternative PDF Download using react-pdf */}
                        {users.length > 0 && (
                            <PDFDownloadLink
                                document={<UsersPDF users={users} />}
                                fileName={`users_report_${new Date().toISOString().split('T')[0]}.pdf`}
                            >
                                {({ loading }) => (
                                    <Button
                                        color="blue"
                                        disabled={loading}
                                        className="flex items-center gap-2"
                                    >
                                        {loading ? 'Loading...' : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                PDF (Alt)
                                            </>
                                        )}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        )}
                    </div>
                </CardHeader>
                <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
                    <table className="w-full min-w-[640px] table-auto">
                        <thead>
                            <tr>
                                {["User", "Contact", "Vehicle", "Role", "Status", "Actions"].map((el) => (
                                    <th key={el} className="border-b border-blue-gray-50 py-3 px-5 text-left">
                                        <Typography variant="small" className="text-[11px] font-bold uppercase text-blue-gray-400">
                                            {el}
                                        </Typography>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => {
                                const { _id, avatar, firstName, lastName, email, role, verified, contact, vehicle } = user;
                                const fullName = `${firstName} ${lastName}`;
                                const isEditing = editingUserId === _id;
                                const canEdit = canEditUser(role, _id);
                                const canDelete = canDeleteUser(role, _id);

                                return (
                                    <tr key={_id}>
                                        <td className="py-3 px-5 border-b border-blue-gray-50">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <Avatar
                                                        src={isEditing ? (editedUserDetails.avatar || avatar) : avatar}
                                                        alt={fullName}
                                                        size="sm"
                                                        variant="rounded"
                                                        className="cursor-pointer"
                                                        onClick={() => isEditing && setShowAvatarDialog(true)}
                                                    />
                                                    {isEditing && (
                                                        <div className="absolute -bottom-2 -right-2">
                                                            <Tooltip content="Change Avatar">
                                                                <Button
                                                                    size="sm"
                                                                    color="blue"
                                                                    onClick={() => setShowAvatarDialog(true)}
                                                                >
                                                                    <PencilIcon className="h-4 w-4" />
                                                                </Button>
                                                            </Tooltip>
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    {isEditing ? (
                                                        <>
                                                            <Input
                                                                value={editedUserDetails.firstName || firstName}
                                                                onChange={(e) => handleInputChange(e, "firstName")}
                                                                placeholder="First Name"
                                                                className="mb-2"
                                                            />
                                                            <Input
                                                                value={editedUserDetails.lastName || lastName}
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
                                                        onClick={() => handleViewUser({ _id, avatar, firstName, lastName, email, role, verified, contact, vehicle })}
                                                    >
                                                        View
                                                    </Typography>
                                                    {canEdit && (
                                                        <Typography
                                                            as="a"
                                                            href="#"
                                                            className="text-xs font-semibold text-blue-600 cursor-pointer"
                                                            onClick={() => handleEditUser({ _id, avatar, firstName, lastName, email, role, verified, contact, vehicle })}
                                                        >
                                                            Edit
                                                        </Typography>
                                                    )}
                                                    {canDelete && (
                                                        <Typography
                                                            as="a"
                                                            href="#"
                                                            className="text-xs font-semibold text-red-600"
                                                            onClick={() => handleDeleteUser({ _id, avatar, firstName, lastName, email, role, verified, contact, vehicle })}
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
            {/* Avatar Selection Dialog */}
            <Dialog open={showAvatarDialog} handler={() => setShowAvatarDialog(false)}>
                <DialogHeader>Select Profile Picture</DialogHeader>
                <DialogBody className="grid grid-cols-3 gap-4">
                    {avatarOptions.map((avatar, index) => (
                        <div
                            key={index}
                            className={`p-2 rounded-lg cursor-pointer ${(editingUserId && editedUserDetails.avatar === avatar) ?
                                'ring-2 ring-blue-500' : 'hover:bg-gray-100'
                                }`}
                            onClick={() => handleAvatarSelect(editingUserId, avatar)}
                        >
                            <Avatar src={avatar} size="xl" className="w-full h-auto" />
                        </div>
                    ))}
                </DialogBody>
                <DialogFooter>
                    <Button
                        variant="text"
                        color="red"
                        onClick={() => setShowAvatarDialog(false)}
                        className="mr-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="gradient"
                        color="green"
                        onClick={() => {
                            // If you want to implement file upload as well
                            fileInputRef.current.click();
                        }}
                    >
                        Upload Custom
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) => handleAvatarUpload(editingUserId, e.target.files[0])}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </DialogFooter>
            </Dialog>
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