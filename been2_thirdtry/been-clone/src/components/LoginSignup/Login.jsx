// Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import the useAuth hook

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth(); // Destructure the login function from the AuthContext

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3111/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Login successful, user data:", data.user); // Debugging log
        login(data.user); // Set the user data from the response
        window.location.href = '/map'; // Redirect to the map page
      } else {
        setMessage(data.error || 'Error during login.');
      }
    } catch (error) {
      setMessage('An error occurred during login. Please try again later.');
    }
  };

  return (
    <div className="card">
      <div className="card-header">Log In</div>
      <div className="card-body">
        <div className="inputs">
          <div className="input-group mb-3">
            <span className="input-group-text" id="basic-addon1">
              {/* SVG icon for email */}
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Email"
              aria-label="Email"
              aria-describedby="basic-addon1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group mb-3">
            <span className="input-group-text" id="basic-addon1">
              {/* SVG icon for password */}
            </span>
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              aria-label="Password"
              aria-describedby="basic-addon1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleLogin}>
          Log In
        </button>
        {message && <div style={{ marginTop: '10px', color: 'red' }}>{message}</div>}
        <div>
          Don't have an account?{' '}
          <a
            href="/"
            className="link-primary link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
