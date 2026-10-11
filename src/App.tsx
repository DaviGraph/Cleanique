import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './features/booking/pages/HomePage';
import { BookingPage } from './features/booking/pages/BookingPage';
import { BookingStatusPage } from './features/booking/pages/BookingStatusPage';

// Admin imports
import { AdminLayout } from './features/admin/components/AdminLayout';
import { AdminRouteGuard } from './features/admin/components/AdminRouteGuard';
import { AdminLoginPage } from './features/admin/pages/AdminLoginPage';
import { AdminBookingsListPage } from './features/admin/pages/AdminBookingsListPage';
import { AdminBookingDetailPage } from './features/admin/pages/AdminBookingDetailPage';

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking/:reference" element={<BookingStatusPage />} />

        {/* Admin Login (Public for admins, no sign-up link) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRouteGuard>
              <AdminLayout />
            </AdminRouteGuard>
          }
        >
          <Route index element={<AdminBookingsListPage />} />
          <Route path="bookings/:id" element={<AdminBookingDetailPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
