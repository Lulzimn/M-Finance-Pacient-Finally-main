# M-Dental Financial Management System - PRD

## Original Problem Statement
Aplikacion profesional për menaxhimin financiar për kompaninë M-Dental.

## Core Features Implemented
- ✅ Google OAuth Authentication (Emergent Auth)
- ✅ Role-based access control (Admin/Staff/Pending)
- ✅ First user becomes Admin, new users need approval
- ✅ Patient CRUD with mobile responsive design
- ✅ Invoice CRUD with professional print functionality
- ✅ Appointments with SendGrid email notifications
- ✅ Cash Inflows/Outflows tracking (MKD/EUR)
- ✅ Configurable exchange rate
- ✅ Dashboard with charts
- ✅ Monthly reports with Excel export
- ✅ Activity logs (audit trail)
- ✅ M-Dental custom logo
- ✅ Admin can approve/reject/delete users
- ✅ Albanian language UI

## Access Control
- **Admin** (/admin/*): Full access to all features
- **Staff** (/staff/*): Patients, Appointments, Invoices only
- **Pending**: Waiting for admin approval

## Email Integration
- Provider: SendGrid
- Features: Appointment notifications to patients

## Architecture
- Frontend: React + Tailwind CSS + Shadcn/UI + Recharts
- Backend: FastAPI + Motor (async MongoDB)
- Database: MongoDB
- Auth: Emergent Google OAuth
- Email: SendGrid

## Last Updated: January 6, 2026
