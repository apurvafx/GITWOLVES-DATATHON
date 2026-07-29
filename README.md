# Karnataka State Police CrimePilot Command Hub

The Karnataka State Police (KSP) CrimePilot Command Hub is a web-based portal developed for the State Crime Record Bureau (SCRB). The system provides state investigators, analysts, and policymakers with real-time geospatial crime mapping, 3D syndicate correlation graphs, interactive AI copilot querying, and offender risk analysis.

The platform is designed to run securely locally and is engineered for production deployment on the Zoho Catalyst cloud ecosystem.

---

## Technical Stack

The application is built using a modern, decoupled web architecture:

### Frontend
- **Framework**: React 19 (TypeScript) with Vite Build Engine
  - Badge: ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
- **Styling**: Tailwind CSS
  - Badge: ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- **3D Visualization**: React Three Fiber (Three.js Wrapper)
  - Badge: ![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
- **Geospatial Mapping**: React Leaflet (OpenStreetMap API)
  - Badge: ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=leaflet&logoColor=white)
- **Icons**: Lucide React
  - Badge: ![Lucide](https://img.shields.io/badge/Lucide-000000?style=for-the-badge&logo=lucide&logoColor=white)

### Backend
- **Framework**: FastAPI (Python 3.10+)
  - Badge: ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
- **Environment**: Python
  - Badge: ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
- **Data Validation**: Pydantic
  - Badge: ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
- **Cryptography**: Passlib (PBKDF2-SHA256 Hashing)
  - Badge: ![Cryptography](https://img.shields.io/badge/Cryptography-4B275F?style=for-the-badge&logo=openssl&logoColor=white)

### Database and Infrastructure
- **Database**: SQLite (Relational Data Store)
  - Badge: ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
- **Hosting**: Zoho Catalyst AppSail (Serverless Python Node Environment)
  - Badge: ![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-F04A24?style=for-the-badge&logo=zoho&logoColor=white)

---

## Core Features

1. **Analytical Command Dashboard**: Aggregates state-wide statistics, live incident timelines, and crime head distributions. Supports generating and exporting formal FIR dossier PDF sheets.
2. **Crime Mapper (GIS)**: Renders coordinates using Leaflet tiles, highlighting active spatiotemporal hotspot buffers and clusters based on customizable category filters.
3. **Syndicate Link (3D Node Graph)**: Renders interactive WebGL-based relationship systems mapping transactions, communication connections, and accomplice hierarchies between criminal offenders and bank nodes.
4. **Investigator Copilot**: A secure Retrieval-Augmented Generation (RAG) assistant allowing officers to submit natural language inquiries in both English and Kannada to extract database entities.
5. **Offender Hub**: Tracks historical case records, heinous offense volumes, and computes dynamic threat/recidivism scores.

---

## System Architecture

The following diagram illustrates the decoupled tier structure, detailing how the React frontend interacts with the FastAPI backend endpoints, safety layers, and database.

```mermaid
graph TD
    subgraph Client ["Client Tier (React Frontend)"]
        UI["Main UI Shell (App.tsx)"]
        Dash["Analytical Dashboard (Dashboard.tsx)"]
        MapC["GIS Hotspot Mapper (Mapper.tsx)"]
        Syn["3D Link Graph (Syndicate.tsx)"]
        Cop["Investigator Copilot (Copilot.tsx)"]
        Off["Offender Directory (OffenderHub.tsx)"]
    end

    subgraph API ["Application Tier (FastAPI Backend)"]
        RL["Rate Limiter Middleware"]
        AuthRoute["Auth Handler (/api/auth)"]
        CaseRoute["Case Manager (/api/cases)"]
        ChatRoute["AI Copilot RAG (/api/chat)"]
        WSRoute["Live Dispatch Socket (/ws/alerts)"]
        SQLScan["SQL Safety Validator"]
    end

    subgraph Data ["Data Tier"]
        DB["SQLite Database (ksp_crime.db)"]
        Env["Environment Configuration (.env)"]
    end

    UI --> Dash
    UI --> MapC
    UI --> Syn
    UI --> Cop
    UI --> Off

    Dash --> CaseRoute
    MapC --> CaseRoute
    Syn --> CaseRoute
    Cop --> ChatRoute
    Off --> CaseRoute
    UI --> AuthRoute
    UI -.-> WSRoute

    AuthRoute --> Env
    AuthRoute --> DB
    CaseRoute --> DB
    ChatRoute --> SQLScan
    SQLScan --> DB
```

---

## Logical Data Flows

### 1. User Authentication and Session Management

This flowchart maps the security sequence executed when an officer logs into the portal:

```mermaid
graph TD
    Start["User Login Request"] --> RateLimit{"Rate Limiter Check (IP)"}
    RateLimit -- "Attempts > 5 per 15 min" --> Error429["Return HTTP 429 Too Many Requests"]
    RateLimit -- "Attempts <= 5" --> Validate{"Pydantic Payload Validation"}
    Validate -- "Malformed/Oversized" --> Error422["Return HTTP 422 Unprocessable Entity"]
    Validate -- "Valid Format" --> CheckCreds{"Hashed Password Matching"}
    CheckCreds -- "Incorrect Credentials" --> Error401["Return HTTP 401 Unauthorized"]
    CheckCreds -- "Authorized" --> TokenGen["JWT Access Token Generation"]
    TokenGen --> Response["Return JWT Token & User Metadata"]
```

### 2. Copilot Query RAG Execution and SQL Safety Checks

This flowchart illustrates the safety validation pipeline applied to natural language prompts translating to SQL statements:

```mermaid
graph TD
    Prompt["Officer Submits Chat Query"] --> PydanticChat{"Pydantic Schema Check"}
    PydanticChat -- "Invalid" --> ChatErr422["Return HTTP 422 Validation Error"]
    PydanticChat -- "Valid" --> LLMGen{"Initial SQL Query Formulation"}
    LLMGen --> SQLCheck{"SQL Safety Check (is_sql_query_safe)"}
    SQLCheck -- "Matches Forbidden Keywords (e.g., DROP, INSERT, sqlite_master)" --> Blocked["Reject Query & Return Safety Notice"]
    SQLCheck -- "Valid SELECT Query" --> ReadDB{"Execute Query on SQLite (Read-Only Mode)"}
    ReadDB --> Compile["Assemble Data Context"]
    Compile --> ResponseGen["Formulate Natural Language Explanation"]
    ResponseGen --> Output["Display Response to Investigator"]
```

---

## Screen Captures

Below are visual captures of the application pages located inside the repository:

### 1. Landing Page
Platform entry point showing features and information panels for officers.
![Landing Page Screen 1](assets/Screenshot%202026-07-26%20184033.png)
![Landing Page Screen 2](assets/Screenshot%202026-07-26%20184042.png)

### 2. Officer Authentication and Sign In
Secure authentication screen for official investigator accounts.
![Officer Authentication Page](assets/Screenshot%202026-07-26%20183909.png)

### 3. Command Hub Dashboard
Analytical overview displaying real-time metrics, recent cases list, and registration actions.
![Command Hub Dashboard](assets/Screenshot%202026-07-26%20183943.png)

### 4. Investigator AI Copilot
Natural language inquiry interface accepting structured database queries.
![Investigator AI Copilot](assets/Screenshot%202026-07-26%20183955.png)

### 5. GIS Spatiotemporal Crime Mapper
Geospatial interactive mapping workspace displaying cluster groups and heat zones.
![GIS Spatiotemporal Crime Mapper](assets/Screenshot%202026-07-26%20184013.png)

### 6. Syndicate Link and Offender Hub
Crime correlation workspace mapping connected criminal accomplices and threat levels.
![Syndicate Link and Offender Hub](assets/Screenshot%202026-07-26%20184024.png)

---

## Setup and Local Development Guide

### Prerequisites
- Python 3.10+
- Node.js (version 18 or higher)
- npm or yarn package manager

### 1. Backend Service Configuration
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create your local environmental configuration file:
   ```bash
   cp .env.example .env
   ```
5. Edit `.env` to supply your private configurations (such as your `GEMINI_API_KEY`).
6. Start the FastAPI server:
   ```bash
   uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

### 2. Frontend Development Server
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Launch the local development dev server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local address displayed in the terminal output (typically `http://localhost:5173`).

---

## Deployment Guide (Zoho Catalyst AppSail)

The application is structured to be packaged and deployed directly to Zoho Catalyst AppSail.

### Preparation and Build
Before triggering deployment, the frontend source files must be compiled and embedded inside the backend server structure so they can be hosted statically by the FastAPI production node:

1. Navigate to the frontend workspace:
   ```bash
   cd frontend
   ```
2. Build the optimized production bundle:
   ```bash
   npm run build
   ```
3. Copy the compiled assets from `frontend/dist/` into the `backend/frontend/dist/` folder:
   ```bash
   # On Windows (PowerShell):
   Copy-Item -Path "dist/*" -Destination "../backend/frontend/dist" -Recurse -Force
   
   # On macOS/Linux:
   cp -r dist/* ../backend/frontend/dist/
   ```

### Deploying via CLI
1. Ensure the Zoho Catalyst CLI is installed globally:
   ```bash
   npm install -g zcatalyst-cli
   ```
2. Authenticate the CLI with your Zoho account:
   ```bash
   catalyst login
   ```
3. Run the deployment command from the project root workspace directory, passing your active Project ID:
   ```bash
   catalyst deploy -p 48893000000013024
   ```
4. Once completed successfully, the CLI will output your live public AppSail URL.

---

## Production Security Measures

- **Rate Limiting**: Integrated middleware tracks client IPs to enforce a maximum of 5 auth attempts per 15 minutes on `/api/auth/login` and 100 requests per minute elsewhere.
- **SQL Sanitization**: Intercepts generated prompts to block schema extraction keywords, forcing read-only SQLite executions.
- **Payload Boundaries**: All route payloads are validated via Pydantic model limits, and strings are HTML-escaped to protect against Cross-Site Scripting (XSS).
- **Credential Hashing**: User passwords are encrypted on application start using PBKDF2-SHA256 contexts, preventing plaintext matching in memory.