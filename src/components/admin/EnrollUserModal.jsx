import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Select, message, Spin, Tag } from "antd";
import api from "../../api/axios";

const { Option } = Select;

const EnrollUserModal = ({ visible, onCancel, onEnroll, userId, userName }) => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  // Fetch user's current enrollments and all available courses
  const fetchData = async () => {
    if (!visible || !userId) return;

    try {
      setLoading(true);

      // Fetch all courses
      const coursesResponse = await api.get("/courses");
      let allCourses = [];
      if (Array.isArray(coursesResponse.data)) {
        allCourses = coursesResponse.data;
      } else if (Array.isArray(coursesResponse.data?.data)) {
        allCourses = coursesResponse.data.data;
      }
      setCourses(allCourses);

      // Fetch all enrollments for this user
      const enrollmentsResponse = await api.get(
        "/enrollments/my-enrollments",
        {
          params: {
            userId,
            limit: 100,
          },
        }
      );

      let enrollments = [];
      if (
        enrollmentsResponse.data?.success &&
        Array.isArray(enrollmentsResponse.data.data)
      ) {
        enrollments = enrollmentsResponse.data.data;
      } else if (Array.isArray(enrollmentsResponse.data)) {
        enrollments = enrollmentsResponse.data;
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
    } else {
      setUserEnrollments([]);
      form.resetFields();
    }
  }, [visible, userId]);

  // Set of course IDs already enrolled by this user
  const enrolledCourseIds = useMemo(() => {
    return new Set(
      userEnrollments
        .map((e) => {
          if (e.course && typeof e.course === "object") return e.course._id?.toString();
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
        <div>
          <span className="font-semibold text-gray-900">
            Enroll User in Course(s)
          </span>
          {userName && (
            <span className="block text-xs font-normal text-gray-500 mt-0.5">
              User: <span className="font-medium text-gray-700">{userName}</span>
            </span>
          )}
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
          ? "Done"
          : "Enroll in Selected Course(s)"
      }
      cancelText="Cancel"
      width={600}
      okButtonProps={{
        disabled: loading || (availableCourses.length === 0 && !enrolling),
      }}
    >
      <Spin spinning={loading}>
        <div className="py-2">
          {/* Currently Enrolled Courses Section */}
          <div className="mb-5 bg-gray-50 p-3.5 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Currently Enrolled Courses ({userEnrollments.length})
              </span>
            </div>

            {userEnrollments.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-1">
                This user is not enrolled in any courses yet.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                {userEnrollments.map((enrollment) => {
                  const courseTitle =
                    enrollment.course?.title ||
                    enrollment.courseTitle ||
                    "Course";
                  const enrolledDate =
                    enrollment.enrollmentDate || enrollment.createdAt;

                  return (
                    <div
                      key={enrollment._id || `${enrollment.courseId}-${Math.random()}`}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-md border border-gray-200 text-sm shadow-xs"
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-medium text-gray-900">
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
                            <span>Progress: {enrollment.progress}%</span>
                          )}
                          {enrollment.certificateIssued && (
                            <span className="text-emerald-600 font-medium">
                              • Certificate Issued
                            </span>
                          )}
                        </div>
                      </div>
                      <div>{getStatusTag(enrollment.status || "active")}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* New Multi-Course Enrollment Form */}
          {availableCourses.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center">
              This user is already enrolled in all available courses.
            </div>
          ) : (
            <Form form={form} layout="vertical" className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                  Select Course(s) to Enroll <span className="text-red-500">*</span>
                </label>
                {availableCourses.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllAvailable}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Select all {availableCourses.length} available
                  </button>
                )}
              </div>

              <Form.Item
                name="courseIds"
                rules={[
                  {
                    required: true,
                    message: "Please select at least one course to enroll",
                  },
                ]}
                extra={
                  <span className="text-xs text-gray-500">
                    You can search and select multiple courses from the list.
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
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
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
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default EnrollUserModal;
