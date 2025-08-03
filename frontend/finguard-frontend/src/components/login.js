import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';
import finguardLogo from '../assets/finguard.jpg'; 
import { jwtDecode } from 'jwt-decode';




function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

 const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials');
    }

    const data = await response.json();
    localStorage.setItem('finguard-token', data.token);

    const decoded = jwtDecode(data.token);
    const role = decoded.role;

    if (role === 'Admin') {
      navigate('/admin/AdminDashboard');
    } else {
      navigate('/dashboard');
    }
  } catch (err) {
    console.error("Login failed:", err.message);
    setError("Login failed. Check your credentials.");
  }
};


return (
  <div className="auth-page">
    <div className="login-container">
      <img
        src={finguardLogo}
        alt="FinGuard Logo"
        style={{ width: '300px', display: 'block', margin: '0 auto 20px' }}
      />
      <h2>Login to FinGuard</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>

      <p style={{ marginTop: '20px' }}>
        Don't have an account? <Link to="/register">Register here</Link>
      </p>

      {error && <p className="error">{error}</p>}
    </div>
  </div>
);
}

export default Login;
