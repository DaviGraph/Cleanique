import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './features/booking/pages/HomePage';
import { BookingPage } from './features/booking/pages/BookingPage';
import { BookingStatusPage } from './features/booking/pages/BookingStatusPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking/:reference" element={<BookingStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
