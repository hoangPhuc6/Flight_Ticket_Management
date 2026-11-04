import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StaffLayout from '../layouts/StaffLayout';
import AdminLayout from '../layouts/AdminLayout';
import { ProtectedRoute } from '../components/ProtectedRoute';

// --- Staff Pages ---
import StaffDashboard from '../pages/Staff/StaffDashboard';
import FlightSchedulePage from '../pages/Staff/FlightSchedulePage';
import BookingPage from '../pages/Staff/BookingPage';
import BookingDetailPage from '../pages/Staff/BookingDetailPage';
import PromotionPage from '../pages/Staff/PromotionPage';
import CustomerSupportPage from '../pages/Staff/CustomerSupportPage';
import ProfilePage from '../pages/Staff/ProfilePage';
import RegulationsPage from '../pages/Staff/RegulationsPage';

// --- Customer Pages ---
import Homepage from '../pages/Customer/Homepage';
import SignIn from '../pages/Customer/SignIn';
import SignUp from '../pages/Customer/SignUp';
import CustomerProfile from '../pages/Customer/Profile';
import SearchResults from '../components/Customer/SearchResults';
import TicketInformation from '../components/Customer/TicketInformation';
import Payment from '../components/Customer/Payment';
import BookingSuccess from '../components/Customer/BookingSuccess';
import MyFlights from '../components/Customer/MyFlights';

// --- Admin Pages ---
import AdminDashboard from '../pages/Admin/Dashboard';
import FlightManage from '../pages/Admin/FlightManage';
import BookingManage from '../pages/Admin/BookingManage';
import AirportManage from '../pages/Admin/AirportManage';
import RouteManage from '../pages/Admin/RouteManage';
import AirlineManage from '../pages/Admin/AirlineManage';
import AirplaneManage from '../pages/Admin/AirplaneManage';
import AirplaneModelManage from '../pages/Admin/AirplaneModelManage';
import TicketClassManage from '../pages/Admin/TicketClassManage';
import VoucherManage from '../pages/Admin/VoucherManage';
import UserManage from '../pages/Admin/UserManage';
import RegulationManage from '../pages/Admin/RegulationManage';
import AdminProfile from '../pages/Admin/Profile';

const RootRoute = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (user?.role === 'STAFF') {
    return <Navigate to="/staff/dashboard" replace />;
  }
  return <Homepage />;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Customer Routes (Protected) */}
        {/* Customer */}
        <Route
            path="/customer/home"
          element={
          <ProtectedRoute allowedRoles={['CUSTOMER']}>
          <Homepage />
          </ProtectedRoute>
          
      }
    />

  <Route
    path="/customer/flight-results"
    element={<SearchResults />}
  />
  <Route
  path="/customer/booking-success"
  element={
      <ProtectedRoute allowedRoles={['CUSTOMER']}>
        <BookingSuccess />
      </ProtectedRoute>
    }
/>
  <Route
  path="/customer/booking-details"
  element={
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <TicketInformation />
    </ProtectedRoute>
  }
/>
  <Route
  path="/customer/payment"
  element={
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <Payment />
    </ProtectedRoute>
  }
/>
  <Route
    path="/customer/my-flights"
  element={
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <MyFlights />
    </ProtectedRoute>
  }
/>

  <Route
    path="/customer/profile"
    element={
      <ProtectedRoute allowedRoles={['CUSTOMER', 'STAFF', 'ADMIN']}>
        <CustomerProfile />
      </ProtectedRoute>
    }
  />
  <Route
    path="/profile"
    element={<Navigate to="/customer/profile" replace />}
  />

        {/* Staff Routes (Protected) */}
        <Route
          path="/staff"
          element={
            <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="flight-schedule" element={<FlightSchedulePage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="booking/:id" element={<BookingDetailPage />} />
          <Route path="promotion" element={<PromotionPage />} />
          <Route path="customer-support" element={<CustomerSupportPage />} />
          <Route path="personal-info" element={<ProfilePage />} />
          <Route path="regulations" element={<RegulationsPage />} />
        </Route>

        {/* Admin Routes (Protected) - với AdminLayout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="flight-schedule" element={<FlightManage />} />
          <Route path="bookings" element={<BookingManage />} />
          <Route path="airports" element={<AirportManage />} />
          <Route path="routes" element={<RouteManage />} />
          <Route path="airlines" element={<AirlineManage />} />
          <Route path="airplanes" element={<AirplaneManage />} />
          <Route path="airplane-models" element={<AirplaneModelManage />} />
          <Route path="ticket-classes" element={<TicketClassManage />} />
          <Route path="vouchers" element={<VoucherManage />} />
          <Route path="staff" element={<UserManage />} />
          <Route path="regulations" element={<RegulationManage />} />
          {/* Redirect legacy paths */}
          <Route path="booking" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="profile" element={<AdminProfile />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
        <Route
    path="*"
    element={<Navigate to="/customer/home" replace />}
  />
      </Routes>
    </Router>
  );
}

export default AppRoutes;