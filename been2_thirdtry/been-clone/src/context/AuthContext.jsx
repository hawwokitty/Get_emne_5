// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

// Create a Context for authentication
const AuthContext = createContext();

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthProvider component that wraps the application
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // State to hold the authenticated user data

  // Function to set the user data after login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Save user to local storage
  };

  // Function to clear user data on logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Remove user from local storage
  };

  // Load user from local storage on initial render
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser)); // Set the user state if data exists in local storage
    }
  }, []);

  // Providing the user data and functions to children
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
