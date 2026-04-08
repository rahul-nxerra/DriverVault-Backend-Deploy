# 🚀 DriverVault Backend

A secure, scalable backend system for managing driver credentials with a dual-layer architecture (public + restricted access).

---

## 📌 Project Overview

DriverVault is designed to:
- Maintain driver credential profiles
- Provide public (SEO-friendly) driver information
- Securely manage restricted driver intelligence
- Enable controlled access for carriers and brokers

---

## 🧠 Key Features

- 🔐 Authentication (JWT-based)
- 👤 Role-based system (Driver, Carrier, Broker, Admin)
- 📄 Driver profile management
- 🔁 Access request system (planned)
- 🔒 Restricted data layer (planned)
- 📊 Audit logging (planned)

---

## 🏗️ Tech Stack

- Node.js
- Express.js
- MongoDB (Local)
- Mongoose
- JWT (Authentication)
- bcrypt (Password hashing)

---

## 📁 Folder Structure

backend/
│
├── src/
│ ├── config/ # Database configuration
│ ├── modules/ # Feature-based modules
│ │ ├── auth/
│ │ ├── user/
│ ├── routes/ # Central routes
│ ├── app.js # Express app setup
│ └── server.js # Entry point
│
├── .env
├── package.json

---

## ⚙️ Setup Instructions

### 1. Clone the repository


git clone https://github.com/Nxerra-Technologies/DriverVault-Backend.git

cd backend


---

### 2. Install dependencies


npm install


---

### 3. Setup environment variables

Create a `.env` file:


PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/driverVaultDB
JWT_SECRET=your_secret_key


---

### 4. Run the server


npm run dev


---

## 🌐 API Endpoints

### 🔐 Auth APIs

#### Register

POST /api/auth/register


**Body:**
```json
{
  "email": "test@gmail.com",
  "password": "123456",
  "role": "driver"
}
Login
POST /api/auth/login

Response:

{
  "msg": "Login successful",
  "token": "JWT_TOKEN"
}

---

🔑 Authentication
JWT-based authentication
Token must be sent in headers for protected routes:
Authorization: Bearer <token>
🚧 Upcoming Features
Driver profile module
Carrier access system
Restricted data layer
Audit logging
Admin dashboard

---

📌 Notes
Currently using local MongoDB
Backend is under active development
API structure may evolve
👨‍💻 Author

---

Rahul Shaw
Backend Developer

---

📞 Contact

For queries or collaboration, reach out via team communication channels.