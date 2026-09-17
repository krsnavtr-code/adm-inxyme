import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./components/admin/AdminDashboard";
import CategoriesList from "./components/admin/categories/CategoriesList";
import CategoryForm from "./components/admin/categories/CategoryForm";
import CoursesList from "./components/admin/courses/CoursesList";
import CourseForm from "./components/admin/courses/CourseForm";
import Users from "./components/admin/Users";
import ContactsList from "./components/admin/ContactsList";
import AdminEnrollments from "./pages/admin/Enrollments";
import PrivateRoute from "./components/PrivateRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Unauthorized from "./pages/Unauthorized";
import ManageFAQs from "./pages/admin/ManageFAQs";
import ImageUploadDemo from "./pages/admin/ImageUploadDemo";
import ImageGallery from "./components/admin/ImageGallery";
import MediaGallery from "./pages/admin/MediaGallery";
import PaymentsList from "./pages/admin/PaymentsList";
import PaymentDetails from "./pages/admin/PaymentDetails";
import SendBrochure from "./pages/admin/SendBrochure";
import SendProposal from "./pages/admin/SendProposal";
import EmailRecords from "./pages/admin/EmailRecords";
import CustomEmailSender from "./pages/admin/CustomEmailSender";
import RedirectManagement from "./pages/admin/RedirectManagement";
import DocumentVerification from "./pages/admin/DocumentVerification";
import TestQAPage from "./pages/admin/TestQAPage";
import CareerManagement from "./pages/admin/career/CareerManagement";
import AdminManagement from "./pages/admin/AdminManagement";
import LoginRecords from "./pages/admin/LoginRecords";
import BlogPostList from "./pages/admin/BlogListPage";
import BlogPostForm from "./pages/admin/BlogPostForm";
import MediaMentionList from "./pages/admin/MediaMentionList";
import MediaMentionForm from "./pages/admin/MediaMentionForm";
import AwardList from "./pages/admin/AwardList";
import AwardForm from "./pages/admin/AwardForm";
import Sprint from "./components/admin/lmsManagement/Sprint";
import LmsManagement from "./components/admin/lmsManagement/LmsManagement";
import Assessment from "./components/admin/lmsManagement/Assessment";
import CandidatesPage from "./pages/admin/CandidatesPage";
import AdminLoginPage from "./pages/auth/AdminLoginPage";
import { useAuth } from "./contexts/AuthContext";
import { getAccessiblePages } from "./utils/adminPermissions";

const AdminRedirect = () => {
  const { currentUser } = useAuth();
  const accessiblePages = getAccessiblePages(currentUser);

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

  if (!accessiblePages || accessiblePages.length === 0) {
    return <Navigate to="/unauthorized" replace />;
  }

  const firstAccessiblePage = accessiblePages[0];
  const redirectRoute = pageToRouteMap[firstAccessiblePage] || "/admin/dashboard";

  return <Navigate to={redirectRoute} replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public / Auth Routes */}
      <Route path="/login" element={<AdminLoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Root redirect to admin */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin Protected Routes */}
      <Route
        element={
          <PrivateRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </PrivateRoute>
        }
      >
        <Route path="/admin" element={<AdminRedirect />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <ProtectedAdminRoute>
              <CategoriesList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/categories/new"
          element={
            <ProtectedAdminRoute action="canCreate">
              <CategoryForm />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/categories/:id/edit"
          element={
            <ProtectedAdminRoute action="canEdit">
              <CategoryForm />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedAdminRoute>
              <CoursesList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/courses/new"
          element={
            <ProtectedAdminRoute action="canCreate">
              <CourseForm isEdit={false} />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/courses/:id/edit"
          element={
            <ProtectedAdminRoute action="canEdit">
              <CourseForm isEdit={true} />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedAdminRoute>
              <Users />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <ProtectedAdminRoute>
              <ContactsList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/faqs"
          element={
            <ProtectedAdminRoute>
              <ManageFAQs />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/media"
          element={
            <ProtectedAdminRoute>
              <MediaGallery />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/image-upload"
          element={
            <ProtectedAdminRoute>
              <ImageUploadDemo />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/image-gallery"
          element={
            <ProtectedAdminRoute>
              <ImageGallery />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/enrollments"
          element={
            <ProtectedAdminRoute>
              <AdminEnrollments />
            </ProtectedAdminRoute>
          }
        />

        {/* Payment Admin Routes */}
        <Route
          path="/admin/payments"
          element={
            <ProtectedAdminRoute>
              <PaymentsList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/payments/:id"
          element={
            <ProtectedAdminRoute>
              <PaymentDetails />
            </ProtectedAdminRoute>
          }
        />

        {/* Blog Admin Routes */}
        <Route
          path="/admin/blog"
          element={
            <ProtectedAdminRoute>
              <BlogPostList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/blog/new"
          element={
            <ProtectedAdminRoute action="canCreate">
              <BlogPostForm />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/blog/edit/:id"
          element={
            <ProtectedAdminRoute action="canEdit">
              <BlogPostForm />
            </ProtectedAdminRoute>
          }
        />

        {/* Media Mention Admin Routes */}
        <Route
          path="/admin/media-mentions"
          element={
            <ProtectedAdminRoute>
              <MediaMentionList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/media-mentions/new"
          element={
            <ProtectedAdminRoute action="canCreate">
              <MediaMentionForm />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/media-mentions/edit/:id"
          element={
            <ProtectedAdminRoute action="canEdit">
              <MediaMentionForm />
            </ProtectedAdminRoute>
          }
        />

        {/* Award Admin Routes */}
        <Route
          path="/admin/awards"
          element={
            <ProtectedAdminRoute>
              <AwardList />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/awards/new"
          element={
            <ProtectedAdminRoute action="canCreate">
              <AwardForm />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/awards/edit/:id"
          element={
            <ProtectedAdminRoute action="canEdit">
              <AwardForm />
            </ProtectedAdminRoute>
          }
        />

        {/* Email Routes */}
        <Route
          path="/admin/email-records"
          element={
            <ProtectedAdminRoute>
              <EmailRecords />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/send-brochure"
          element={
            <ProtectedAdminRoute>
              <SendBrochure />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/send-proposal"
          element={
            <ProtectedAdminRoute>
              <SendProposal />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/custom-email"
          element={
            <ProtectedAdminRoute>
              <CustomEmailSender />
            </ProtectedAdminRoute>
          }
        />

        {/* Redirect Management */}
        <Route
          path="/admin/redirects"
          element={
            <ProtectedAdminRoute>
              <RedirectManagement />
            </ProtectedAdminRoute>
          }
        />

        {/* Document Verification */}
        <Route
          path="/admin/document-verification"
          element={
            <ProtectedAdminRoute>
              <DocumentVerification />
            </ProtectedAdminRoute>
          }
        />

        {/* LMS Routes */}
        <Route
          path="/admin/lms-management"
          element={
            <ProtectedAdminRoute>
              <LmsManagement />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/lms"
          element={<Navigate to="create-sprint" replace />}
        />
        <Route
          path="/admin/lms/create-sprint"
          element={
            <ProtectedAdminRoute action="canCreate">
              <Sprint />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/lms/assessment"
          element={
            <ProtectedAdminRoute>
              <Assessment />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/lms/career"
          element={
            <ProtectedAdminRoute>
              <CareerManagement />
            </ProtectedAdminRoute>
          }
        />

        {/* Candidates Management */}
        <Route
          path="/admin/candidates"
          element={
            <ProtectedAdminRoute>
              <CandidatesPage />
            </ProtectedAdminRoute>
          }
        />

        {/* Admin Management */}
        <Route
          path="/admin/admin-management"
          element={
            <ProtectedAdminRoute>
              <AdminManagement />
            </ProtectedAdminRoute>
          }
        />

        {/* Test QA Management */}
        <Route
          path="/admin/test-qa"
          element={
            <ProtectedAdminRoute>
              <TestQAPage />
            </ProtectedAdminRoute>
          }
        />

        {/* Login Records */}
        <Route
          path="/admin/login-records"
          element={
            <ProtectedAdminRoute>
              <LoginRecords />
            </ProtectedAdminRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
