<div align="center">

# KSP CrimePilot — Command Hub

**A state-level intelligence platform for the Karnataka State Police SCRB**

Real-time geospatial crime mapping, 3D syndicate correlation graphs,
AI-powered investigator queries, and offender threat analytics — unified under one secure command interface.

<br/>

[![Live Deployment](https://img.shields.io/badge/Live%20Deployment-AppSail-F04A24?style=for-the-badge&logo=zoho&logoColor=white)](https://ksp-crimepilot-50044361086.development.catalystappsail.in)
![Status](https://img.shields.io/badge/Status-Active-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-Restricted-0f172a?style=for-the-badge)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Platform Modules](#platform-modules)
- [System Architecture](#system-architecture)
- [Security Architecture](#security-architecture)
- [Screen Captures](#screen-captures)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Security Implementation](#security-implementation)

---

## Overview

The KSP CrimePilot Command Hub is a web-based intelligence portal built for the **State Crime Record Bureau (SCRB)** of Karnataka. It consolidates fragmented investigative workflows into a single secure, role-gated interface accessible to Investigators, Station House Officers, and District Superintendents.

The platform is engineered on a decoupled architecture — a React 19 TypeScript frontend served as a static bundle through a hardened FastAPI Python backend, deployed to the Zoho Catalyst AppSail serverless runtime.

| Attribute         | Detail                                              |
|-------------------|-----------------------------------------------------|
| Target Users      | KSP Investigators, SHOs, District SPs, Analysts    |
| Authentication    | JWT Bearer tokens with PBKDF2-SHA256 hashed credentials |
| Database          | SQLite (read-only AI access mode)                  |
| Deployment Target | Zoho Catalyst AppSail — Python Serverless           |
| Responsiveness    | Fully responsive across mobile, tablet, and desktop |

---

## Technology Stack

### Frontend

| Technology | Role |
|---|---|
| ![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB) | UI framework with TypeScript |
| ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white) | Build engine and dev server |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Utility-first styling system |
| ![Three.js](https://img.shields.io/badge/Three.js-000000?style=flat-square&logo=three.js&logoColor=white) | WebGL 3D visualization via React Three Fiber |
| ![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white) | Geospatial tile rendering via React Leaflet |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Static typing across the full frontend |
| ![Lucide](https://img.shields.io/badge/Lucide_Icons-000000?style=flat-square&logo=lucide&logoColor=white) | Icon library |

### Backend

| Technology | Role |
|---|---|
| ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi&logoColor=white) | High-performance async REST API framework |
| ![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white) | Server-side runtime |
| ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat-square&logo=pydantic&logoColor=white) | Request payload validation and schema enforcement |
| ![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat-square&logo=sqlite&logoColor=white) | Embedded relational database |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Session tokens for role-based access control |
| ![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=flat-square&logo=google&logoColor=white) | LLM for natural language to SQL translation |

### Infrastructure

| Technology | Role |
|---|---|
| ![Zoho Catalyst](https://img.shields.io/badge/Zoho_Catalyst-F04A24?style=flat-square&logo=zoho&logoColor=white) | AppSail serverless Python hosting |
| ![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white) | Source control and CI/CD pipeline |

---

## Platform Modules

| Module | Description | Access Level |
|---|---|---|
| **Command Hub Dashboard** | Real-time statistics, FIR timelines, district crime distribution, case registration, and PDF export | Investigator, SHO, SP |
| **Investigator AI Copilot** | RAG-powered natural language query engine supporting English and Kannada inputs | All roles |
| **Spatiotemporal Crime Mapper** | Leaflet-based GIS interface with hotspot radius buffers, category filters, and year slider | All roles |
| **Syndicate Link Graph** | Interactive 3D WebGL node network visualizing offender-account-crime relationships | SHO, SP only |
| **Offender Hub** | Threat scoring engine with recidivism risk analysis and accomplice linkage tracking | All roles |

---

## System Architecture

```mermaid
graph LR
    subgraph Browser["Client — React 19 TypeScript"]
        Shell["App Shell + Sidebar Navigation"]
        Dashboard["Command Hub Dashboard"]
        Copilot["Investigator AI Copilot"]
        Mapper["Spatiotemporal Crime Mapper"]
        Syndicate["Syndicate Link 3D Graph"]
        Offender["Offender Hub"]
    end

    subgraph Backend["FastAPI Python Backend"]
        RL["Rate Limiter Middleware"]
        Auth["/api/auth — JWT Issuer"]
        Cases["/api/cases — Case Manager"]
        Chat["/api/chat — RAG Copilot"]
        WS["/ws/alerts — Live Dispatch"]
        Safety["SQL Safety Validator"]
    end

    subgraph Data["Data Layer"]
        DB[("ksp_crime.db — SQLite")]
        Env[".env — Secrets Store"]
        Gemini["Google Gemini LLM API"]
    end

    Shell --> Auth
    Shell -.->|WebSocket| WS
    Dashboard --> Cases
    Copilot --> Chat
    Mapper --> Cases
    Syndicate --> Cases
    Offender --> Cases

    RL --> Auth
    RL --> Cases
    RL --> Chat

    Auth --> Env
    Auth --> DB
    Cases --> DB
    Chat --> Safety
    Safety --> DB
    Chat --> Gemini
```

---

## Security Architecture

### Authentication Flow

```mermaid
graph TD
    A["POST /api/auth/login"] --> B{"Rate Limiter\n5 attempts / 15 min per IP"}
    B -- "Limit Exceeded" --> C["HTTP 429 — Retry-After header"]
    B -- "Within Limit" --> D{"Pydantic Schema Validation\nmax 50 chars, alphanumeric only"}
    D -- "Malformed Payload" --> E["HTTP 422 — Unprocessable Entity"]
    D -- "Valid Payload" --> F{"PBKDF2-SHA256\nPassword Verification"}
    F -- "No Match" --> G["HTTP 401 — Unauthorized"]
    F -- "Verified" --> H["Sign JWT Token — HS256"]
    H --> I["HTTP 200 — Token + Role Metadata"]
```

### AI Copilot Safety Pipeline

```mermaid
graph TD
    A["Officer Submits Natural Language Query"] --> B{"Pydantic Validation\nmax 500 chars"}
    B -- "Invalid" --> C["HTTP 422 — Rejected"]
    B -- "Valid" --> D["Google Gemini LLM\nNatural Language to SQL"]
    D --> E{"SQL Safety Scan\nis_sql_query_safe"}
    E -- "Forbidden: DROP / INSERT /\nUPDATE / sqlite_master / PRAGMA" --> F["Query Blocked — Safety Notice Returned"]
    E -- "Clean SELECT Statement" --> G["SQLite Read-Only Connection\nmode=ro URI"]
    G --> H["Results Compiled"]
    H --> I["Gemini Formats Natural Language Response"]
    I --> J["Response Displayed to Investigator"]
```

---

## Screen Captures

### Landing Page

<table>
  <tr>
    <td><img src="assets/Screenshot 2026-07-26 184033.png" alt="Landing Page View 1"/></td>
    <td><img src="assets/Screenshot 2026-07-26 184042.png" alt="Landing Page View 2"/></td>
  </tr>
</table>

---

### Command Hub Dashboard

The central analytics workspace. Displays total registered FIRs, active investigation counts, resolution rates, and tracked financial trails. Officers with Investigator or SHO clearance can register new cases and export official FIR PDFs directly from this panel.

![Command Hub Dashboard](assets/Screenshot%202026-07-26%20183955.png)

---

### Investigator AI Copilot

A Retrieval-Augmented Generation interface backed by the Google Gemini LLM. Accepts queries in both English and Kannada, translates them to parameterized SQL, runs them against a read-only database connection, and returns structured natural language responses. All generated queries pass through the `is_sql_query_safe` validator before execution.

![Investigator AI Copilot](assets/Screenshot%202026-07-26%20184013.png)

---

### Spatiotemporal Crime Mapper

An interactive Leaflet.js map rendering all case coordinates as classified markers. Supports district and crime category filtering, a temporal year-range slider, and toggleable hotspot radius buffers that visually surface high-density crime clusters.

![Spatiotemporal Crime Mapper](assets/Screenshot%202026-07-26%20184024.png)

---

### Syndicate Link — 3D Relationship Graph

A Three.js WebGL canvas rendering the full criminal network as an interactive node graph. Nodes represent accused persons, bank accounts, and case entities. Edges map transaction trails and accomplice relationships. Officers can orbit, zoom, and click-select individual nodes to inspect their profile and connections. Access is restricted to SHO clearance and above.

![Syndicate Link 3D Graph](assets/Screenshot%202026-07-26%20183909.png)

---

### Offender Hub

A searchable directory of all tracked offenders with dynamically computed threat scores, recidivism risk classifications (Moderate / High / Critical), heinous offense counts, and accomplice linkage statistics. Selecting an offender renders their full threat profile alongside historical case participation charts.

![Offender Hub](assets/Screenshot%202026-07-26%20183943.png)

---

## Local Development

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- npm

### Backend

```bash
# Navigate to the backend directory
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY and JWT_SECRET_KEY

# Start the development server
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### Frontend

```bash
# In a separate terminal, navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Environment Variables Reference

| Variable | Description | Required |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for the AI Copilot | Yes |
| `JWT_SECRET_KEY` | Secret key for signing JWT access tokens | Yes |
| `ADMIN_PASSWORD` | Hashed password for admin-level accounts | Yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins | Yes |

---

## Production Deployment

### Build and Sync

```bash
# Step 1 — Build the production bundle
cd frontend
npm run build

# Step 2 — Copy compiled assets into the backend static serving directory
# Windows (PowerShell)
Copy-Item -Path "dist/*" -Destination "../backend/frontend/dist" -Recurse -Force

# macOS / Linux
cp -r dist/* ../backend/frontend/dist/
```

### Deploy to Zoho Catalyst AppSail

```bash
# Install the Catalyst CLI globally if not already installed
npm install -g zcatalyst-cli

# Authenticate with your Zoho account
catalyst login

# Deploy to your project (replace with your Project ID)
catalyst deploy -p 48893000000013024
```

The CLI will output your live AppSail URL upon successful deployment.

---

## Security Implementation

| Layer | Mechanism | Detail |
|---|---|---|
| **Rate Limiting** | Custom Starlette middleware | Max 5 auth attempts per 15 minutes per IP; 100 requests per minute on all other routes |
| **Input Validation** | Pydantic v2 schema models | Max field lengths, alphanumeric character constraints, HTML escape on all string inputs |
| **Password Security** | PBKDF2-SHA256 via Passlib | Passwords hashed on server startup; never compared in plaintext |
| **SQL Injection** | `is_sql_query_safe` validator | Blocks DROP, INSERT, UPDATE, DELETE, PRAGMA, sqlite_master, and nested statements |
| **Database Access** | Read-only URI mode | AI-generated queries execute against `mode=ro` SQLite connections only |
| **Session Tokens** | JWT HS256 signed tokens | Role embedded in payload; verified on every protected route |
| **XSS Protection** | `html.escape()` on all inputs | Applied server-side before any string is persisted or reflected |
| **Secret Management** | `.env` file excluded from Git | Credentials never committed; `.env.example` provided as a safe template |