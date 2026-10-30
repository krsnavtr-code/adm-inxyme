import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Select, message, Spin, Tag, Input } from "antd";
import { FaSearch, FaBook, FaTimes, FaGraduationCap } from "react-icons/fa";
import api from "../../api/axios";

const { Option } = Select;

const EnrollUserModal = ({ visible, onCancel, onEnroll, userId, userName }) => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState("");

  // Fetch user's current enrollments and all available courses
  const fetchData = async () => {
    if (!visible || !userId) return;

    try {
      setLoading(true);

      // 1. Fetch all available courses
      const coursesResponse = await api.get("/courses");
      let allCourses = [];
      if (Array.isArray(coursesResponse.data)) {
        allCourses = coursesResponse.data;
      } else if (Array.isArray(coursesResponse.data?.data)) {
        allCourses = coursesResponse.data.data;
      }
      setCourses(allCourses);

      // 2. Fetch user's enrollments from API (try /enrollments/user/:id first, then /enrollments/my-enrollments)
      let enrollments = [];
      try {
        const enrollmentsResponse = await api.get(`/enrollments/user/${userId}`);
        if (
          enrollmentsResponse.data?.success &&
          Array.isArray(enrollmentsResponse.data.data)
        ) {
          enrollments = enrollmentsResponse.data.data;
        } else if (Array.isArray(enrollmentsResponse.data)) {
          enrollments = enrollmentsResponse.data;
        }
      } catch {
        try {
          const fallbackRes = await api.get("/enrollments/my-enrollments", {
            params: {
              userId,
              limit: 100,
            },
          });
          if (
            fallbackRes.data?.success &&
            Array.isArray(fallbackRes.data.data)
          ) {
            enrollments = fallbackRes.data.data;
          } else if (Array.isArray(fallbackRes.data)) {
            enrollments = fallbackRes.data;
          }
        } catch (fbErr) {
          console.warn("Fallback enrollment fetch failed:", fbErr);
        }
      }

      // 3. Fetch direct user record to capture user.enrolledCourses
      try {
        const userRes = await api.get(`/users/${userId}`);
        const userData = userRes.data;

        if (userData && Array.isArray(userData.enrolledCourses)) {
          const existingCourseIds = new Set(
            enrollments
              .map((e) => {
                if (e.course && typeof e.course === "object")
                  return e.course._id?.toString();
                if (e.course) return e.course.toString();
                if (e.courseId) return e.courseId.toString();
                return null;
              })
              .filter(Boolean)
          );

          userData.enrolledCourses.forEach((c) => {
            if (!c) return;
            const cId = (c._id || c).toString();
            if (!existingCourseIds.has(cId)) {
              existingCourseIds.add(cId);
              const matchedCourse = allCourses.find(
                (ac) => ac._id?.toString() === cId
              );
              enrollments.push({
                _id: `user_course_${cId}`,
                user: userId,
                course:
                  matchedCourse ||
                  (typeof c === "object"
                    ? c
                    : { _id: cId, title: "Enrolled Course" }),
                courseId: cId,
                courseTitle:
                  matchedCourse?.title ||
                  (typeof c === "object" ? c.title : "Enrolled Course"),
                status: "active",
                enrollmentDate:
                  userData.updatedAt || userData.createdAt || new Date(),
                progress: 0,
                isGuestEnrollment: false,
              });
            }
          });
        }
      } catch (userErr) {
        console.warn("Could not fetch user document for enrollments:", userErr);
      }

      setUserEnrollments(enrollments);
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to load enrollment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && userId) {
      fetchData();
      form.resetFields();
      setEnrolledSearchTerm("");
    } else {
      setUserEnrollments([]);
      form.resetFields();
      setEnrolledSearchTerm("");
    }
  }, [visible, userId]);

  // Set of course IDs already enrolled by this user
  const enrolledCourseIds = useMemo(() => {
    return new Set(
      userEnrollments
        .map((e) => {
          if (e.course && typeof e.course === "object")
            return e.course._id?.toString();
          if (e.course) return e.course.toString();
          if (e.courseId) return e.courseId.toString();
          return null;
        })
        .filter(Boolean)
    );
  }, [userEnrollments]);

  // Sort courses alphabetically by title
  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "")
    );
  }, [courses]);

  // Courses not yet enrolled
  const availableCourses = useMemo(() => {
    return sortedCourses.filter(
      (course) => !enrolledCourseIds.has(course._id?.toString())
    );
  }, [sortedCourses, enrolledCourseIds]);

  // Filter enrolled courses by search term
  const filteredUserEnrollments = useMemo(() => {
    if (!enrolledSearchTerm.trim()) return userEnrollments;
    const query = enrolledSearchTerm.toLowerCase().trim();
    return userEnrollments.filter((e) => {
      const title = (
        e.course?.title ||
        e.courseTitle ||
        ""
      ).toLowerCase();
      const status = (e.status || "").toLowerCase();
      return title.includes(query) || status.includes(query);
    });
  }, [userEnrollments, enrolledSearchTerm]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const selectedCourseIds = Array.isArray(values.courseIds)
        ? values.courseIds
        : [values.courseIds].filter(Boolean);

      if (selectedCourseIds.length === 0) {
        message.warning("Please select at least one course to enroll");
        return;
      }

      setEnrolling(true);
      await onEnroll(userId, selectedCourseIds, values.status || "active");
      message.success(
        `Successfully enrolled user in ${selectedCourseIds.length} course${
          selectedCourseIds.length > 1 ? "s" : ""
        }`
      );
      form.resetFields();
      // Re-fetch so the enrolled list immediately reflects all enrolled courses
      await fetchData();
      onCancel();
    } catch (error) {
      console.error("Error enrolling user:", error);
      message.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to enroll user in course(s)"
      );
    } finally {
      setEnrolling(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      active: { color: "green", text: "Active" },
      pending: { color: "orange", text: "Pending" },
      completed: { color: "blue", text: "Completed" },
      rejected: { color: "red", text: "Rejected" },
    };

    const statusInfo = statusMap[status] || { color: "default", text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const handleSelectAllAvailable = () => {
    form.setFieldsValue({
      courseIds: availableCourses.map((c) => c._id),
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <FaGraduationCap className="text-base" />
          </div>
          <div>
            <span className="font-semibold text-gray-900 block leading-tight">
              Manage Enrolled Courses & New Enrollment
            </span>
            {userName && (
              <span className="block text-xs font-normal text-gray-500 mt-0.5">
                User: <span className="font-medium text-gray-800">{userName}</span>
              </span>
            )}
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={enrolling}
      okText={
        enrolling
          ? "Enrolling..."
          : availableCourses.length === 0
          ? "Close"
          : "Enroll in Selected Course(s)"
      }
      cancelText="Cancel"
      width={650}
      okButtonProps={{
        disabled: loading || (availableCourses.length === 0 && !enrolling),
      }}
    >
      <Spin spinning={loading}>
        <div className="py-2 space-y-5">
          {/* Currently Enrolled Courses Section */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <FaBook className="text-indigo-600 text-xs" />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Currently Enrolled Courses ({userEnrollments.length})
                </span>
              </div>

              {userEnrollments.length > 3 && (
                <div className="w-48">
                  <Input
                    size="small"
                    placeholder="Search enrolled..."
                    prefix={<FaSearch className="text-gray-400 text-xs mr-1" />}
                    value={enrolledSearchTerm}
                    onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                    allowClear
                  />
                </div>
              )}
            </div>

            {userEnrollments.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-lg border border-dashed border-gray-300">
                <p className="text-xs text-gray-500 italic">
                  This user is not enrolled in any courses yet.
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Select courses below to enroll this user.
                </p>
              </div>
            ) : filteredUserEnrollments.length === 0 ? (
              <div className="p-3 text-center bg-white rounded-lg border border-gray-200 text-xs text-gray-500">
                No enrolled courses match "{enrolledSearchTerm}".
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {filteredUserEnrollments.map((enrollment) => {
                  const courseTitle =
                    enrollment.course?.title ||
                    enrollment.courseTitle ||
                    "Course";
                  const enrolledDate =
                    enrollment.enrollmentDate || enrollment.createdAt;
                  const thumbnail =
                    enrollment.course?.thumbnail ||
                    enrollment.course?.image ||
                    null;

                  return (
                    <div
                      key={
                        enrollment._id ||
                        `${enrollment.courseId || enrollment.course}-${Math.random()}`
                      }
                      className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-xs hover:border-gray-300 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt=""
                            className="w-10 h-10 rounded-md object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 shrink-0">
                            <FaBook className="text-xs" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div
                            className="font-semibold text-gray-900 text-sm truncate"
                            title={courseTitle}
                          >
                            {courseTitle}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                            {enrolledDate && (
                              <span>
                                Enrolled:{" "}
                                {new Date(enrolledDate).toLocaleDateString()}
                              </span>
                            )}
                            {enrollment.progress !== undefined && (
                              <span className="text-indigo-600 font-medium">
                                Progress: {enrollment.progress}%
                              </span>
                            )}
                            {enrollment.batch?.name && (
                              <span className="text-gray-600">
                                Batch: {enrollment.batch.name}
                              </span>
                            )}
                            {enrollment.certificateIssued && (
                              <span className="text-emerald-600 font-medium">
                                • Certificate Issued
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {getStatusTag(enrollment.status || "active")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Multi-Course Enrollment Form */}
          {availableCourses.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-center font-medium">
              ✓ User is currently enrolled in all {courses.length} available courses.
            </div>
          ) : (
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-800">
                  Enroll in New Course(s) ({availableCourses.length} available)
                </span>
                {availableCourses.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllAvailable}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer transition-colors"
                  >
                    + Select all {availableCourses.length} available
                  </button>
                )}
              </div>

              <Form form={form} layout="vertical">
                <Form.Item
                  name="courseIds"
                  label={
                    <span className="text-xs font-semibold text-gray-700">
                      Select Course(s) <span className="text-red-500">*</span>
                    </span>
                  }
                  rules={[
                    {
                      required: true,
                      message: "Please select at least one course to enroll",
                    },
                  ]}
                  extra={
                    <span className="text-xs text-gray-500">
                      You can select multiple courses at once. Already enrolled courses are marked and disabled.
                    </span>
                  }
                >
                  <Select
                    mode="multiple"
                    placeholder="Search and select one or multiple courses..."
                    showSearch
                    allowClear
                    maxTagCount="responsive"
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      (option?.label || "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    className="w-full"
                  >
                    {sortedCourses.map((course) => {
                      const isEnrolled = enrolledCourseIds.has(
                        course._id?.toString()
                      );
                      return (
                        <Option
                          key={course._id}
                          value={course._id}
                          disabled={isEnrolled}
                          label={course.title}
                        >
                          <div className="flex justify-between items-center py-0.5">
                            <span
                              className={
                                isEnrolled ? "text-gray-400" : "text-gray-900"
                              }
                            >
                              {course.title}
                            </span>
                            {isEnrolled && (
                              <Tag color="default" className="text-[10px] ml-2">
                                Already Enrolled
                              </Tag>
                            )}
                          </div>
                        </Option>
                      );
                    })}
                  </Select>
                </Form.Item>

                <Form.Item
                  name="status"
                  label={
                    <span className="text-xs font-semibold text-gray-700">
                      Enrollment Status
                    </span>
                  }
                  initialValue="active"
                  rules={[{ required: true, message: "Please select a status" }]}
                >
                  <Select>
                    <Option value="active">Active</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="completed">Completed</Option>
                  </Select>
                </Form.Item>
              </Form>
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default EnrollUserModal;
