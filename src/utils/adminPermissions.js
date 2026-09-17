// Mapping of admin routes to permission pages
export const routeToPermissionMap = {
  "/admin/dashboard": "dashboard",
  "/admin/categories": "categories",
  "/admin/categories/new": "categories",
  "/admin/categories/:id/edit": "categories",
  "/admin/courses": "courses",
  "/admin/courses/new": "courses",
  "/admin/courses/:id/edit": "courses",
  "/admin/course/:id": "courses",
  "/admin/users": "users",
  "/admin/contacts": "contacts",
  "/admin/faqs": "faqs",
  "/admin/media": "image-gallery",
  "/admin/image-upload": "image-gallery",
  "/admin/image-gallery": "image-gallery",
  "/admin/enrollments": "enrollments",
  "/admin/payments": "payments",
  "/admin/payments/:id": "payments",
  "/admin/blog": "blog",
  "/admin/blog/new": "blog",
  "/admin/blog/edit/:id": "blog",
  "/admin/media-mentions": "blog",
  "/admin/media-mentions/new": "blog",
  "/admin/media-mentions/edit/:id": "blog",
  "/admin/awards": "blog",
  "/admin/awards/new": "blog",
  "/admin/awards/edit/:id": "blog",
  "/admin/email-records": "custom-email",
  "/admin/send-brochure": "send-brochure",
  "/admin/send-proposal": "send-proposal",
  "/admin/custom-email": "custom-email",
  "/admin/redirects": "redirects",
  "/admin/document-verification": "document-verification",
  "/admin/lms-management": "lms-management",
  "/admin/lms": "lms-management",
  "/admin/lms/create-sprint": "lms-management",
  "/admin/lms/assessment": "lms-management",
  "/admin/lms/career": "lms-management",
  "/admin/candidates": "candidates",
  "/admin/admin-management": "admin-management",
  "/admin/test-qa": "test-qa",
  "/admin/login-records": "dashboard",
};

// Get the permission page for a given route
export const getPermissionForRoute = (pathname) => {
  // Check for exact match first
  if (routeToPermissionMap[pathname]) {
    return routeToPermissionMap[pathname];
  }

  // Check for pattern matches (e.g., /admin/courses/123/edit)
  for (const [route, permission] of Object.entries(routeToPermissionMap)) {
    if (route.includes(":")) {
      const routePattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      if (regex.test(pathname)) {
        return permission;
      }
    }
  }

  return null;
};

// Check if user has permission for a specific page and action
export const hasPermission = (user, page, action = "canView") => {
  if (!user || user.role !== "admin") {
    return false;
  }

  // Super admin (no adminRoleId) has full access
  if (!user.adminRoleId) {
    return true;
  }

  const userPermissions = user.adminPermissions || {};
  const pagePermission = userPermissions[page];

  if (!pagePermission) {
    return false;
  }

  return pagePermission[action] === true;
};

// Check if user can access a specific route
export const canAccessRoute = (user, pathname, action = "canView") => {
  const permissionPage = getPermissionForRoute(pathname);

  if (!permissionPage) {
    // If no permission mapping exists, deny access for security
    return false;
  }

  return hasPermission(user, permissionPage, action);
};

// Get user's accessible pages for redirect logic
export const getAccessiblePages = (user) => {
  if (!user || user.role !== "admin") {
    return [];
  }

  // Super admin (no adminRoleId) has access to all pages
  if (!user.adminRoleId) {
    return [
      "dashboard",
      "lms-management",
      "test-qa",
      "courses",
      "send-brochure",
      "send-proposal",
      "candidates",
      "categories",
      "users",
      "blog",
      "contacts",
      "payments",
      "enrollments",
      "faqs",
      "image-gallery",
      "admin-management",
      "custom-email",
      "redirects",
      "document-verification",
    ];
  }

  const userPermissions = user.adminPermissions || {};
  const accessiblePages = [];

  for (const [page, permissions] of Object.entries(userPermissions)) {
    if (permissions.canView) {
      accessiblePages.push(page);
    }
  }

  return accessiblePages;
};
