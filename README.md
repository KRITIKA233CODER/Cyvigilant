# AI Customer Support Assistant

A full-stack, responsive customer support chatbot built using **React.js (Vite)**, **Node.js**, **Express.js**, **MongoDB**, and **Google Gemini API**. 

This application demonstrates modern code organization, clean data modeling, robust error handling, responsive UI design, and advanced prompt handling.

---

## Features

*   **SaaS Landing Page**: A fully fleshed-out landing page welcome portal. Includes marketing hero blocks, feature bullet lists, online indicators, and a frosted connection panel.
*   **ChatGPT-Style Console Onboarding**: On login or reload, users land on a clean, empty welcome dashboard presenting quick suggestion cards. Previous chats are populated in the sidebar history but not auto-opened, giving clients the choice to start fresh or continue past threads.
*   **Active Telemetry Status Badge**: Probes connection status and measures round-trip database and API latency in milliseconds, displaying a live pulsing status indicator in the header.
*   **Auto-Submitting Suggestion Cards**: Clicking prompts in the suggestion grid dispatches the queries instantly, triggering the chatbot flow without needing manual typing.
*   **Responsive Chat Interface**: High-fidelity dark glassmorphic design that adapts beautifully to mobile and desktop screens.
*   **User-Isolated Chat History**: Conversation summaries list and fetch only data matching the logged-in client.
*   **Live Context Retrieval**: Chat logs are sent dynamically to the Gemini API as context, enabling conversational continuity.
*   **Typing & Loading Indicator**: Visual CSS bouncing dots loader that displays while waiting for the AI response.
*   **Graceful API Fallbacks**: The application detects if the API key is missing or fails, gracefully falling back to a structured mock support agent so the app remains fully functional for evaluation.
*   **Clean Separation of Concerns**: Highly structured and modular codebase.

---

## Tech Stack

*   **Frontend**: React (Vite), Axios, Lucide React (Icons), Vanilla CSS
*   **Backend**: Node.js, Express.js
*   **Database**: MongoDB, Mongoose ODM
*   **AI Integration**: Google Gemini API via `@google/generative-ai`

---

## Validation, Error Handling, and Resilience

### 1. Request Body Validation (Backend)
To prevent bad requests and database corruption, the `POST /api/chat` route performs validation on incoming payloads:
*   Verifies that both `username` and `message` exist, are strings, and contain non-empty data (after trimming).
*   Returns a `400 Bad Request` JSON status (e.g., `{"success": false, "error": "Username is required"}`) if input parameters fail verification.

### 2. Graceful AI Failure Handling & Fallbacks (Resilience)
The backend endpoints wrap the Gemini API execution in try/catch blocks to ensure server stability:
*   **On-the-fly API Errors**: If the Gemini API raises exceptions (e.g., rate limits, invalid keys, or Google service outages), the route catches it and falls back to a clean message: `[System Notification: AI service temporarily unavailable. Fallback response active.]` so that the user's thread remains active.
*   **Omitted API Keys**: If `GEMINI_API_KEY` is missing in the environment, the server starts in **Fallback Mock Mode**, routing user queries through an offline regex keyword matcher to return realistic, simulated customer support replies.

### 3. Visual Loading Indicator (Frontend)
*   Toggles a `loading` state when a request is dispatched.
*   Disables the text input controls and displays a spinning loader icon inside the send button.
*   Renders a styled chat bubble containing three glowing, CSS-animated bouncing dots (`.typing-dot`) representing the assistant's active typing status.

### 4. Visual Error Banners (Frontend)
*   Axios exceptions (such as offline servers or `400` errors) are caught in the frontend catch block.
*   Displays a red alert banner (`.error-banner`) containing the exact error description and a dismiss action button at the top of the conversation viewport.

---

## Data Modeling & Collections

We use **Mongoose** to define a schema in MongoDB. The design uses a single collections architecture for conversations:

### 1. `Conversation` Collection
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
*   **Document Nesting**: Chat logs are almost always queried together as a single conversational flow. Nesting the `messages` array inside the parent `Conversation` document allows us to load the entire session in a single database query.
*   **Performance**: Avoids complex relational database joins. Reading and appending messages are atomic, fast operations.
*   **Timestamps & Status**: Individual message timestamps track the exact time of delivery.

---

## Project Structure

```
cyvigilant/
├── backend/
│   ├── config/          # Database configuration (db.js)
│   ├── models/          # Mongoose collections (Conversation.js)
│   ├── routes/          # Express API route endpoints (chat.js)
│   ├── .env.example     # Backend environmental template
│   └── server.js        # Entry server script
├── frontend/
│   ├── src/
│   │   ├── components/  # Modals and custom icons
│   │   ├── App.jsx      # Core React view and logic
│   │   ├── index.css    # Premium CSS styles
│   │   └── main.jsx     # Root mount file
│   └── package.json
├── .env.example         # Root level configuration template
└── README.md            # Documentation
```

---

## API Documentation

### 1. Send Message
*   **Endpoint**: `POST /api/chat`
*   **Description**: Appends a user prompt to a session, requests a response from Gemini AI (providing conversation history for continuity), and saves the results.
*   **Request Body**:
    ```json
    {
      "username": "Alex",
      "message": "How do I reset my password?",
      "conversationId": "65b9fc54..." // Optional. Leave null to start a new chat session.
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "success": true,
      "conversationId": "65b9fc54...",
      "reply": "To reset your password, click on...",
      "messages": [ ... ]
    }
    ```

### 2. Get Chat Sessions
*   **Endpoint**: `GET /api/chat/history`
*   **Description**: Retrieves a summary list of all conversations for the sidebar view.
*   **Response (200 OK)**:
    ```json
    [
      {
        "_id": "65b9fc54...",
        "username": "Alex",
        "lastMessage": "How do I reset my password?",
        "createdAt": "2026-08-01T14:00:00.000Z"
      }
    ]
    ```

### 3. Get Session Details
*   **Endpoint**: `GET /api/chat/history/:id`
*   **Description**: Retrieves full details of a specific conversation including all its message lists.
*   **Response (200 OK)**:
    ```json
    {
      "_id": "65b9fc54...",
      "username": "Alex",
      "messages": [
        { "sender": "user", "text": "Hi", "timestamp": "..." },
        { "sender": "ai", "text": "Hello, how can I help you?", "timestamp": "..." }
      ]
    }
    ```

### 4. Delete Session
*   **Endpoint**: `DELETE /api/chat/history/:id`
*   **Description**: Deletes a conversation session from the database.
*   **Response (200 OK)**:
    ```json
    { "success": true, "message": "Conversation deleted successfully" }
    ```

---

## Installation & Setup

### Prerequisites
*   **Node.js** (v18 or higher recommended)
*   **MongoDB** running locally or a MongoDB Atlas Connection URI

### Step 1: Clone and Configure Backend
1.  Navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create your environment file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in your details:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://127.0.0.1:27017/ai_support_assistant
    GEMINI_API_KEY=your_google_gemini_api_key
    ```
    *(Note: If you leave `GEMINI_API_KEY` empty, the server automatically defaults to Fallback Mock Mode with simulated support responses).*

4.  Start the backend server in development mode:
    ```bash
    npm run dev
    ```

### Step 2: Configure and Run Frontend
1.  Open a new terminal and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the local address displayed (usually `http://localhost:5173`).

---

## AI Integration Details

### Prompt Engineering
The system sets the conversational context using the following instructions:
*   **System Directive**: `"You are a professional and helpful customer support assistant for Vigilant Technologies. Keep answers concise, clear, and polite. Always address the user by name when appropriate."`
*   **Conversational History**: Before calling the Gemini model, past messages are compiled from the local MongoDB instance and translated into the Gemini message list schema format (`user` and `model` roles) so that the assistant remembers the context of previous dialog turns.

### Graceful Error Handling
*   **API Limits / Down States**: In case of transient errors, the server sends a clean fallback message indicating system limits.
*   **Demo / Key Check**: If the user starts the server without configuring a Gemini Key, a mock agent handles user queries depending on input keywords (hello, order, refund, login, password), allowing seamless offline assessment.

 #   C y v i g i l a n t  
 