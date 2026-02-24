import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <nav style={{ background: "#4f46e5", padding: "12px", color: "white" }}>
      <Link to="/" style={{ fontWeight: "bold", marginRight: 20 }}>🎪 Felicity</Link>

      {user.role === "participant" && (
        <>
          <Link to="/dashboard">Dashboard</Link>{" "}
          <Link to="/browse-events">Browse</Link>{" "}
          <Link to="/clubs">Clubs</Link>{" "}
          <Link to="/profile">Profile</Link>
        </>
      )}

      {user.role === "organizer" && (
        <>
          <Link to="/organizer/dashboard">Dashboard</Link>{" "}
          <Link to="/create-event">Create Event</Link>{" "}
          <Link to="/organizer/profile">Profile</Link>
        </>
      )}

      {user.role === "admin" && (
        <>
          <Link to="/admin/dashboard">Dashboard</Link>{" "}
          <Link to="/admin/clubs">Manage Clubs</Link>{" "}
          <Link to="/admin/password-resets">Password Resets</Link>
        </>
      )}

      <button onClick={logout} style={{ marginLeft: 20 }}>Logout</button>
    </nav>
  );
};

export default Navbar;