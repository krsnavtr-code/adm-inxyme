import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import * as adminApi from "../../api/adminApi";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  X,
  CheckCircle2,
  AlertCircle,
  KeyRound,
} from "lucide-react";

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState("roles"); // "roles" | "users" | "all-users"
  const [roles, setRoles] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [loading, setLoading] = useState(false);

  // All Users state
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersTotal, setAllUsersTotal] = useState(0);
  const [allUsersPage, setAllUsersPage] = useState(1);
  const [allUsersTotalPages, setAllUsersTotalPages] = useState(1);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userAdminFilter, setUserAdminFilter] = useState("all"); // "all" | "true" | "false"

  // Modals state
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false); // Can be new user or edit
  const [showAssignModal, setShowAssignModal] = useState(false); // Quick assign role to existing user
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);
  const [revokeTargetUser, setRevokeTargetUser] = useState(null);

  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Forms state
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  const [userForm, setUserForm] = useState({
    fullname: "",
    email: "",
    password: "",
    adminRoleId: "",
  });

  const [assignForm, setAssignForm] = useState({
    userId: "",
    userEmail: "",
    userName: "",
    currentRole: "",
    adminRoleId: "",
    updateRoleToAdmin: false,
  });

  // User search dropdown state inside Assign Modal when no user is preselected
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [isSearchingInModal, setIsSearchingInModal] = useState(false);
  const [modalSearchResults, setModalSearchResults] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "all-users") {
      fetchAllUsers(allUsersPage, userSearchQuery, userRoleFilter, userAdminFilter);
    }
  }, [activeTab, allUsersPage, userRoleFilter, userAdminFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes, pagesRes] = await Promise.all([
        adminApi.getAdminRoles(),
        adminApi.getAdminUsers(),
        adminApi.getAvailablePages(),
      ]);

      setRoles(rolesRes?.data?.roles || []);
      setAdminUsers(usersRes?.data?.users || []);
      setAvailablePages(pagesRes?.data?.pages || []);
    } catch (error) {
      toast.error("Failed to fetch initial data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (page = 1, search = "", role = "all", hasAdmin = "all") => {
    try {
      setAllUsersLoading(true);
      const params = {
        page,
        limit: 20,
      };
      if (search && search.trim()) params.search = search.trim();
      if (role && role !== "all") params.role = role;
      if (hasAdmin === "true" || hasAdmin === "false") params.hasAdminRole = hasAdmin;

      const res = await adminApi.getAllUsersWithAdminStatus(params);
      setAllUsers(res?.data?.users || []);
      setAllUsersTotal(res?.total || 0);
      setAllUsersTotalPages(res?.totalPages || 1);
      setAllUsersPage(res?.page || 1);
    } catch (error) {
      console.error("Error fetching all users:", error);
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setAllUsersLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAllUsersPage(1);
    fetchAllUsers(1, userSearchQuery, userRoleFilter, userAdminFilter);
  };

  const handleResetSearch = () => {
    setUserSearchQuery("");
    setUserRoleFilter("all");
    setUserAdminFilter("all");
    setAllUsersPage(1);
    fetchAllUsers(1, "", "all", "all");
  };

  // Searching users inside modal when opening "Assign Role to Existing User" from top button
  const handleModalUserSearch = async (term) => {
    setModalSearchTerm(term);
    if (!term || term.trim().length < 2) {
      setModalSearchResults([]);
      return;
    }
    try {
      setIsSearchingInModal(true);
      const res = await adminApi.getAllUsersWithAdminStatus({ search: term.trim(), limit: 10 });
      setModalSearchResults(res?.data?.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearchingInModal(false);
    }
  };

  const selectUserForAssignment = (user) => {
    setAssignForm({
      userId: user._id,
      userEmail: user.email,
      userName: user.fullname,
      currentRole: user.role || "student",
      adminRoleId: user.adminRoleId?._id || user.adminRoleId || "",
      updateRoleToAdmin: false,
    });
    setModalSearchTerm("");
    setModalSearchResults([]);
  };

  // Role Permissions Form Handlers
  const handlePermissionToggle = (page, action) => {
    setRoleForm((prev) => {
      const existingPermission = prev.permissions.find((p) => p.page === page);

      if (existingPermission) {
        const updatedVal = !existingPermission[action];
        return {
          ...prev,
          permissions: prev.permissions.map((p) => {
            if (p.page !== page) return p;
            if (action === "canView") {
              return {
                ...p,
                canView: updatedVal,
                canCreate: updatedVal,
                canEdit: updatedVal,
                canDelete: updatedVal,
              };
            }
            return { ...p, [action]: updatedVal };
          }),
        };
      } else {
        const isEnable = true;
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            {
              page,
              canView: isEnable,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
          ],
        };
      }
    });
  };

  const handleSelectAllForPage = (page, selectAll) => {
    setRoleForm((prev) => {
      const existingPermission = prev.permissions.find((p) => p.page === page);

      if (existingPermission) {
        return {
          ...prev,
          permissions: prev.permissions.map((p) =>
            p.page === page
              ? {
                  ...p,
                  canView: selectAll,
                  canCreate: selectAll,
                  canEdit: selectAll,
                  canDelete: selectAll,
                }
              : p,
          ),
        };
      } else {
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            {
              page,
              canView: selectAll,
              canCreate: selectAll,
              canEdit: selectAll,
              canDelete: selectAll,
            },
          ],
        };
      }
    });
  };

  const isAllSelectedForPage = (page) => {
    const permission = roleForm.permissions.find((p) => p.page === page);
    if (!permission) return false;
    return (
      permission.canView &&
      permission.canCreate &&
      permission.canEdit &&
      permission.canDelete
    );
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formattedPermissions = (roleForm.permissions || []).map((perm) => {
        if (perm.canView) {
          return {
            ...perm,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
          };
        }
        return perm;
      });

      const payload = {
        ...roleForm,
        permissions: formattedPermissions,
      };

      if (editingRole) {
        await adminApi.updateAdminRole(editingRole._id, payload);
        toast.success("Role updated successfully");
      } else {
        await adminApi.createAdminRole(payload);
        toast.success("Role created successfully");
      }

      setShowRoleForm(false);
      setEditingRole(null);
      setRoleForm({ name: "", description: "", permissions: [] });
      fetchInitialData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

  // Submit Brand New Admin User Form
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingUser) {
        await adminApi.updateAdminUserRole(editingUser._id, {
          adminRoleId: userForm.adminRoleId,
          fullname: userForm.fullname,
          email: userForm.email,
        });
        toast.success("User role updated successfully");
      } else {
        await adminApi.createAdminUser(userForm);
        toast.success("Admin user created successfully");
      }

      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ fullname: "", email: "", password: "", adminRoleId: "" });
      fetchInitialData();
      if (activeTab === "all-users") {
        fetchAllUsers(allUsersPage, userSearchQuery, userRoleFilter, userAdminFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  // Submit Quick Assign Admin Role to Existing User
  const handleAssignRoleSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.userId) {
      toast.error("Please select a user first");
      return;
    }
    if (!assignForm.adminRoleId) {
      toast.error("Please select an admin role to grant");
      return;
    }

    try {
      setLoading(true);
      await adminApi.assignAdminRoleToExistingUser({
        userId: assignForm.userId,
        adminRoleId: assignForm.adminRoleId,
        role: assignForm.updateRoleToAdmin ? "admin" : undefined,
      });

      toast.success(`Admin access granted to ${assignForm.userName || assignForm.userEmail}!`);
      setShowAssignModal(false);
      setAssignForm({
        userId: "",
        userEmail: "",
        userName: "",
        currentRole: "",
        adminRoleId: "",
        updateRoleToAdmin: false,
      });

      fetchInitialData();
      if (activeTab === "all-users") {
        fetchAllUsers(allUsersPage, userSearchQuery, userRoleFilter, userAdminFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to grant admin access");
    } finally {
      setLoading(false);
    }
  };

  // Revoke Admin Role Confirmation
  const handleConfirmRevoke = async () => {
    if (!revokeTargetUser) return;
    try {
      setLoading(true);
      await adminApi.revokeAdminUserRole(revokeTargetUser._id);
      toast.success(`Admin access revoked for ${revokeTargetUser.fullname || revokeTargetUser.email}`);
      setShowRevokeConfirm(false);
      setRevokeTargetUser(null);

      fetchInitialData();
      if (activeTab === "all-users") {
        fetchAllUsers(allUsersPage, userSearchQuery, userRoleFilter, userAdminFilter);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to revoke admin access");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setShowRoleForm(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      fullname: user.fullname,
      email: user.email,
      password: "",
      adminRoleId: user.adminRoleId?._id || user.adminRoleId || "",
    });
    setShowUserForm(true);
  };

  const handleDeleteRole = async (roleId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this role? This will remove it from all users.",
      )
    ) {
      try {
        await adminApi.deleteAdminRole(roleId);
        toast.success("Role deleted successfully");
        fetchInitialData();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete role");
      }
    }
  };

  // Open Assign Modal for a specific existing user
  const openAssignModalForUser = (user) => {
    setAssignForm({
      userId: user._id,
      userEmail: user.email,
      userName: user.fullname,
      currentRole: user.role || "student",
      adminRoleId: user.adminRoleId?._id || user.adminRoleId || "",
      updateRoleToAdmin: false,
    });
    setModalSearchTerm("");
    setModalSearchResults([]);
    setShowAssignModal(true);
  };

  const getPageLabel = (pageKey) => {
    const page = availablePages.find((p) => p.key === pageKey);
    return page ? page.label : pageKey;
  };

  const getRoleBadge = (roleName) => {
    const formatted = (roleName || "student").toLowerCase();
    switch (formatted) {
      case "admin":
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">Admin</span>;
      case "employee":
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Employee</span>;
      case "teacher":
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Teacher</span>;
      case "student":
      default:
        return <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Student</span>;
    }
  };

  if (loading && roles.length === 0 && adminUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Admin & Access Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage admin roles, custom permissions, and grant admin access to any existing registered user.
          </p>
        </div>

        {/* Quick Action Buttons on top */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setAssignForm({
                userId: "",
                userEmail: "",
                userName: "",
                currentRole: "",
                adminRoleId: "",
                updateRoleToAdmin: false,
              });
              setModalSearchTerm("");
              setModalSearchResults([]);
              setShowAssignModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 transition"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Grant Access to Existing User
          </button>

          <button
            onClick={() => {
              setEditingRole(null);
              setRoleForm({ name: "", description: "", permissions: [] });
              setShowRoleForm(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-indigo-600 text-sm font-medium rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <Shield className="w-4 h-4 mr-2" />
            Create Role
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4 shadow-xs">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === "roles"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Admin Roles
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800">
              {roles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === "users"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Users
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800">
              {adminUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("all-users")}
            className={`py-3 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition ${
              activeTab === "all-users"
                ? "border-indigo-600 text-indigo-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Users className="w-4 h-4" />
            All Users Access Directory
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
              {allUsersTotal || "All"}
            </span>
          </button>
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ROLES */}
      {/* ========================================================================= */}
      {activeTab === "roles" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Custom Admin Roles</h2>
              <p className="text-sm text-gray-600">
                Define access templates with page-level permissions. You can assign these roles to any user.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleForm({ name: "", description: "", permissions: [] });
                setShowRoleForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition"
            >
              + Create New Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((role) => (
              <div
                key={role._id}
                className="bg-white rounded-xl shadow-xs hover:shadow-md transition p-5 border border-gray-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-1.5">
                        <KeyRound className="w-4 h-4 text-indigo-500" />
                        {role.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-0.5">{role.description || "No description provided."}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-indigo-600 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded"
                        title="Edit Role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role._id)}
                        className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                        title="Delete Role"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Allowed Pages ({role.permissions?.filter((p) => p.canView)?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {role.permissions
                        ?.filter((p) => p.canView)
                        ?.map((permission) => (
                          <span
                            key={permission.page}
                            className="inline-block px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100"
                          >
                            {getPageLabel(permission.page)}
                          </span>
                        ))}
                      {(!role.permissions || role.permissions.filter((p) => p.canView).length === 0) && (
                        <span className="text-xs text-gray-400 italic">No page permissions configured</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                  <span>Created {new Date(role.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => {
                      setAssignForm({
                        userId: "",
                        userEmail: "",
                        userName: "",
                        currentRole: "",
                        adminRoleId: role._id,
                        updateRoleToAdmin: false,
                      });
                      setModalSearchTerm("");
                      setModalSearchResults([]);
                      setShowAssignModal(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                  >
                    Assign to User &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CURRENT ADMIN USERS */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Active Admin Staff & Privileges</h2>
              <p className="text-sm text-gray-600">
                Users who currently possess an assigned admin role or administrative permissions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAssignForm({
                    userId: "",
                    userEmail: "",
                    userName: "",
                    currentRole: "",
                    adminRoleId: "",
                    updateRoleToAdmin: false,
                  });
                  setModalSearchTerm("");
                  setModalSearchResults([]);
                  setShowAssignModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 shadow-sm transition flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                Assign Role to Existing User
              </button>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setUserForm({
                    fullname: "",
                    email: "",
                    password: "",
                    adminRoleId: "",
                  });
                  setShowUserForm(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Create New Admin Account
              </button>
            </div>
          </div>

          <div className="bg-white shadow-xs rounded-xl overflow-hidden border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    System Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Assigned Admin Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Created / Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {(user.fullname || user.email || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullname || "Unnamed User"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.adminRoleId ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                          {user.adminRoleId?.name || "Assigned Role"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                          Super Admin (Full Access)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openAssignModalForUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs font-medium transition"
                      >
                        Change Role
                      </button>
                      {user.adminRoleId && (
                        <button
                          onClick={() => {
                            setRevokeTargetUser(user);
                            setShowRevokeConfirm(true);
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {adminUsers.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No admin users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL USERS ACCESS DIRECTORY (GIVE ACCESS TO ANY EXISTING USER) */}
      {/* ========================================================================= */}
      {activeTab === "all-users" && (
        <div className="space-y-4">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-700 text-white p-5 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-300" />
                  All Registered Users Access Directory
                </h2>
                <p className="text-indigo-200 text-sm mt-1 max-w-2xl">
                  Search any user across your entire database (students, instructors, employees, etc.) and grant or modify their administrative privileges instantly from here.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchAllUsers(allUsersPage, userSearchQuery, userRoleFilter, userAdminFilter)}
                  className="px-3 py-1.5 bg-indigo-800/80 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                  disabled={allUsersLoading}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${allUsersLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search user by name, email, or phone number..."
                className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => {
                  setUserRoleFilter(e.target.value);
                  setAllUsersPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Base Roles</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={userAdminFilter}
                onChange={(e) => {
                  setUserAdminFilter(e.target.value);
                  setAllUsersPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Access Levels</option>
                <option value="true">Has Admin Privileges</option>
                <option value="false">No Admin Access</option>
              </select>

              {(userSearchQuery || userRoleFilter !== "all" || userAdminFilter !== "all") && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* All Users Table */}
          <div className="bg-white shadow-xs rounded-xl overflow-hidden border border-gray-200">
            {allUsersLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent"></div>
                <p className="mt-2 text-sm text-gray-500">Loading registered users...</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      System Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Admin Access Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Registered On
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Access Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => {
                    const hasAdminAccess =
                      user.role === "admin" ||
                      user.role === "employee" ||
                      Boolean(user.adminRoleId);

                    return (
                      <tr key={user._id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
                              {(user.fullname || user.email || "U").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                {user.fullname || "Unnamed User"}
                                {!user.isActive && (
                                  <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-700 rounded">
                                    Deactivated
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                              {user.phone && <div className="text-[11px] text-gray-400">{user.phone}</div>}
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRoleBadge(user.role)}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.adminRoleId ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                              {user.adminRoleId?.name || "Admin Role"}
                            </span>
                          ) : user.role === "admin" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              <Shield className="w-3.5 h-3.5 mr-1" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              No Admin Access
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {user.adminRoleId ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                onClick={() => openAssignModalForUser(user)}
                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-xs font-medium transition"
                              >
                                Change Role
                              </button>
                              <button
                                onClick={() => {
                                  setRevokeTargetUser(user);
                                  setShowRevokeConfirm(true);
                                }}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition"
                              >
                                Revoke
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModalForUser(user)}
                              className="inline-flex items-center text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" />
                              Grant Admin Access
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {allUsers.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        No users found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {allUsersTotalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Showing page {allUsersPage} of {allUsersTotalPages} ({allUsersTotal} total registered users)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    disabled={allUsersPage <= 1}
                    onClick={() => setAllUsersPage((prev) => Math.max(1, prev - 1))}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    disabled={allUsersPage >= allUsersTotalPages}
                    onClick={() => setAllUsersPage((prev) => Math.min(allUsersTotalPages, prev + 1))}
                    className="px-3 py-1 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN ADMIN ROLE TO EXISTING USER */}
      {/* ========================================================================= */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-lg shadow-2xl rounded-2xl bg-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Grant Admin Access to Existing User
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select any registered user and assign an administrative role with custom permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignRoleSubmit} className="space-y-4">
              {/* Selected User Display OR User Search Bar */}
              {assignForm.userId ? (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {(assignForm.userName || assignForm.userEmail || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{assignForm.userName || "User"}</div>
                      <div className="text-xs text-gray-500">{assignForm.userEmail}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Current Base Role: <span className="font-semibold capitalize text-indigo-700">{assignForm.currentRole}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignForm((prev) => ({
                        ...prev,
                        userId: "",
                        userEmail: "",
                        userName: "",
                        currentRole: "",
                        adminRoleId: "",
                      }));
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                  >
                    Change User
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Registered User
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={modalSearchTerm}
                      onChange={(e) => handleModalUserSearch(e.target.value)}
                      placeholder="Type name or email to search registered users..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {isSearchingInModal && (
                      <div className="absolute right-3 top-2.5">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>

                  {modalSearchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white shadow-lg">
                      {modalSearchResults.map((u) => (
                        <div
                          key={u._id}
                          onClick={() => selectUserForAssignment(u)}
                          className="p-2.5 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-sm font-medium text-gray-900">{u.fullname || "User"}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getRoleBadge(u.role)}
                            <span className="text-xs text-emerald-600 font-medium">Select &rarr;</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {modalSearchTerm.length >= 2 && !isSearchingInModal && modalSearchResults.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1 italic">No registered users found matching "{modalSearchTerm}".</p>
                  )}
                </div>
              )}

              {/* Admin Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Admin Role to Assign *
                </label>
                <select
                  required
                  value={assignForm.adminRoleId}
                  onChange={(e) =>
                    setAssignForm((prev) => ({
                      ...prev,
                      adminRoleId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white"
                >
                  <option value="">-- Choose an Admin Role Template --</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name} - ({role.description || "Custom permissions"})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  This user will inherit all page permissions defined in this role template.
                </p>
              </div>

              {/* Optional: Promote Base System Role */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignForm.updateRoleToAdmin}
                    onChange={(e) =>
                      setAssignForm((prev) => ({
                        ...prev,
                        updateRoleToAdmin: e.target.checked,
                      }))
                    }
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                  />
                  <div>
                    <span className="text-xs font-semibold text-gray-800">
                      Also set primary system role to 'Admin'
                    </span>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                      (Optional: If unchecked, their current role like 'student' or 'teacher' is preserved while still granting them full access to the admin dashboard via their assigned role).
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !assignForm.userId || !assignForm.adminRoleId}
                  className="px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition"
                >
                  {loading ? "Granting Access..." : "Grant Admin Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REVOKE ADMIN ACCESS CONFIRMATION */}
      {/* ========================================================================= */}
      {showRevokeConfirm && revokeTargetUser && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="p-3 bg-red-100 rounded-full">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Revoke Admin Access?</h3>
                <p className="text-xs text-gray-500">Remove administrative privileges</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to revoke admin access for{" "}
              <strong className="text-gray-900">{revokeTargetUser.fullname || revokeTargetUser.email}</strong>?
              They will no longer be able to access the admin portal or perform administrative actions.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowRevokeConfirm(false);
                  setRevokeTargetUser(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {loading ? "Revoking..." : "Yes, Revoke Access"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROLE FORM (CREATE OR EDIT ROLE WITH PERMISSIONS) */}
      {/* ========================================================================= */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-4xl shadow-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                {editingRole ? "Edit Admin Role" : "Create New Admin Role"}
              </h3>
              <button
                onClick={() => {
                  setShowRoleForm(false);
                  setEditingRole(null);
                  setRoleForm({ name: "", description: "", permissions: [] });
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., LMS Manager, Operations Admin"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Short description of this role's purpose"
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-800">
                    Page Permissions ({availablePages.length} pages available)
                  </label>
                  <span className="text-xs text-gray-500">
                    Checking any action automatically gives full CRUD operations on that page.
                  </span>
                </div>

                <div className="border border-gray-200 rounded-xl p-4 max-h-96 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
                  {availablePages.map((page) => {
                    const permission = roleForm.permissions.find(
                      (p) => p.page === page.key,
                    );
                    return (
                      <div
                        key={page.key}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 text-sm">
                            {page.label}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            ({page.key})
                          </span>
                        </div>

                        <div className="flex items-center space-x-4">
                          <label className="flex items-center text-xs text-indigo-600 font-medium cursor-pointer hover:text-indigo-800">
                            <input
                              type="checkbox"
                              checked={isAllSelectedForPage(page.key)}
                              onChange={(e) =>
                                handleSelectAllForPage(page.key, e.target.checked)
                              }
                              className="mr-1.5 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>Toggle All</span>
                          </label>

                          <div className="flex space-x-3 text-xs text-gray-700">
                            {[
                              "canView",
                              "canCreate",
                              "canEdit",
                              "canDelete",
                            ].map((action) => (
                              <label key={action} className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={permission?.[action] || false}
                                  onChange={() =>
                                    handlePermissionToggle(page.key, action)
                                  }
                                  className="mr-1 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="capitalize">
                                  {action.replace("can", "").toLowerCase()}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowRoleForm(false);
                    setEditingRole(null);
                    setRoleForm({
                      name: "",
                      description: "",
                      permissions: [],
                    });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition"
                >
                  {editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE BRAND NEW ADMIN USER (WITH EMAIL & PASSWORD) */}
      {/* ========================================================================= */}
      {showUserForm && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                {editingUser ? "Edit Admin User Role" : "Create Brand New Admin Account"}
              </h3>
              <button
                onClick={() => {
                  setShowUserForm(false);
                  setEditingUser(null);
                  setUserForm({
                    fullname: "",
                    email: "",
                    password: "",
                    adminRoleId: "",
                  });
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editingUser && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong>Tip:</strong> If the user is already registered on Inxyme, use{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserForm(false);
                      setShowAssignModal(true);
                    }}
                    className="underline font-semibold hover:text-amber-900"
                  >
                    Grant Access to Existing User
                  </button>{" "}
                  instead of creating a duplicate account!
                </div>
              </div>
            )}

            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullname}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      fullname: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min. 6 characters"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Admin Role Template *
                </label>
                <select
                  required
                  value={userForm.adminRoleId}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      adminRoleId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                >
                  <option value="">-- Select a role template --</option>
                  {roles.map((role) => (
                    <option key={role._id} value={role._id}>
                      {role.name} - {role.description || "Custom permissions"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserForm(false);
                    setEditingUser(null);
                    setUserForm({
                      fullname: "",
                      email: "",
                      password: "",
                      adminRoleId: "",
                    });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition"
                >
                  {editingUser ? "Update User" : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
