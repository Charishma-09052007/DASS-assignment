import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import PrivateRoute from "./routes/PrivateRoute";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/participant/Dashboard";
import BrowseEvents from "./pages/participant/BrowseEvents";
import ClubsList from "./pages/participant/ClubsList";
import Profile from "./pages/participant/Profile";

import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import CreateEvent from "./pages/organizer/CreateEvent";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageClubs from "./pages/admin/ManageClubs";
import PasswordResetRequests from "./pages/admin/PasswordResetRequests";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={
            <PrivateRoute allowedRoles={["participant","organizer","admin"]}>
              <Dashboard />
            </PrivateRoute>
          } />

          <Route path="/browse-events" element={
            <PrivateRoute allowedRoles={["participant"]}>
              <BrowseEvents />
            </PrivateRoute>
          } />

          <Route path="/clubs" element={
            <PrivateRoute allowedRoles={["participant"]}>
              <ClubsList />
            </PrivateRoute>
          } />

          <Route path="/profile" element={
            <PrivateRoute allowedRoles={["participant","organizer"]}>
              <Profile />
            </PrivateRoute>
          } />

          <Route path="/organizer/dashboard" element={
            <PrivateRoute allowedRoles={["organizer"]}>
              <OrganizerDashboard />
            </PrivateRoute>
          } />

          <Route path="/create-event" element={
            <PrivateRoute allowedRoles={["organizer"]}>
              <CreateEvent />
            </PrivateRoute>
          } />

          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          } />

          <Route path="/admin/clubs" element={
            <PrivateRoute allowedRoles={["admin"]}>
              <ManageClubs />
            </PrivateRoute>
          } />

          <Route path="/admin/password-resets" element={
            <PrivateRoute allowedRoles={["admin"]}>
              <PasswordResetRequests />
            </PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;