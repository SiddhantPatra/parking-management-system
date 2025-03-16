# Parking Management System

The **Parking Management System** is a web-based application designed to efficiently manage parking slots. It allows users to book parking slots, view availability, and manage bookings. Administrators have functionalities to oversee users, parking slots, and reservations. The system is built using **Node.js, Express.js, MongoDB, and React.js**.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features
- **User Authentication**: Register, log in, and log out using JWT-based authentication.
- **Parking Slot Management**: Admins can create, update, and delete parking slots. Users can view and book available slots.
- **Booking Management**: Users can create, view, and cancel their bookings. Admins can manage all bookings.
- **User Management**: Admins can view, update, and delete users. They can also assign roles (User, Moderator, Admin).

## Technologies Used
### Backend:
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt (for password hashing)
- Express Validator (for input validation)

### Frontend:
- React.js
- Material UI + Tailwind CSS
- Axios (for API calls)
- React Router (for navigation)
- React Datepicker (for date selection)

### Database:
- MongoDB (hosted on MongoDB Atlas or locally)

### Other Tools:
- Postman (for API testing)
- Git (for version control)

## Prerequisites
Before starting, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (Node Package Manager)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** (for cloning the repository)

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/parking-management-system.git
cd parking-management-system
```

### 2. Backend Setup
Navigate to the backend folder:
```bash
cd api
```
Install dependencies:
```bash
npm install
```

#### Environment Variables
Create a `.env` file in the backend folder and add the following variables:
```env
MONGODB_URL=mongodb://localhost:27017/parking-system
JWT_SECRET=your_jwt_secret_key
PORT=5001
```
> Replace `your_jwt_secret_key` with a secure secret key for JWT token generation.

Start the backend server:
```bash
npm run dev
```
> The backend server will run on **http://localhost:5001**.

### 3. Frontend Setup
Navigate to the frontend folder:
```bash
cd client
```
Install dependencies:
```bash
npm install
```
Start the frontend development server:
```bash
npm run dev
```
> The frontend application will run on **http://localhost:3000** or **http://localhost:5173/**.

## Running the Application
To run the entire application:
1. Start the **backend** (`api` directory):
   ```bash
   npm run dev
   ```
2. Start the **frontend** (`client` directory):
   ```bash
   npm run dev
   ```

## API Endpoints
| Method | Endpoint          | Description                    |
|--------|------------------|--------------------------------|
| POST   | `/api/signup`    | Register a new user           |
| POST   | `/api/signin`    | Log in a user                 |
| POST   | `/api/logout`    | Log out a user                |
| GET    | `/api/slots`     | Get available parking slots   |
| POST   | `/api/bookings`  | Book a parking slot           |
| GET    | `/api/bookings`  | Get user bookings             |
| DELETE | `/api/bookings/:id` | Cancel a booking          |

## Contributing
Contributions are welcome! If you'd like to contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m "Added new feature"`).
4. Push to the branch (`git push origin feature-branch`).
5. Open a Pull Request.

## License
This project is licensed under the **MIT License**.
