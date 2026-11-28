import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, roles = [], requireLMSAccess = false }) => {
  const { authUser, currentUser, loading } = useAuth();
  const user = authUser || currentUser;
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // If user is not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if account is active
  if (user.isActive === false) {
    return <Navigate to="/login?error=account_suspended" replace />;
  }

  const isAdminUser =
    user.role === 'admin' ||
    user.role === 'employee' ||
    Boolean(user.adminRoleId);

  // LMS approval is only for non-admin LMS students, never for admin/employee users
  if (requireLMSAccess && !isAdminUser && !user.isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  // If specific roles are required, check if user has any of them
  if (roles.length > 0 && !roles.some(role => user.roles?.includes(role) || user.role === role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
