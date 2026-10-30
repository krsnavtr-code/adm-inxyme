import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import userApi from "../../api/userApi";
import { FaEdit, FaKey, FaTrash, FaBook, FaSearch, FaTimes, FaFilter } from "react-icons/fa";
import EnrollUserModal from "./EnrollUserModal";

// Modal components
const UserModal = ({ user, onClose, onSave, isOpen }) => {
  const [formData, setFormData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    role: user?.role || "student",
    ...(user ? {} : { password: "" }), // Only show password field for new users
  });

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || "",
        email: user.email || "",
        role: user.role || "student",
      });
    } else {
      setFormData({
        fullname: "",
        email: "",
        role: "student",
        password: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // When editing, only send fields that should be updated
    if (user) {
      const updateData = {
        fullname: formData.fullname,
        role: formData.role,
      };
      // Only include password if it's provided (for new users)
      if (formData.password) {
        updateData.password = formData.password;
      }
      onSave(updateData);
    } else {
      // For new users, send all fields including password and email
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {user ? "Edit User" : "Add New User"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                required
                disabled={!!user}
                readOnly={!!user}
              />
              {user && (
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {!user && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required={!user}
                  minLength={6}
                />
              </div>
            )}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {user ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const ChangePasswordModal = ({ userId, onClose, onSave, isOpen }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        await onSave(userId, formData.newPassword);
        onClose();
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to change password",
        );
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Change Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.newPassword ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
                minLength={6}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.newPassword}
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                } rounded-md`}
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingDiscountId, setEditingDiscountId] = useState(null);

  // Filter states: Status, Role, LMS Status, Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [lmsStatusFilter, setLmsStatusFilter] = useState("all");

  // Extract all available roles dynamically, ensuring default roles exist
  const availableRoles = useMemo(() => {
    const roles = new Set(["student", "teacher", "admin"]);
    users.forEach((u) => {
      if (u.role) roles.add(u.role.toLowerCase());
    });
    return Array.from(roles);
  }, [users]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setRoleFilter("all");
    setLmsStatusFilter("all");
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "all" ||
    roleFilter !== "all" ||
    lmsStatusFilter !== "all";

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search filter: matches name or email
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const fullname = user.fullname ? String(user.fullname).toLowerCase() : "";
        const email = user.email ? String(user.email).toLowerCase() : "";
        if (!fullname.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // 2. Status filter: active / inactive
      if (statusFilter !== "all") {
        const isActive = Boolean(user.isActive);
        if (statusFilter === "active" && !isActive) return false;
        if (statusFilter === "inactive" && isActive) return false;
      }

      // 3. Role filter: student / teacher / admin / etc.
      if (roleFilter !== "all") {
        const userRole = user.role ? String(user.role).toLowerCase() : "";
        if (userRole !== roleFilter.toLowerCase()) return false;
      }

      // 4. LMS Status filter: approved / not_approved
      if (lmsStatusFilter !== "all") {
        const isApproved = Boolean(user.isApproved);
        if (lmsStatusFilter === "approved" && !isApproved) return false;
        if (lmsStatusFilter === "not_approved" && isApproved) return false;
      }

      return true;
    });
  }, [users, searchTerm, statusFilter, roleFilter, lmsStatusFilter]);
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userApi.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      let errorMessage = "Failed to load users";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.response.status === 403) {
          errorMessage = "You do not have permission to view users.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      await userApi.create(userData);
      toast.success("User created successfully");
      await fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error(error.response?.data?.message || "Failed to create user");
    }
  };

  const handleUpdateUser = async (userData) => {
    if (!editingUserId) return;

    try {
      await userApi.update(editingUserId, userData);
      toast.success("User updated successfully");
      await fetchUsers();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userApi.delete(userId);
        toast.success("User deleted successfully");
        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const handleChangePassword = async (userId, newPassword) => {
    try {
      await userApi.changePasswordAdmin(userId, newPassword);
      toast.success("Password changed successfully");
      setIsPasswordModalOpen(false);
      setCurrentUser(null);
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await userApi.updateStatus(userId, !currentStatus);
      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      await fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };
  const handleToggleLMSStatus = async (userId, currentStatus) => {
    try {
      await userApi.updateLMSStatus(userId, !currentStatus);
      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      await fetchUsers();
    } catch (error) {
      console.error("Error toggling user status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update user status",
      );
    }
  };

  const handleEnrollUser = async (userId, courseId, status) => {
    try {
      await userApi.adminEnrollUser(userId, courseId, status);
      return true;
    } catch (error) {
      console.error("Error enrolling user in course:", error);
      throw error;
    }
  };

  const handleEnrollClick = (user) => {
    setCurrentUser(user);
    setIsEnrollModalOpen(true);
  };

  const handleDiscountChange = async (userId, discountValue) => {
    const discount = Math.min(100, Math.max(0, Number(discountValue)));
    try {
      await userApi.updateDiscount(userId, discount);
      toast.success("Discount updated successfully");
      await fetchUsers();
      setEditingDiscountId(null);
    } catch (error) {
      console.error("Error updating discount:", error);
      toast.error(error.response?.data?.message || "Failed to update discount");
    }
  };

  const handleDiscountKeyDown = (e, userId, discountValue) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleDiscountChange(userId, discountValue);
    }
  };

  const handleEditClick = (user) => {
    setCurrentUser(user);
    setEditingUserId(user._id);
    setIsModalOpen(true);
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Users Management
            <span className="text-sm font-normal text-gray-500 ml-3">
              ({filteredUsers.length}
              {filteredUsers.length !== users.length ? ` of ${users.length}` : ""}{" "}
              user{filteredUsers.length === 1 ? "" : "s"})
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Search and filter users by status, role, and LMS approval
          </p>
        </div>
        {/* <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New User
        </button> */}
      </div>

      {/* Filters: Search, Status, Role, LMS Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 [color-scheme:light]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Search
            </label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name or email..."
                className="w-full pl-8 pr-8 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 border border-gray-300 rounded-md shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  title="Clear search"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all" className="bg-white text-gray-900">All Status</option>
              <option value="active" className="bg-white text-gray-900">Active</option>
              <option value="inactive" className="bg-white text-gray-900">Inactive</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Role
            </label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer capitalize"
            >
              <option value="all" className="bg-white text-gray-900">All Roles</option>
              {availableRoles.map((role) => (
                <option key={role} value={role} className="bg-white text-gray-900 capitalize">
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* LMS Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              LMS Status
            </label>
            <select
              value={lmsStatusFilter}
              onChange={(e) => setLmsStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white text-gray-900 border border-gray-300 rounded-md shadow-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="all" className="bg-white text-gray-900">All LMS Status</option>
              <option value="approved" className="bg-white text-gray-900">Approved</option>
              <option value="not_approved" className="bg-white text-gray-900">Not Approved</option>
            </select>
          </div>
        </div>

        {/* Filter Summary & Reset Action */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 gap-2">
            <div className="flex items-center gap-1.5">
              <FaFilter className="text-indigo-500 text-[10px]" />
              <span>
                Filtered: <strong className="text-gray-900">{filteredUsers.length}</strong> of{" "}
                <strong className="text-gray-900">{users.length}</strong> users found
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FaTimes className="text-[10px]" /> Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  LMS Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    {users.length === 0 ? (
                      "No users found"
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <p className="text-gray-500 font-medium">No users match your filter criteria.</p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                        >
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullname || "N/A"}
                          </div>
                          {/* Enrolled Courses Badges */}
                          {Array.isArray(user.enrolledCourses) && user.enrolledCourses.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1 max-w-xs">
                              {user.enrolledCourses.slice(0, 2).map((c, idx) => (
                                <span
                                  key={c._id || idx}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 max-w-[130px] truncate"
                                  title={c.title || (typeof c === "string" ? "Course" : "Enrolled Course")}
                                >
                                  {c.title || (typeof c === "string" ? "Enrolled Course" : "Course")}
                                </span>
                              ))}
                              {user.enrolledCourses.length > 2 && (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600"
                                  title={user.enrolledCourses.slice(2).map((c) => c.title || "Course").join(", ")}
                                >
                                  +{user.enrolledCourses.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-gray-400 block mt-0.5">
                              0 Courses
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-xs text-gray-400">
                        Last login:{" "}
                        {new Date(user.lastLogin).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "teacher"
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            user.isActive
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          onClick={() =>
                            handleToggleStatus(user._id, user.isActive)
                          }
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-xs text-gray-500">
                          Joined:{" "}
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full cursor-pointer ${
                            user.isApproved
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-red-100 text-red-800 hover:bg-red-200"
                          }`}
                          onClick={() =>
                            handleToggleLMSStatus(user._id, user.isApproved)
                          }
                        >
                          {user.isApproved ? "Approved" : "Not Approved"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingDiscountId === user._id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={user.discount || ""}
                            onChange={(e) =>
                              setUsers(
                                users.map((u) =>
                                  u._id === user._id
                                    ? { ...u, discount: e.target.value }
                                    : u,
                                ),
                              )
                            }
                            onKeyDown={(e) =>
                              handleDiscountKeyDown(e, user._id, e.target.value)
                            }
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            autoFocus
                          />
                          <button
                            onClick={() =>
                              handleDiscountChange(user._id, user.discount || 0)
                            }
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => setEditingDiscountId(user._id)}
                          className="flex items-center space-x-1 cursor-pointer hover:text-indigo-600"
                        >
                          <span className="text-sm">{user.discount || 0}%</span>
                          <FaEdit className="text-xs" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            setCurrentUser(user);
                            setIsPasswordModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaKey />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete User"
                        >
                          <FaTrash />
                        </button>
                        <button
                          onClick={() => handleEnrollClick(user)}
                          className="text-green-600 hover:text-green-900"
                          title="Enroll in Course"
                        >
                          <FaBook />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      <UserModal
        user={currentUser}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCurrentUser(null);
          setEditingUserId(null);
        }}
        onSave={editingUserId ? handleUpdateUser : handleCreateUser}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        userId={currentUser?._id}
        userName={currentUser?.fullname || currentUser?.email}
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setCurrentUser(null);
        }}
        onSave={handleChangePassword}
      />

      <EnrollUserModal
        visible={isEnrollModalOpen}
        userId={currentUser?._id}
        userName={currentUser?.fullname || currentUser?.email}
        onCancel={() => {
          setIsEnrollModalOpen(false);
          setCurrentUser(null);
        }}
        onEnroll={handleEnrollUser}
      />
    </div>
  );
};

export default Users;
