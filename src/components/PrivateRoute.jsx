import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

export default function PrivateRoute({ 
  children, 
  allowedRoles = [],
  requireLMS = false
}) {
  const { currentUser, isAuthenticated, loading, logout } = useAuth();
  const location = useLocation();
  const userRole = currentUser?.role?.toLowerCase();
  const isAdmin = userRole === 'admin';

  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is active
  if (currentUser?.isActive === false) {
    logout();
    return <Navigate to="/login?error=account_suspended" replace />;
  }

  // Check LMS access requirements
  if (requireLMS && currentUser?.isApproved === false) {
    logout();
    return <Navigate to="/login?error=not_approved" replace />;
  }

  // Check admin access
  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check allowed roles for non-admin routes
  if (allowedRoles.length > 0) {
    const normalizedUserRole = userRole?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role?.toLowerCase());
    
    const hasAllowedRole = normalizedAllowedRoles.includes(normalizedUserRole);

    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  
  return (
    <>
      {children ? React.cloneElement(children, { currentUser }) : <Outlet />}
    </>
  );
}
