# Beginner-Friendly Node.js & MongoDB Authentication System

A simple, secure, and clean authentication backend built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**. Designed with clarity for developers in their learning phase, following clean architecture principles without over-engineering.

---

## 📁 Project Structure

```text
task-manager/
├── .env
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── src/
    ├── app.js                     # Express application, middleware & route definitions
    ├── server.js                  # Database connection & server listener entry point
    ├── models/
    │   ├── user.model.js          # User collection schema (name, email, password)
    │   ├── session.model.js       # Active device sessions schema (with MongoDB TTL auto-cleanup)
    │   └── blacklist.model.js     # Revoked access tokens schema (with MongoDB TTL auto-cleanup)
    ├── services/
    │   ├── auth.service.js        # Business logic for auth (register, login, refresh, logout)
    │   └── token.service.js       # Helper methods for JWT generation, sessions, & blacklisting
    ├── controllers/
    │   └── auth.controller.js     # Request/response handlers and cookie management
    ├── routes/
    │   └── auth.routes.js         # Express route endpoints definition
    ├── middleware/
    │   └── auth.middleware.js     # Bearer token verification and blacklist check
    └── utils/
        ├── jwt.util.js            # JWT sign, verify, and decode helpers
        └── hash.util.js           # Password hashing and comparison using bcryptjs
```

---

## 🚀 Key Features & Concepts Explained

### 1. Dual-Token Authentication (Access Token + Refresh Token)
- **Access Token (Short-lived, e.g. 15m)**: Returned in the JSON response payload. Clients send this in the `Authorization: Bearer <token>` header for protected routes.
- **Refresh Token (Long-lived, e.g. 7d)**: Stored inside an **HTTP-Only Cookie**. Client-side JavaScript cannot read or steal it (protecting against Cross-Site Scripting / XSS).

### 2. Device Session Tracking
- When a user logs in, a document is created in the `Session` model capturing `userId`, `refreshToken`, `userAgent`, and `ip`.
- Allows identifying which device or browser logged in, enabling features like "Logout from this device" and "Logout from all devices".

### 3. Token Rotation & Reuse Detection
- **Rotation**: Every time `/api/auth/refresh-token` is requested, the old refresh token is replaced with a newly generated refresh token in the session and cookie.
- **Reuse Detection**: If an attacker tries to use an old, already-rotated refresh token, the server detects that the token does not match any active session in the database. As an immediate safeguard against account takeover, **all active sessions for that user are immediately invalidated**.

### 4. Token Blacklisting with MongoDB TTL Index
- When logging out, the current Access Token is saved in the `Blacklist` collection.
- Any subsequent requests with that token are blocked by `auth.middleware.js`.
- MongoDB's **TTL (Time-To-Live) index** (`expireAfterSeconds: 0`) automatically deletes expired blacklisted tokens once their natural lifespan ends, keeping the database fast and lean.

---

## 🛠️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) running locally or a [MongoDB Atlas](https://www.mongodb.com/atlas) connection URI.

### 2. Installation
Clone the repository or navigate to the project directory:
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/auth_db
JWT_ACCESS_SECRET=super_secret_access_token_key_12345
JWT_REFRESH_SECRET=super_secret_refresh_token_key_67890
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Running the Server
- **Development mode (with auto-restart)**:
  ```bash
  npm run dev
  ```
- **Production mode**:
  ```bash
  npm start
  ```

Once running, you should see:
```text
Successfully connected to MongoDB
Server is running on port 5000
Base URL: http://localhost:5000
```

---

## 📮 API Endpoints & Postman Testing Guide

### Base URL: `http://localhost:5000/api/auth`

---

### Step 1: Register a New User
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/register`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "name": "Alex Smith",
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **Expected Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "user": {
      "_id": "67406a4b37f401f8d42d3a12",
      "name": "Alex Smith",
      "email": "alex@example.com",
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
  ```

---

### Step 2: Login
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
- **Body** (raw JSON):
  ```json
  {
    "email": "alex@example.com",
    "password": "Password123"
  }
  ```
- **What Happens**:
  1. Postman receives `accessToken` in the JSON response body.
  2. Postman automatically captures the `refreshToken` in the **Cookies** tab (`httpOnly: true`).
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "accessToken": "eyJhbGciOi...",
    "user": {
      "_id": "67406a4b37f401f8d42d3a12",
      "name": "Alex Smith",
      "email": "alex@example.com"
    }
  }
  ```

> 💡 **Tip for Postman**: Copy the `accessToken` value from the response to use in the subsequent protected requests.

---

### Step 3: Access Protected Route (Profile)
- **Method**: `GET`
- **URL**: `http://localhost:5000/api/auth/profile`
- **Headers**:
  - `Authorization: Bearer <YOUR_ACCESS_TOKEN>`
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": {
      "_id": "67406a4b37f401f8d42d3a12",
      "name": "Alex Smith",
      "email": "alex@example.com"
    }
  }
  ```
- **Try testing invalid token**:
  - Send without `Authorization` header ➔ Returns `401 Access denied. No token provided.`
  - Send an invalid or expired token ➔ Returns `401 Invalid access token.`

---

### Step 4: Refresh Access Token (Token Rotation)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/refresh-token`
- **Headers**:
  - None required (Postman automatically sends the `refreshToken` cookie from Step 2)
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Access token refreshed successfully",
    "accessToken": "eyJhbGciOi...NEW_ACCESS_TOKEN..."
  }
  ```
- **Note**: The cookie `refreshToken` has now been rotated to a fresh value!

---

### Step 5: Logout (Current Device)
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/logout`
- **Headers**:
  - `Authorization: Bearer <YOUR_ACCESS_TOKEN>`
- **What Happens**:
  1. The current `accessToken` is added to the `Blacklist` collection in MongoDB.
  2. The session matching this device's `refreshToken` is deleted from the `Session` collection.
  3. The `refreshToken` cookie is cleared from the client.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully from this device"
  }
  ```
- **Verification**: If you now try calling `GET /api/auth/profile` with that same access token, it will return:
  ```json
  {
    "success": false,
    "message": "This token has been revoked / logged out. Please log in again."
  }
  ```

---

### Step 6: Logout All Devices
- **Method**: `POST`
- **URL**: `http://localhost:5000/api/auth/logout-all`
- **Headers**:
  - `Authorization: Bearer <YOUR_ACCESS_TOKEN>`
- **What Happens**:
  1. Blacklists the current access token.
  2. Deletes **all** session records belonging to this user across all devices/browsers.
  3. Clears the cookie on the current client.
- **Expected Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged out successfully from all devices"
  }
  ```
