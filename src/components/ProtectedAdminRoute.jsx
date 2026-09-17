import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canAccessRoute, getAccessiblePages } from "../utils/adminPermissions";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
  </div>
);

export default function ProtectedAdminRoute({ children, action = "canView" }) {
  const { currentUser, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user is admin
  if (currentUser?.role !== "admin") {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check if user has permission for this specific route
  if (!canAccessRoute(currentUser, location.pathname, action)) {
    // Find the first accessible page for this user
    const accessiblePages = getAccessiblePages(currentUser);

    if (accessiblePages.length === 0) {
      // User has no permissions at all, redirect to unauthorized
      return <Navigate to="/unauthorized" replace />;
    }

    // Map accessible pages to their routes
    const pageToRouteMap = {
      dashboard: "/admin/dashboard",
      "lms-management": "/admin/lms-management",
      "test-qa": "/admin/test-qa",
      courses: "/admin/courses",
      "send-brochure": "/admin/send-brochure",
      "send-proposal": "/admin/send-proposal",
      candidates: "/admin/candidates",
      categories: "/admin/categories",
      users: "/admin/users",
      blog: "/admin/blog",
      contacts: "/admin/contacts",
      payments: "/admin/payments",
      enrollments: "/admin/enrollments",
      faqs: "/admin/faqs",
      "image-gallery": "/admin/image-gallery",
      "admin-management": "/admin/admin-management",
      "custom-email": "/admin/custom-email",
      redirects: "/admin/redirects",
      "document-verification": "/admin/document-verification",
    };

    // Redirect to the first accessible page
    const firstAccessiblePage = accessiblePages[0];
    const redirectRoute =
      pageToRouteMap[firstAccessiblePage] || "/admin/dashboard";

    return <Navigate to={redirectRoute} replace />;
  }

  return children;
}
