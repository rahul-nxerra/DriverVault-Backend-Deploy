# 🚀 DriverVault Backend

A secure and scalable backend system built using the **MERN Stack**, designed to manage driver credentials with a **dual-layer architecture (Public + Restricted Access)**.

---

## 🏢 Developed At

**Nxerra Technologies**

---

## 📌 Project Overview

**DriverVault** is an enterprise-ready backend platform that enables structured, secure, and controlled access to driver data for carriers, brokers, and administrators.

### 🎯 Objectives

* Maintain verified driver credential profiles
* Provide **public (SEO-friendly)** driver information
* Secure sensitive driver data in a **restricted layer**
* Enable **controlled, time-bound access** for carriers

---

## 🧠 Key Features

* 🔐 **JWT Authentication & Authorization**
* 👥 **Role-Based Access Control (RBAC)**

  * Driver
  * Carrier
  * Admin
* 📄 **Driver Profile Management**
* 🔁 **Access Request System**

  * Carrier requests access
  * Driver approves/rejects
  * Auto-expiry (72 hours)
* 🔒 **Protected API Routes (Middleware-based)**
* 📊 **Driver Performance Records**
* 🛡️ **Secure & Modular Architecture**

---

## 🏗️ Tech Stack (MERN)

* **MongoDB Atlas** (Database)
* **Express.js** (Backend Framework)
* **Node.js** (Runtime)
* **Mongoose** (ODM)

### Additional Tools

* JWT (Authentication)
* bcrypt (Password hashing)
* Joi (Validation)
* Express Async Handler
* Custom Middleware (Auth, Role, Access Control)

---

## 📁 Folder Structure

```
backend/
│
├── src/
│   ├── config/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── driver/
│   │   ├── carrier/
│   │   ├── common/
│   │
│   ├── middlewares/
│   ├── routes/
│   ├── app.js
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

## ⚙️ Environment Setup

Create a `.env` file:

```
# ================= SERVER =================
PORT=5000

# ================= DATABASE =================
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/driverVaultDB

# ================= JWT =================
JWT_SECRET=your_secure_secret
JWT_EXPIRE=1d

# ================= CLOUDINARY =================
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🚀 Getting Started

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Nxerra-Technologies/DriverVault-Backend.git
cd backend
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Run Server

```bash
npm run dev
```

---

## 🌐 API Overview

---

### 🔐 Authentication

#### Register

```http
POST /api/auth/register
```

```json
{
  "email": "test@gmail.com",
  "password": "123456",
  "role": "driver"
}
```

---

#### Login

```http
POST /api/auth/login
```

```json
{
  "message": "Login successful",
  "token": "JWT_TOKEN"
}
```

---

## 🔁 Access Request Flow

### Carrier → Request Access

```http
POST /api/carrier/access-request
```

---

### Driver → View Requests

```http
GET /api/driver/access-requests
```

---

### Driver → Approve / Reject

```http
PATCH /api/driver/access-request/:id
```

```json
{
  "action": "approve",
  "notes": "Approved for review"
}
```

---

## 🔒 Access Control Logic

* Access is granted **only after driver approval**
* Access is **time-limited (72 hours)**
* Middleware enforces:

  * Role validation
  * Ownership checks
  * Expiry validation

---

## 📊 Protected Performance API

```http
GET /api/drivers/:driverId/performance
```

🔐 Requires:

* Carrier/Admin role
* Approved access

---

## 🧪 Testing

* Hoppscotch
* Postman

---

## ☁️ Deployment Ready

* ✅ MongoDB Atlas configured
* ✅ Environment-based configuration
* ✅ Production-ready backend
* 🔜 Deployable on Render

---

## 🚧 Upcoming Features

* 📊 Analytics Dashboard
* 🔔 Notification System
* 📁 Document Uploads
* 🧾 Audit Logs
* 🖥️ Admin Panel

---

## 📌 Notes

* Modular and scalable backend architecture
* Designed with security-first approach
* Actively under development

---

## 👨‍💻 Author

**Rahul Shaw**
MERN Stack Developer

---

## 📞 Organization

**Nxerra Technologies**

---

## ⭐ Contribution

Contributions, suggestions, and improvements are welcome.
