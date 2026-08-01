# 🤖 AI Customer Support Assistant

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
</p>

A premium, full-stack responsive AI Customer Support Assistant built with **React (Vite)**, **Express.js**, **MongoDB**, and **Google Gemini 3.5 Flash** models. 

This repository showcases advanced prompt design, resilient API fail-safes, real-time telemetry diagnostics, clean Mongoose database structures, and high-fidelity glassmorphic visual layouts.

---

## 📌 Table of Contents
*   [✨ Core Features](#-core-features)
*   [🛡️ Validation & Resilience](#️-validation--resilience)
*   [📁 Project Architecture](#-project-architecture)
*   [📊 Database Design](#-database-design)
*   [🚀 Installation & Quick Start](#-installation--quick-start)
*   [🔗 API Documentation](#-api-documentation)

---

## ✨ Core Features

### 🖥️ SaaS Landing Page Onboarding
A fully styled home portal featuring marketing highlights, dynamic capability logs, online status indicators, and a frosted login panel to authenticate guest client sessions.

### 🤖 ChatGPT-Style Support Dashboard
Once connected, the workspace loads a clean dashboard presenting:
*   **Quick suggestion cards** styled with premium icons to auto-submit common questions immediately.
*   **A collapsible desktop sidebar** minimizing to a clean `80px` dock to maximize typing space.
*   **User-isolated chats** showing and populating only the conversations started by the logged-in client.

### 📋 Micro-Interactions & Rich Output
*   **Copy-to-Clipboard**: Copy response buttons inside AI text bubbles showing 2-second checkmark indicators.
*   **Bouncing Dots Loader**: Animated indicators representing the assistant's thinking state.
*   **Auto-Resize Textarea**: Input box heights adapt on-the-fly as multi-line prompts are drafted.
*   **Accent Markdown Bold**: Highlights bolded strings in glowing neon-blue text.

---

## 🛡️ Validation & Resilience

### 1. Payload Schema Verification
All incoming parameters dispatched to `POST /api/chat` are verified by the backend. It sanitizes text and rejects requests with a `400 Bad Request` status if names or prompt inputs are empty.

### 2. Telemetry Latency Monitors
Pings the backend automatically in the background to measure round-trip database and API latency, rendering a live connectivity pill (`Connected • 45ms`) in the console header.

### 3. Graceful AI Outage Failbacks
If the Gemini API key runs out of quota, triggers rate limits, or is missing entirely, the Express endpoints catch the exception and fall back to:
*   **System Notification Banners**: Appends an active fallback notification warning while keeping the thread responsive.
*   **Local Regex Keyword Matchers**: Performs offline parsing (matching credentials, refunds, support status, reset keywords) to simulate helpful responses in offline developer mode.

---

## 📁 Project Architecture

```text
cyvigilant/
├── backend/
│   ├── config/          # Database connection (db.js)
│   ├── models/          # Mongoose collections schema (Conversation.js)
│   ├── routes/          # Express controller endpoints (chat.js)
│   ├── .env.example     # Backend environmental template
│   └── server.js        # Entry server script
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Core React view controller and hooks
│   │   ├── index.css    # High-fidelity custom CSS variables and layouts
│   │   └── main.jsx     # App entry point mount
│   └── package.json
├── .env.example         # Root level configuration template
└── README.md            # Documentation
```

---

## 📊 Database Design

We use MongoDB modeled with Mongoose schemas. Conversations are structured using single collection documents to optimize performance:

```javascript
const ConversationSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  messages: [
    {
      sender: { type: String, enum: ['user', 'ai'], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});
```

### Why this design?
*   **Atomic Querying**: Nesting the `messages` log directly inside the `Conversation` document allows us to load entire conversation trees in a single database query.
*   **Performance**: Avoids join queries or relational tables, ensuring high-speed delivery.

---

## 🚀 Installation & Quick Start

### 1. Prerequisites
Ensure you have **Node.js** and **MongoDB** installed and running on your local machine.

### 2. Configure Environment variables
Copy the `.env.example` file to `.env` in the `backend` folder:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and paste your Google Gemini API Key:
```text
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_support_assistant
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Launch Backend Server
Navigate to the `backend` directory, install packages, and boot the Express service:
```bash
cd backend
npm install
npm run dev
```
The server will start on port `5000` connected to MongoDB.

### 4. Launch React Client
Open a new terminal window, navigate to the `frontend` directory, install packages, and boot the client:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser to access the console!

---

## 🔗 API Documentation

### 1. Send / Continue Chat
*   **Endpoint**: `POST /api/chat`
*   **Payload**:
    ```json
    {
      "username": "Kritika",
      "message": "I need help with password recovery",
      "conversationId": "6a6e0fb7..." // Optional. Omit to start a new chat thread.
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "conversationId": "6a6e0fb7...",
      "reply": "I can help you recover your password...",
      "messages": [ ... ]
    }
    ```

### 2. Get Thread History List
*   **Endpoint**: `GET /api/chat/history?username=Kritika`
*   **Description**: Retrieves conversation summary previews filtered by username.
*   **Response (200 OK)**:
    ```json
    [
      {
        "_id": "6a6e0fb7...",
        "username": "Kritika",
        "lastMessage": "I need help with password recovery",
        "createdAt": "2026-08-01T17:00:00.000Z"
      }
    ]
    ```

### 3. Retrieve Thread Details
*   **Endpoint**: `GET /api/chat/history/:id`
*   **Response (200 OK)**:
    ```json
    {
      "_id": "6a6e0fb7...",
      "username": "Kritika",
      "messages": [ ... ],
      "createdAt": "2026-08-01T17:00:00.000Z"
    }
    ```

### 4. Delete Thread
*   **Endpoint**: `DELETE /api/chat/history/:id`
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Conversation deleted successfully"
    }
    ```

---

## 📄 License
Released under the MIT License. Built with ❤️ by Vigilant Technologies.