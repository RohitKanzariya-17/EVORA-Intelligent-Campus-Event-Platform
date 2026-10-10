import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Public Pages
import { Landing } from '../pages/Landing';
import { BrowseEvents } from '../pages/BrowseEvents';
import { EventDetails } from '../pages/EventDetails';
import { Login } from '../pages/Login';
import { Register } from '../pages/Register';
import { About } from '../pages/About';

// Student Pages
import { StudentDashboard } from '../pages/StudentDashboard';
import { MyRegistrations } from '../pages/MyRegistrations';
import { MyQRTickets } from '../pages/MyQRTickets';
import { StudentFeedback } from '../pages/StudentFeedback';
import { EventPassport } from '../pages/EventPassport';
import { HackathonTeams } from '../pages/HackathonTeams';
import { StudentNotifications } from '../pages/StudentNotifications';

// Organizer Pages
import { OrganizerDashboard } from '../pages/OrganizerDashboard';
import { CreateEvent } from '../pages/CreateEvent';
import { EditEvent } from '../pages/EditEvent';
import { ManageEvents } from '../pages/ManageEvents';
import { QRScanner } from '../pages/QRScanner';
import { AttendanceReports } from '../pages/AttendanceReports';
import { EventSessions } from '../pages/EventSessions';
import { LiveCrowdMonitor } from '../pages/LiveCrowdMonitor';
import { CertificateManagement } from '../pages/CertificateManagement';

// Public Verification Page
import { VerifyCertificate } from '../pages/VerifyCertificate';

// Admin Pages
import { AdminDashboard } from '../pages/AdminDashboard';
import { UserManagement } from '../pages/UserManagement';
import { EventManagement } from '../pages/EventManagement';
import { PlatformAnalytics } from '../pages/PlatformAnalytics';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/events" element={<BrowseEvents />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-certificate/:certificateId" element={<VerifyCertificate />} />
      </Route>

      {/* Student Protected Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="registrations" element={<MyRegistrations />} />
        <Route path="tickets" element={<MyQRTickets />} />
        <Route path="passport" element={<EventPassport />} />
        <Route path="notifications" element={<StudentNotifications />} />
        <Route path="teams" element={<HackathonTeams />} />
        <Route path="feedback" element={<StudentFeedback />} />
      </Route>

      {/* Organizer Protected Routes */}
      <Route
        path="/organizer"
        element={
          <ProtectedRoute allowedRoles={['organizer', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OrganizerDashboard />} />
        <Route path="create-event" element={<CreateEvent />} />
        <Route path="edit-event/:id" element={<EditEvent />} />
        <Route path="manage-events" element={<ManageEvents />} />
        <Route path="sessions" element={<EventSessions />} />
        <Route path="scanner" element={<QRScanner />} />
        <Route path="live-monitor" element={<LiveCrowdMonitor />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="reports" element={<AttendanceReports />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="events" element={<EventManagement />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="certificates" element={<CertificateManagement />} />
        <Route path="sessions" element={<EventSessions />} />
        <Route path="live-monitor" element={<LiveCrowdMonitor />} />
        <Route path="scanner" element={<QRScanner />} />
        <Route path="reports" element={<AttendanceReports />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
