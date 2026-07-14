# AIVOA.AI - AI-First Healthcare CRM (HCP Module)

A production-quality CRM portal designed for medical sales representatives. The application simplifies logging and reviewing interactions with healthcare professionals (HCPs) by combining a modern structured form with a conversational AI Copilot powered by LangGraph, LangChain, and Groq API. 

## Table of Contents
- [Overview](#overview)
- [Architecture & Flow](#architecture--flow)
- [Folder Structure & Files Explained](#folder-structure--files-explained)
- [Installation Guide](#installation-guide)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [LangGraph Agent Implementation](#langgraph-agent-implementation)
- [Future Improvements](#future-improvements)

---

## Overview

Medical sales representatives often find logging physician interactions tedious. **AIVOA.AI** offers a dual approach:
1. **Left-Panel Form**: A traditional, clear structured input form.
2. **Right-Panel AI Assistant**: A natural language chat assistant. The representative can simply type what happened (e.g., *"I met Dr. Thomas at Metro Clinic today. We discussed Glucophage and Novolog. He wants follow-up next Monday."*), and the AI automatically extracts structured entities, populates the form on the left, and saves the data to the database.

---

## Architecture & Flow

The application is split into a React frontend and a FastAPI backend. Below is the workflow for the conversational AI logging:

```
[User Message] 
      │
      ▼
[Intent Detection (Groq LLM)] ───► Chat / Reporting Tool ───► [Format Response] ───► [Return Output]
      │
      ▼ (if Log / Edit Interaction)
[LLM Clinical Validation]
      │
      ├─► (Missing Fields) ─► Ask User for Clarification
      │
      └─► (Valid Fields) ────► [Save Database] ───────────────► [Format Response] ───► [Return Output]
```

---

## Folder Structure & Files Explained

### Root Configuration
* **`.gitignore`**: Defines folders/files excluded from Git (e.g. `node_modules`, `crm.db`, local `.env` files).
* **`.env.example`**: Shared workspace template of environment variables for local backend/frontend configuration.
* **`.env`**: Shared workspace local environment variables.
* **`.vscode/settings.json`**: Configures the IDE's Python extension path resolution to clear import warnings.

### Frontend (`aivoa-crm/frontend/`)
* **`package.json`**: Manages packages and build scripts (React, Redux, MUI, Recharts, Framer Motion).
* **`vite.config.js`**: Configures the Vite bundler and acts as a reverse proxy for all API requests to bypass CORS issues.
* **`index.html`**: Root html containing Google Font integrations for the **Inter** typeface.
* **`src/main.jsx`**: Bootloader. Instantiates React and configures a global Axios request interceptor to append JWT Bearer headers automatically.
* **`src/index.css`**: Configures global variables, custom scrollbars, and helper classes (glassmorphism overlays, shimmer animations).
* **`src/theme.js`**: Defines the light/dark Material-UI themes, typography weights, curated teal/indigo colors, and button gradients.
* **`src/App.jsx`**: Manages main routing, authentication guard redirects, and light/dark theme providers.
* **`src/store/store.js`**: Aggregates auth, interaction, and chat state slices.
* **`src/store/authSlice.js`**: Stores session tokens, handles logins, and performs logouts.
* **`src/store/interactionSlice.js`**: Holds lists of doctor interactions, weekly executive summaries, and pending followups.
* **`src/store/chatSlice.js`**: Keeps message histories and registers AI-extracted forms payload drafts.
* **`src/components/Layout.jsx`**: Layout frame containing side navigation, responsive actions, and profile settings.
* **`src/components/InteractionForm.jsx`**: Structured log form with change managers and automatic pre-filling hooks tied to the Redux chat state.
* **`src/components/ChatWindow.jsx`**: AI chat panel displaying dialogue balloons and typing indicators.
* **`src/pages/Login.jsx`**: Glassmorphic login portal with pre-loaded demo credentials.
* **`src/pages/Dashboard.jsx`**: Executive dashboard displaying KPIs, Recharts charts, and AI-compiled weekly narratives.
* **`src/pages/LogInteraction.jsx`**: Coordination panel rendering the form and chat window side-by-side.

### Backend (`aivoa-crm/backend/`)
* **`requirements.txt`**: Manages package dependencies (FastAPI, SQLAlchemy, LangGraph, LangChain, Groq).
* **`.env`**: Stores local backend configurations.
* **`run.py`**: Startup wrapper loading uvicorn configurations.
* **`app/__init__.py`**: Exposes the app folder.
* **`app/app.py`**: Configures the FastAPI core, handles tables initialization, runs the default database seeder, and hooks routers.
* **`app/database.py`**: Manages SQLAlchemy DB connections and exposes the `get_db` dependency.
* **`app/models/`**: SQL database models:
  * **`user.py`**: Users table holding hashed login credentials.
  * **`doctor.py`**: Doctors table containing clinic/hospital details.
  * **`interaction.py`**: Doctor meetings table.
* **`app/schemas/`**: Pydantic schemas validating payload shapes:
  * **`auth.py`**: Login request and response structures.
  * **`doctor.py`**: Doctor creation schemas.
  * **`interaction.py`**: Forms validations and response serialization rules.
* **`app/services/`**: Core utilities:
  * **`db_service.py`**: Implements queries, password hashing via native `bcrypt`, and initial seeder datasets.
  * **`auth_service.py`**: Implements JWT signature signing, verification, and authentication dependencies.
* **`app/routers/`**: REST endpoint definitions:
  * **`auth.py`**: Defines `/api/login`.
  * **`interaction.py`**: Defines `/api/interaction` (POST, PUT, GET).
  * **`misc.py`**: Defines `/api/summary` (AI summary) and `/api/followups` (pending lists).
  * **`chat.py`**: Defines `/api/chat` (LangGraph agent interface).
* **`app/agent/`**: AI Copilot engine:
  * **`state.py`**: Defines the TypedDict state dictionary for the LangGraph agent.
  * **`prompts.py`**: Outlines system prompts for routing and validation tasks.
  * **`graph.py`**: Compiles nodes (Intent, Tool execution, LLM Validation, Database Saves, Response formatting).
  * **`tools/`**: Modular tool files:
    * **`log_interaction.py`**: Inserts a new HCP meeting log.
    * **`edit_interaction.py`**: Finds and updates existing logs.
    * **`search_history.py`**: Retrieves recent physician check-ins.
    * **`today_followups.py`**: Returns active, scheduled tasks.
    * **`weekly_summary.py`**: Compiles weekly summaries via Groq LLM.

---

## Installation Guide

### Prerequisites
- Python 3.13+
- Node.js v24+
- npm v11+
- Groq API Key

### Setup Backend
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd aivoa-crm/backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` to `.env` and fill in your `GROQ_API_KEY`:
   ```bash
   copy .env.example .env
   ```

### Setup Frontend
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd aivoa-crm/frontend
   ```
2. Install the Node modules:
   ```bash
   npm install
   ```

---

## Environment Variables

The backend relies on the `.env` file containing:

```env
# FastAPI Configurations
PORT=8000
HOST=127.0.0.1

# Database Configuration (SQLite default, supports MySQL & PostgreSQL)
DATABASE_URL=sqlite:///./crm.db

# Groq API Configuration
GROQ_API_KEY=gsk_your_actual_groq_api_key_here

# JWT Signature Security
JWT_SECRET=super_secret_jwt_sign_key_for_session_token_123456
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

---

## Running the Application

### 1. Start the Backend API
From the `aivoa-crm/backend` directory, run:
```bash
python run.py
```
This initializes the SQLite database (`crm.db`), creates tables, seeds a demo account, and starts the server on `http://localhost:8000`.

### 2. Start the Frontend Server
From the `aivoa-crm/frontend` directory, run:
```bash
npm run dev
```
Open your browser and navigate to **`http://localhost:3000`**.

### 3. Log In to the Portal
Use the pre-filled demo credentials:
- **Email**: `agent@aivoa.ai`
- **Password**: `password123`

---

## API Documentation

FastAPI automatically generates interactive documentation. Once the backend server is running, navigate to:
* **Swagger UI Docs**: `http://localhost:8000/docs`
* **Redoc UI Docs**: `http://localhost:8000/redoc`

### Exposed Endpoints
- **`POST /api/login`**: Authenticates user and returns JWT bearer token.
- **`GET /api/interaction`**: Returns a list of all logged interactions.
- **`POST /api/interaction`**: Creates a new interaction manually.
- **`PUT /api/interaction/{id}`**: Updates details of a logged interaction.
- **`GET /api/summary`**: Generates a weekly executive summary paragraph using LLM.
- **`GET /api/followups`**: Lists all pending follow-up schedules.
- **`POST /api/chat`**: Conversational interface linked directly to the LangGraph agent.

---

## LangGraph Agent Implementation

The AI Copilot uses a **LangGraph StateGraph** to manage multi-step reasoning.

### Intent Detection
The model checks the query and conversational logs to classify the request into one of six routes: `log_interaction`, `edit_interaction`, `search_history`, `today_followups`, `weekly_summary`, or generic `chat`.

### Executing Tools
The agent has access to 5 custom tools:
1. **Log Interaction Tool**: Gathers arguments and logs meetings.
2. **Edit Interaction Tool**: Finds recent logs by doctor name and updates them.
3. **Search History Tool**: Checks past physician logs.
4. **Today's Followups Tool**: Lists active tasks.
5. **Weekly Summary Tool**: Reads the last 7 days of logs and calls Groq to compile a bulleted executive paragraph.

### LLM Validation
If logging or editing, the validation node runs. It checks for mandatory variables (`doctor_name`, `hospital`, `summary`), parses relative dates (e.g. *"next Monday"* or *"today"*), and returns validation state flags. If fields are missing, the validation node blocks saving and prompts the user for details.

### Save Database
If validation passes, the agent runs the DB seeder to persist records in SQLite, returning form pre-fill parameters directly to the frontend.

---

## Future Improvements

1. **Voice-to-Text Logging**: Allow medical representatives to log visits by speaking directly into a microphone on the dashboard using Web Speech APIs.
2. **Offline Mode**: Cache pending interaction logs in IndexedDB if the representative loses internet connectivity, syncing with the database once online.
3. **Email Follow-up Templates**: Automatically draft professional follow-up emails for the physician based on products discussed during the meeting.
