# Instagram DM Automation AI Agent

A scalable, multi-tenant social media automation platform built with the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- **Visual Dashboard**: Monitor sent/received messages and AI reply rates.
- **AI Agent**: Automated AI-powered replies to Instagram DMs using custom triggers.
- **Campaign Management**: Create and manage DM campaigns with triggers and automated responses.
- **Multilingual Support**: Ready for global use.
- **Real-time Updates**: Powered by Socket.io for instant message delivery and status updates.

## Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS (for UI), Lucide React.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas with Mongoose.
- **Real-time**: Socket.io.
- **Authentication**: JWT-based secure authentication.

## Getting Started

### Prerequisites

- Node.js (v20 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nknitishsingh94/DM-Automation.git
   cd DM-Automation
   ```

2. Install dependencies for both root, client, and server:
   ```bash
   npm run install-all
   ```

3. Setup environment variables:
   Create a `.env` file in the `server` directory with the following keys:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_secret_key
   GOOGLE_CLIENT_ID=your_google_id
   FACEBOOK_APP_ID=your_fb_id
   ```

### Running Locally

To start both the client and server in development mode:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Scripts

- `npm run install-all`: Installs all dependencies for root, client, and server.
- `npm run dev`: Starts both backend and frontend concurrently.
- `npm run server`: Starts the backend only.
- `npm run client`: Starts the frontend only.
- `npm run build`: Builds the frontend for production.

---
Built with ❤️ by [nknitishsingh94](https://github.com/nknitishsingh94)
