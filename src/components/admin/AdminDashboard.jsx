import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCategories } from "../../api/categoryApi";
import { getCourses, deleteCourse } from "../../api/courseApi";
import userApi from "../../api/userApi";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";

const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleDeleteCourse = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await deleteCourse(id);
        // Refresh the courses list after deletion
        const response = await getCourses();
        setCourses(response.data || []);
        toast.success("Course deleted successfully");
      } catch (error) {
        console.error("Error deleting course:", error);
        toast.error("Failed to delete course");
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch categories
        try {
          const categoriesRes = await getCategories();
          const categoriesData = categoriesRes.data || categoriesRes || [];
          setCategories(categoriesData);
        } catch (error) {
          console.error("Error fetching categories:", error);
          toast.error("Failed to load categories");
        }

        // Fetch courses
        try {
          const coursesRes = await getCourses();
          const coursesData = coursesRes.data || coursesRes || [];
          setCourses(coursesData);
        } catch (error) {
          console.error("Error fetching courses:", error);
          toast.error("Failed to load courses");
        }

        // Fetch users
        try {
          const usersRes = await userApi.getUsers();
          const usersData = usersRes.data || usersRes || [];
          setUsers(usersData);
        } catch (error) {
          console.error("Error fetching users:", error);
          toast.error("Failed to load users");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Setup socket connection for hot lead alerts
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
    });

    socket.on("hot-lead-alert", (data) => {
      toast.info(`🔥 ${data.message} | Call: ${data.phone}`, {
        duration: 10000, // Show for 10 seconds
        position: "top-right",
        style: {
          background: "#FEF3C7",
          color: "#92400E",
          border: "2px solid #F59E0B",
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Quick Actions
  const quickActions = [
    {
      label: "Add New Course",
      icon: "plus",
      link: "/admin/courses/new",
      color: "indigo",
    },
    {
      label: "Add New Category",
      icon: "plus",
      link: "/admin/categories/new",
      color: "green",
    },
  ];

  const totalRevenue = courses.reduce(
    (acc, course) =>
      acc +
      (course.directPayments || []).reduce(
        (acc2, payment) => acc2 + payment.paymentAmount,
        0,
      ),
    0,
  );
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Dashboard Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Categories Card */}
        <div
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/admin/categories")}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">Categories</h3>
              <p className="text-2xl font-semibold text-gray-800">
                {Array.isArray(categories) ? categories.length : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Total Courses Card */}
        <div
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/admin/courses")}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Courses
              </h3>
              <p className="text-2xl font-semibold text-gray-800">
                {courses.length}
              </p>
            </div>
          </div>
        </div>

        {/* Total Students Card */}
        <div
          className="bg-white p-6 rounded-lg shadow-md cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate("/admin/users")}
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0111.357-3.182M15 21v-1a4 4 0 00-4-4H8m11-9a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Students
              </h3>
              <p className="text-2xl font-semibold text-gray-800">
                {Array.isArray(users) ? users.length : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Total Revenue
              </h3>
              <p className="text-2xl font-semibold text-gray-800">
                {totalRevenue}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="flex flex-row space-x-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.link}
                className={`flex items-center p-3 rounded-md bg-${action.color}-50 text-${action.color}-700 hover:bg-${action.color}-100`}
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
