import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as adminApi from "../../api/adminApi";

const AdminManagement = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const [roles, setRoles] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [availablePages, setAvailablePages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, usersRes, pagesRes] = await Promise.all([
        adminApi.getAdminRoles(),
        adminApi.getAdminUsers(),
        adminApi.getAvailablePages(),
      ]);

      // Handle server response structure: { status: "success", data: { roles: [...] } }
      setRoles(rolesRes?.data?.roles || []);
      setAdminUsers(usersRes?.data?.users || []);
      setAvailablePages(pagesRes?.data?.pages || []);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (page, action) => {
    setRoleForm((prev) => {
      const existingPermission = prev.permissions.find((p) => p.page === page);

      if (existingPermission) {
        return {
          ...prev,
          permissions: prev.permissions.map((p) =>
            p.page === page ? { ...p, [action]: !p[action] } : p,
          ),
        };
      } else {
        return {
          ...prev,
          permissions: [
            ...prev.permissions,
            {
              page,
              canView: action === "canView" ? true : false,
              canCreate: action === "canCreate" ? true : false,
              canEdit: action === "canEdit" ? true : false,
              canDelete: action === "canDelete" ? true : false,
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

      if (editingRole) {
        await adminApi.updateAdminRole(editingRole._id, roleForm);
        toast.success("Role updated successfully");
      } else {
        await adminApi.createAdminRole(roleForm);
        toast.success("Role created successfully");
      }

      setShowRoleForm(false);
      setEditingRole(null);
      setRoleForm({ name: "", description: "", permissions: [] });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save role");
    } finally {
      setLoading(false);
    }
  };

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
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save user");
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
      adminRoleId: user.adminRoleId?._id || "",
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
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete role");
      }
    }
  };

  const getPageLabel = (pageKey) => {
    const page = availablePages.find((p) => p.key === pageKey);
    return page ? page.label : pageKey;
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
        <p className="text-gray-600 mt-2">
          Manage admin roles and user permissions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("roles")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "roles"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Admin Roles
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "users"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Admin Users
          </button>
        </nav>
      </div>

      {/* Roles Tab */}
      {activeTab === "roles" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Admin Roles</h2>
            <button
              onClick={() => {
                setEditingRole(null);
                setRoleForm({ name: "", description: "", permissions: [] });
                setShowRoleForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create New Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div
                key={role._id}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.description}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditRole(role)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Permissions:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions
                      .filter((p) => p.canView)
                      .map((permission) => (
                        <span
                          key={permission.page}
                          className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded"
                        >
                          {getPageLabel(permission.page)}
                        </span>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Admin Users</h2>
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
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create Admin User
            </button>
          </div>

          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {user.adminRoleId?.name || "Super Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h3>

              <form onSubmit={handleRoleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    required
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
                    {availablePages.map((page) => {
                      const permission = roleForm.permissions.find(
                        (p) => p.page === page.key,
                      );
                      return (
                        <div
                          key={page.key}
                          className="mb-3 pb-3 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">
                              {page.label}
                            </div>
                            <label className="flex items-center text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                              <input
                                type="checkbox"
                                checked={isAllSelectedForPage(page.key)}
                                onChange={(e) =>
                                  handleSelectAllForPage(
                                    page.key,
                                    e.target.checked,
                                  )
                                }
                                className="mr-1"
                              />
                              <span>Select All</span>
                            </label>
                          </div>
                          <div className="flex space-x-4 text-sm">
                            {[
                              "canView",
                              "canCreate",
                              "canEdit",
                              "canDelete",
                            ].map((action) => (
                              <label key={action} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={permission?.[action] || false}
                                  onChange={() =>
                                    handlePermissionToggle(page.key, action)
                                  }
                                  className="mr-1"
                                />
                                <span className="capitalize">
                                  {action.replace("can", "").toLowerCase()}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
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
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editingRole ? "Update Role" : "Create Role"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? "Edit User Role" : "Create Admin User"}
              </h3>

              <form onSubmit={handleUserSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {!editingUser && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={userForm.password}
                      onChange={(e) =>
                        setUserForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Role
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role._id} value={role._id}>
                        {role.name} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3">
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
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {editingUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
