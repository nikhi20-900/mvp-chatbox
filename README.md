# Real-Time Chat MVP

A simple chat app with:

- Backend: Node.js, Express, MongoDB, Mongoose, Socket.io, JWT
- Frontend: React, Vite, Tailwind CSS, Axios, Zustand

## Features

- Signup, login, and logout
- Protected auth routes with JWT cookies
- User list and one-to-one chat
- Message persistence in MongoDB
- Real-time messaging with Socket.io

## Project Structure

```text
backend/   # Express + MongoDB API
frontend/  # React + Vite client
```

There is no root `package.json`, so run install/build/start commands inside `backend/` and `frontend/`.

## Prerequisites

- Node.js 18+ recommended
- npm
- MongoDB running locally at `mongodb://127.0.0.1:27017/chat-mvp` or an updated `MONGODB_URI`

## Setup

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

`backend/.env`:

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/chat-mvp
JWT_SECRET=replace_this_with_a_secure_secret
CLIENT_URL=http://127.0.0.1:5173
```

The backend waits for MongoDB before it starts listening on port `5001`.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:5001/api
VITE_SOCKET_URL=http://127.0.0.1:5001
```

The Vite dev server runs on `http://127.0.0.1:5173`.

## Production Build

Frontend production build:

```bash
cd frontend
npm run build
```

Verified output path: `frontend/dist`

Backend production start:

```bash
cd backend
npm start
```

## Quick Run Order

1. Start MongoDB.
2. Start the backend from `backend/`.
3. Start the frontend from `frontend/`.
4. Open `http://127.0.0.1:5173`.

## How To Use

1. Create two accounts in separate browser windows.
2. Log in with both users.
3. Select a user from the sidebar.
4. Send messages and confirm they appear instantly.
