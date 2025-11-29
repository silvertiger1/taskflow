import React from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>TaskFlow</h2>
        </div>
        
        <div className="nav-links">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : ''}>
            Projects
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            Tasks
          </NavLink>
        </div>
        
        <div className="nav-user">
          <div className="user-info">
            <span className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </span>
            <span className="user-name">{user.username}</span>
          </div>
          <button className="btn btn-logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
