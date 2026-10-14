import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './features/booking/pages/HomePage';
import { BookingPage } from './features/booking/pages/BookingPage';
import { BookingStatusPage } from './features/booking/pages/BookingStatusPage';
import { CartProvider } from './features/booking/context/CartContext';
import { CartDrawer } from './features/booking/components/CartDrawer';
import { FloatingCartButton } from './features/booking/components/FloatingCartButton';

// Admin imports
import { AdminLayout } from './features/admin/components/AdminLayout';
import { AdminRouteGuard } from './features/admin/components/AdminRouteGuard';
import { AdminLoginPage } from './features/admin/pages/AdminLoginPage';
import { AdminBookingsListPage } from './features/admin/pages/AdminBookingsListPage';
import { AdminBookingDetailPage } from './features/admin/pages/AdminBookingDetailPage';
import { AdminSettingsPage } from './features/admin/pages/AdminSettingsPage';

import './App.css';

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <CartDrawer />
        <FloatingCartButton />
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
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
