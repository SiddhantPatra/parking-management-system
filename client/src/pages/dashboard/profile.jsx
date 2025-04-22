import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Avatar,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Switch,
  Tooltip,
  Button,
  Input,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import {
  HomeIcon,
  ChatBubbleLeftEllipsisIcon,
  Cog6ToothIcon,
  PencilIcon,
} from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { ProfileInfoCard, MessageCard } from "@/widgets/cards";
import { publicRequest } from "@/requestMethods";
import { updateUser } from "@/redux/userRedux";
import yellow from "@/assets/images/yellow.png"
import red from "@/assets/images/red.jpg"
import sky from "@/assets/images/sky.jpg"
import black from "@/assets/images/black.jpg"
import green from "@/assets/images/green.jpg"
// Array of available avatar images
const avatarOptions = [
  yellow, red, sky, black, green
];

export function Profile() {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [editedUserDetails, setEditedUserDetails] = useState({
    firstName: user.currentUser?.firstName || "",
    lastName: user.currentUser?.lastName || "",
    contact: user.currentUser?.contact || "",
    email: user.currentUser?.email || "",
    vehicle: user.currentUser?.vehicle || "",
    avatar: user.currentUser?.avatar || red, // Default avatar
  });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUserDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleAvatarSelect = (avatarUrl) => {
    setEditedUserDetails((prevDetails) => ({
      ...prevDetails,
      avatar: avatarUrl,
    }));
    setShowAvatarDialog(false);
  };

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = user.currentUser._id;

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

      // Update localStorage and Redux state
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const updatedStoredUser = { ...storedUser, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(updatedStoredUser));
      dispatch(updateUser(updatedUser));

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Error updating user details:", err.response?.data?.error || err.message);
      alert(err.response?.data?.error || "Failed to update user details.");
    }
  };

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>
      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar
                  src={editedUserDetails.avatar}
                  alt="profile-picture"
                  size="xl"
                  variant="rounded"
                  className="rounded-lg shadow-lg shadow-blue-gray-500/40 cursor-pointer"
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
                  <Input
                    name="firstName"
                    value={editedUserDetails.firstName}
                    onChange={handleInputChange}
                    label="First Name"
                  />
                ) : (
                  <Typography variant="h5" color="blue-gray" className="mb-1">
                    {user.currentUser?.firstName}'s
                  </Typography>
                )}
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-600"
                >
                  Profile
                </Typography>
              </div>
            </div>
          </div>
          <div className="gird-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
            <ProfileInfoCard
              title="Profile Information"
              details={{
                "first name": isEditing ? (
                  <Input
                    name="firstName"
                    value={editedUserDetails.firstName}
                    onChange={handleInputChange}
                    label="First Name"
                  />
                ) : (
                  user.currentUser?.firstName
                ),
                "last name": isEditing ? (
                  <Input
                    name="lastName"
                    value={editedUserDetails.lastName}
                    onChange={handleInputChange}
                    label="Last Name"
                  />
                ) : (
                  user.currentUser?.lastName
                ),
                mobile: isEditing ? (
                  <Input
                    name="contact"
                    value={editedUserDetails.contact}
                    onChange={handleInputChange}
                    label="Mobile"
                  />
                ) : (
                  user.currentUser?.contact
                ),
                email: isEditing ? (
                  <Input
                    name="email"
                    value={editedUserDetails.email}
                    onChange={handleInputChange}
                    label="Email"
                  />
                ) : (
                  user.currentUser?.email
                ),
                vehicle: isEditing ? (
                  <Input
                    name="vehicle"
                    value={editedUserDetails.vehicle}
                    onChange={handleInputChange}
                    label="Vehicle"
                  />
                ) : (
                  user.currentUser?.vehicle
                ),
              }}
              action={
                isEditing ? (
                  <Button onClick={handleSaveUser} color="blue">
                    Save
                  </Button>
                ) : (
                  <Tooltip content="Edit Profile">
                    <PencilIcon
                      className="h-4 w-4 cursor-pointer text-blue-gray-500"
                      onClick={handleEditClick}
                    />
                  </Tooltip>
                )
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Avatar Selection Dialog */}
      <Dialog open={showAvatarDialog} handler={() => setShowAvatarDialog(false)}>
        <DialogHeader>Select a Profile Picture</DialogHeader>
        <DialogBody className="grid grid-cols-3 gap-4">
          {avatarOptions.map((avatar, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg cursor-pointer ${editedUserDetails.avatar === avatar ? 'ring-2 ring-blue-500' : 'hover:bg-gray-100'
                }`}
              onClick={() => handleAvatarSelect(avatar)}
            >
              <Avatar
                src={avatar}
                size="xl"
                className="w-full h-auto"
              />
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
            <span>Cancel</span>
          </Button>
          <Button
            variant="gradient"
            color="green"
            onClick={() => setShowAvatarDialog(false)}
          >
            <span>Confirm</span>
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default Profile;