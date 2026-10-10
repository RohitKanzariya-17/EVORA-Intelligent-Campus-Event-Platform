# EVORA — Intelligent Campus Event Platform

**Code Carnival 3.0 Hackathon • Problem Statement PS-03**  
*A modern, high-concurrency, paperless event registration and cryptographic QR check-in platform engineered for college campuses.*

---

## 📌 Executive Overview

EVORA replaces the friction of traditional campus events—manual sign-up spreadsheets, lost paper passes, auditorium entry queues, overbooked venues, and inaccurate paper roll-calls—with a cohesive digital architecture:

1. **Self-Service Online Registration**: Real-time atomic seat reservations prevent venue overbooking even under high concurrent load.
2. **Cryptographic QR Passes**: Opaque 64-character unguessable passes containing **zero personal data**, verified against SHA-256 database hashes.
3. **Sub-Second Live Scanner**: Mobile camera or webcam QR scanning with instantaneous duplicate entry and wrong-event rejection.
4. **Offline Check-In (Standout Feature)**: Organizers download an event-specific encrypted ticket roster before entering connectivity dead-zones, queueing check-ins with idempotency keys and synchronizing on reconnect with collision detection.
5. **Actionable Analytics & CSV Exports**: Live turnout metrics, capacity tracking, and injection-protected CSV roster downloads for institutional audits.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Capabilities & Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Tailwind CSS, Lucide React, React Router v7, React Hook Form + Zod, Axios, Recharts, React Hot Toast |
| **QR Engine** | `html5-qrcode` & `qrcode` | Live webcam/phone camera recognition, error correction level H, manual fallback input |
| **Backend** | Node.js + Express + TypeScript | Modular architecture (`controllers`, `services`, `middleware`, `validators`, `models`), `tsx` |
| **Database** | MongoDB + Mongoose | Compound unique indexes (`studentId` + `eventId`), atomic capacity `$inc` operators |
| **Security** | JWT + bcryptjs + Helmet | Rate limiting, CORS origin isolation, spreadsheet formula-injection sanitization, SHA-256 hashing |

---

## 🏗️ Project Architecture & Directory Structure

```text
eventease/
├── client/                               # React + Vite Frontend
│   ├── src/
│   │   ├── components/                   # Navbar, Footer, Sidebar, StatusBadge, ConfirmationModal, Skeletons
│   │   ├── hooks/                        # useAuth hook and AuthProvider
│   │   ├── layouts/                      # PublicLayout, DashboardLayout
│   │   ├── pages/                        # Landing, BrowseEvents, EventDetails, Login, Register, About,
│   │   │                                 # StudentDashboard, MyRegistrations, MyQRTickets, StudentFeedback,
│   │   │                                 # OrganizerDashboard, CreateEvent, EditEvent, ManageEvents, QRScanner, AttendanceReports,
│   │   │                                 # AdminDashboard, UserManagement, EventManagement, PlatformAnalytics
│   │   ├── routes/                       # AppRoutes (Public, Student, Organizer, Admin route guards)
│   │   ├── services/                     # Axios client & typed API service methods
│   │   ├── types/                        # TypeScript domain model types
│   │   ├── utils/                        # Frontend helpers
│   │   ├── App.tsx                       # App component with router & auth context
│   │   ├── index.css                     # Tailwind directives & global styling
│   │   └── main.tsx                      # Vite React entry point
│   ├── .env.example                      # Client environment template
│   ├── package.json                      # Client dependencies & scripts
│   ├── tailwind.config.js                # Tailwind CSS design system configuration
│   └── vite.config.ts                    # Vite config with backend proxy on port 5000
│
├── server/                               # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                       # db.ts (Mongoose connection), env.ts (typed environment config)
│   │   ├── controllers/                  # auth, event, registration, checkin, admin, report, feedback controllers
│   │   ├── middleware/                   # auth.ts (JWT & roles), rateLimiter.ts, errorHandler.ts
│   │   ├── models/                       # User, Event, Registration, Feedback (Mongoose schemas & indexes)
│   │   ├── routes/                       # auth, event, registration, checkin, admin, report routes
│   │   ├── scripts/                      # seed.ts (realistic demo data), createAdmin.ts (safe initial admin)
│   │   ├── tests/                        # runTests.ts (automated test suite covering 16 scenarios)
│   │   ├── utils/                        # token.ts (HMAC derivation & hashing), csv.ts (formula injection protection)
│   │   ├── validators/                   # Zod schemas for auth, events, scans, sync, feedback
│   │   ├── app.ts                        # Express application configuration
│   │   └── index.ts                      # Server bootstrap & graceful shutdown
│   ├── .env.example                      # Server environment template
│   ├── package.json                      # Server dependencies & test scripts
│   └── tsconfig.json                     # Server TypeScript configuration
│
├── .gitignore                            # Root ignore file
└── README.md                             # Comprehensive technical documentation
```

---

## 🔐 Security & Engineering Core Rules

1. **Public Signup Creates Students Only**:
   The registration controller hardcodes `role: 'student'` and ignores any client-supplied role parameters. Organizers and Admins are granted elevated roles exclusively by platform administrators or the environment-driven `create-admin` script.
2. **Atomic Capacity Booking**:
   Concurrent seat bookings use MongoDB's atomic `$inc: { registeredCount: 1 }` operator conditioned on `$expr: { $lt: ['$registeredCount', '$capacity'] }` and `registrationDeadline: { $gt: new Date() }`. If a compound unique index constraint conflict occurs, the seat reservation counter is automatically rolled back.
3. **Privacy-Preserving QR Passes**:
   The QR code encodes **only** a 64-character unguessable cryptographic raw token. No passwords, student email addresses, or roll numbers are placed in QR payloads. The database stores strictly `SHA-256(rawToken)`, ensuring tickets cannot be forged even if a raw database dump is leaked.
4. **Server-Side Atomic Check-In**:
   Each scan validates that the ticket belongs to the active event, has not been cancelled, and is not already attended. Transitions from `Registered` to `Attended` are executed with an atomic `findOneAndUpdate`, blocking concurrent duplicate scans.
5. **Spreadsheet Formula Injection Protection**:
   All CSV exports sanitize cells starting with `=`, `+`, `-`, `@`, `\t`, or `\r` by prefixing them with a single quote (`'`), preventing malicious code execution in Excel or Google Sheets.

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested on Node v24.14.0)
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Git** & modern browser with webcam permissions

---

### 1. Clone & Setup Environment Variables

```bash
# Clone the repository
git clone <repo-url>
cd eventease
```

#### Server Configuration
Create `eventease/server/.env` (or copy from `.env.example`):
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/eventease
JWT_SECRET=super_secret_jwt_eventease_hackathon_2026_key_secure
JWT_EXPIRES_IN=7d
TICKET_SECRET=cryptographic_ticket_hmac_secret_key_998877_secure
CLIENT_URL=http://localhost:5173
ADMIN_NAME=System Administrator
ADMIN_EMAIL=admin@eventease.edu
ADMIN_PASSWORD=Password123!
```

#### Client Configuration
Create `eventease/client/.env` (or copy from `.env.example`):
```ini
VITE_API_URL=http://localhost:5000/api
```

---

### 2. Install Dependencies

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

---

### 3. Seed Database & Create Administrator

```bash
cd ../server

# Seed realistic demo data (Events, Students, Organizers, Attended Passes, Feedback)
npm run seed

# Create or verify initial Administrator account
npm run create-admin
```

---

### 4. Run Automated Backend Tests

The project includes an automated test runner executing against the live database:

```bash
npm run test
```

**Test Coverage (16 Scenarios Verified):**
- [x] 1. Register / login success
- [x] 2. Invalid login rejected (401)
- [x] 3. Unauthorized access blocked without token (401)
- [x] 4. Organizer creates event (201)
- [x] 5. Student cannot create event (Forbidden 403)
- [x] 6. Duplicate registration rejected (409 Conflict)
- [x] 7. Full event rejected when capacity reached (400)
- [x] 8. Post-deadline registration rejected (400)
- [x] 9. Valid QR check-in succeeds (200 OK)
- [x] 10. Invalid QR rejected (404/400)
- [x] 11. Second scan rejected (Duplicate check-in blocked)
- [x] 12. Cancelled registration cannot check in (400)
- [x] 13. Organizer cannot edit another organizer's event (403)
- [x] 14. Dashboard totals match database calculations
- [x] 15. CSV export is correct and sanitized against formula injection
- [x] 16. Offline sync handles conflict safely with zero duplicate entries

---

### 5. Start Development Servers

Open two terminal tabs:

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
# Server will start on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Vite client will start on http://localhost:5173
```

---

## 🔑 Demo Accounts & Credentials

The database seed script initializes ready-to-test accounts. Each account can be prefilled in 1 click using the **Demo Fill** buttons on the `/login` page:

| Role | Email Address | Password | Privileges |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@eventease.edu` | `Password123!` | Full platform stats, user role management, system-wide event control |
| **Organizer** | `sarah.organizer@eventease.edu` | `Password123!` | Create/edit events, view registrations, launch QR scanner, download CSV |
| **Organizer 2** | `marcus.organizer@eventease.edu` | `Password123!` | Manage secondary college events, test cross-organizer isolation |
| **Student** | `alex.student@eventease.edu` | `Password123!` | Register for events, view QR tickets, cancel bookings, submit feedback |
| **Student 2** | `priya.student@eventease.edu` | `Password123!` | Additional registered student for attendance verification |

---

## 📱 Testing the QR Scanner Flow

1. **Log in as Student** (`alex.student@eventease.edu`):
   - Go to **Browse Events** (`/events`).
   - Click on an open event (e.g. *Code Carnival Hackathon*) and click **Register Now**.
   - Your digital ticket with a live QR code will appear. You can also view it anytime under **My QR Tickets** (`/student/tickets`).
2. **Log in as Organizer** (`sarah.organizer@eventease.edu`):
   - Open **QR Scanner** (`/organizer/scanner`).
   - Allow camera permissions when prompted.
   - Hold your phone showing the student QR code to your computer camera (or copy the 64-character token and paste it into **Manual Token Fallback**).
   - **First Scan**: Scanner displays a **Green Verified State**, sounds an affirmative chime, and displays the attendee's name, department, and timestamp.
   - **Second Scan**: Scanner immediately displays a **Red Rejected State** stating duplicate check-in with the exact prior timestamp.

---

## 📡 Standout Feature: Offline Check-In Mode

College auditoriums, basements, and outdoor festival grounds frequently suffer from spotty WiFi and cellular dead zones. EventEase solves this with offline support:

1. **Download Offline Dataset**:
   Before heading into the venue, the organizer selects the event on `/organizer/scanner` and clicks **Download Offline Dataset**. The browser caches a minimal verification roster (`tokenHash`, `studentName`, `department`, `status`).
2. **Offline Scanning**:
   Toggle **Switch to Offline Mode** (or disconnect your network). When a QR ticket is scanned, the browser client computes `crypto.subtle.digest('SHA-256', token)` locally and checks it against the downloaded dataset.
3. **Local Queueing with Idempotency**:
   Valid offline scans are stored in a persistent local queue with a unique `idempotencyKey`, event ID, and scan timestamp.
4. **Cloud Synchronization**:
   Once reconnected, click **Sync Queued Scans**. The server atomically processes the batch via `POST /api/checkin/sync`, resolves any conflicts (e.g. if the attendee checked in online at another gate), and provides an audited summary breakdown.

> **Offline Mode Limitation Disclosure**:
> Offline verification relies on pre-downloaded rosters. If an attendee registers *after* the organizer downloads the offline pack and while the organizer is disconnected, their ticket will not be present in the local offline cache until a fresh sync occurs.

---

## 🚀 Deployment Guide

### Backend (Render, Railway, or VPS)
1. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `TICKET_SECRET`, `CLIENT_URL`).
2. Build command: `npm run build`
3. Start command: `node dist/index.js`
4. Set up an automated Atlas MongoDB replica set for transaction support.

### Frontend (Vercel, Netlify, or Cloudflare Pages)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Set environment variable: `VITE_API_URL=https://your-backend-api.com/api`
4. Add single-page application redirect rule (`/*` to `/index.html`).

---

## 📄 License & Attribution

Built for the **Code Carnival 3.0 Hackathon (Problem Statement PS-03)** by the development team. Distributed under the MIT License.
