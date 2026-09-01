# Employee Attendance Management System

Full-stack MERN application built for the MT-Developer Assignment (Inner Eye Consultancy Services LLP).

## Features implemented

- **Employee Login & Registration** — JWT auth, bcrypt password hashing, role-based accounts (`employee` / `hr`)
- **Attendance Check-In / Check-Out** — one click each, timestamps stored server-side
- **Working Hours Calculation** — computed automatically from check-in/check-out timestamps
- **Leave Deduction Calculation** — HR can pick an employee + month and get unpaid leave days, per-day salary rate, and deduction amount (configurable paid-leave allowance)
- **HR Dashboard** — org-wide stats (present/absent/on-leave today, pending requests), full employee list, full attendance log, leave approval/rejection, leave-deduction calculator
- **Employee Dashboard** — personal check-in/out, monthly hours & present-day summary, attendance history, leave application form, leave history
- **Attendance Status Tracking** — `Present`, `Late`, `Half Day`, `Absent`, `On Leave` derived automatically from working hours / approved leave

## Tech stack

- **Backend**: Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs
- **Frontend**: React 18 (Vite), React Router, Axios, plain CSS (no framework dependency)

## Project structure

```
attendance-system/
├── backend/
│   ├── config/db.js            # MongoDB connection
│   ├── models/                 # User, Attendance, Leave (Mongoose schemas)
│   ├── middleware/auth.js      # JWT protect + HR-only guard
│   ├── routes/                 # auth, attendance, leave, dashboard
│   ├── utils/helpers.js        # working-hours calc, leave-deduction calc, date helpers
│   ├── seed.js                 # demo data script
│   ├── server.js               # app entry point
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js        # API client with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── components/         # Navbar, ProtectedRoute, StatusBadge
    │   ├── pages/               # Login, Register, EmployeeDashboard, HRDashboard
    │   ├── App.jsx / main.jsx / index.css
    └── .env.example
```

## Setup instructions

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then edit MONGO_URI / JWT_SECRET if needed
npm run seed               # optional: creates demo HR + 2 employee accounts
npm run dev                 # starts API on http://localhost:5000
```

Demo accounts created by `npm run seed`:
| Role     | Email               | Password    |
|----------|---------------------|-------------|
| HR       | hr@company.com      | HrAdmin@123 |
| Employee | john@company.com    | JohnDev@123 |
| Employee | priya@company.com   | PriyaUX@123 |

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env       # VITE_API_URL=http://localhost:5000/api
npm run dev                 # starts app on http://localhost:5173
```

Open `http://localhost:5173`, register a new account (or use a seeded demo account above) and log in.

## Database

No manual database scripts are required — Mongoose creates collections (`users`, `attendances`, `leaves`) automatically on first write, based on the schemas in `backend/models/`. `backend/seed.js` is provided purely to pre-populate demo accounts for quick evaluation.

## Key calculation logic (backend/utils/helpers.js)

- **Working hours** = `(checkOut - checkIn)` in decimal hours, rounded to 2 dp.
- **Status derivation**: `Absent` if 0 hours, `Half Day` if < 4 hrs, `Late` if < 7.5 hrs, else `Present`. Approved leave days are separately marked `On Leave`.
- **Leave deduction**: `unpaidDays = max(0, approvedLeaveDaysInMonth - PAID_LEAVES_PER_MONTH)`; `perDayRate = monthlySalary / 26`; `deduction = unpaidDays * perDayRate`. Thresholds are configurable via `.env`.

## API overview

| Method | Endpoint                             | Access    | Purpose                          |
|--------|---------------------------------------|-----------|-----------------------------------|
| POST   | /api/auth/register                    | Public    | Create account                    |
| POST   | /api/auth/login                       | Public    | Login, get JWT                    |
| GET    | /api/auth/me                          | Auth      | Current user                      |
| POST   | /api/attendance/checkin               | Auth      | Check in for today                |
| POST   | /api/attendance/checkout              | Auth      | Check out for today                |
| GET    | /api/attendance/me                    | Auth      | Own attendance + summary          |
| GET    | /api/attendance/today                 | Auth      | Today's record                    |
| GET    | /api/attendance/all                   | HR        | All employees' attendance         |
| POST   | /api/leave/apply                      | Auth      | Apply for leave                   |
| GET    | /api/leave/me                         | Auth      | Own leave history                 |
| GET    | /api/leave/all                        | HR        | All leave requests                |
| PUT    | /api/leave/:id/review                 | HR        | Approve / reject a leave request  |
| GET    | /api/leave/deduction/:employeeId      | HR        | Salary deduction calculator       |
| GET    | /api/dashboard/employee               | Auth      | Employee dashboard summary        |
| GET    | /api/dashboard/hr                     | HR        | HR dashboard summary               |
| GET    | /api/dashboard/employees              | HR        | List of employees                  |

## Notes / possible extensions

- Password reset flow, email notifications on leave approval/rejection
- Pagination on attendance/leave tables for large datasets
- Export attendance/leave reports to CSV/PDF
- Geofenced or IP-restricted check-in for stricter attendance validation
