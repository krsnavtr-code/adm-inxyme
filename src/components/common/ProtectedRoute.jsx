import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [], requireLMSAccess = false }) => {
  const { authUser, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not logged in, redirect to login
  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is active (basic website access)
  if (!authUser.isActive) {
    return <Navigate to="/inactive-account" replace />;
  }

  // Check if LMS access is required and user is approved
  if (requireLMSAccess && !authUser.isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If specific roles are required, check if user has any of them
  if (roles.length > 0 && !roles.some(role => authUser.roles?.includes(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
