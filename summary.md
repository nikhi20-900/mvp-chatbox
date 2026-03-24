# Codebase Summary: Real-Time Chat MVP

This repository contains a full-stack real-time chat application built using the MERN stack along with Socket.io for real-time messaging.

## Tech Stack
**Frontend:**
- **Framework:** React + Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Networking:** Axios
- **Real-Time Comm:** Socket.io-client

**Backend:**
- **Runtime:** Node.js
- **API Framework:** Express
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (Cookies) + bcryptjs
- **Real-Time Comm:** Socket.io

## Project Structure

The project is divided into two separate directories: `frontend/` and `backend/`. Each manages its own dependencies and configuration natively (`package.json`, `.env`).

### `backend/` Architecture
The backend is a Node.js Express server utilizing MongoDB for data persistence and Socket.io for managing live connections.

- **`models/`**: Mongoose schemas for the database.
  - `User.js`: User entity (credentials, user profiles).
  - `Message.js`: Message entity (sender, receiver, text/content, timestamp).
- **`routes/`**: Express routers handling API endpoints.
  - `auth.js`: Handles user signup, login, and logout.
  - `message.js`: Handles retrieving and sending persistent messages.
- **`middleware/`**: 
  - `auth.js`: Middleware for protecting routes by verifying JWT tokens.
- **`server.js`**: Initial setup for the Express application, database connection, and mounting routes/middleware.
- **`socket.js`**: Socket.io logic for real-time bi-directional event handling.

### `frontend/` Architecture
The frontend is a Vite-powered React application organized by functionality.

- **`src/components/`**: Reusable UI elements.
  - `AuthShell.jsx`: Wrapper for authentication pages.
  - `ChatPanel.jsx` & `ChatWindow.jsx`: Components for displaying the main chat interface.
  - `MessageInput.jsx`: Input field component to send messages.
  - `Sidebar.jsx` & `UserSidebar.jsx`: Navigation and active user list sidemenus.
  - `ToastStack.jsx`: Notification/toast message alerts.
- **`src/pages/`**: Primary route views.
  - `Home.jsx`: Main dashboard post-login.
  - `Login.jsx` & `Signup.jsx`: Authentication views.
- **`src/store/`**: Zustand state management.
  - `authStore.js`: Handles user session state and info.
  - `chatStore.js`: Manages messages, active chats, and socket state in the UI.
  - `uiStore.js`: Manages UI state (like toggling sidebars or themes).
- **`src/lib/`**: Utilities and configuration.
  - `api.js` & `axios.js`: Setup for Axios instances and API route wrappers.

## Setup & Deployment Overview
- **Local Dev:** Handled by running `npm run dev` in both directories after configuring the `.env` via `.env.example`.
- **Production:** The frontend produces static assets via `vite build` to be hosted on Netlify, while the Node backend runs separately. Environment variables for API and WebSockets connect the two halves.
