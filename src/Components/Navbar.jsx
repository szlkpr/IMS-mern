import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const navStyle = {
  background: '#333',
  color: '#fff',
  padding: '10px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const ulStyle = {
  listStyle: 'none',
  display: 'flex',
  margin: 0,
  padding: 0,
};

const liStyle = {
  margin: '0 10px',
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
};

const buttonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  fontSize: '1em',
  fontFamily: 'inherit'
};

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav style={navStyle}>
      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Inventory App</div>
      <ul style={ulStyle}>
        <li style={liStyle}><Link to="/" style={linkStyle}>Dashboard</Link></li>
        <li style={liStyle}><Link to="/inventory" style={linkStyle}>Inventory</Link></li>
        <li style={liStyle}><Link to="/purchases" style={linkStyle}>Purchases</Link></li>
        <li style={liStyle}><Link to="/sales" style={linkStyle}>Sales</Link></li>
        <li style={liStyle}><Link to="/categories" style={linkStyle}>Categories</Link></li>
        <li style={liStyle}><Link to="/reports" style={linkStyle}>Reports</Link></li>
        <li style={liStyle}><Link to="/profile" style={linkStyle}>Profile</Link></li>
      </ul>
      <div>
        <button onClick={handleLogout} style={buttonStyle}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
