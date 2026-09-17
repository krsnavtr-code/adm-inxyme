import React, { useState, useEffect } from "react";
import { Modal, Form, Select, message, Spin, Tag } from "antd";
import api from "../../api/axios";

const { Option } = Select;

const EnrollUserModal = ({ visible, onCancel, onEnroll, userId }) => {
  const [form] = Form.useForm();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [currentEnrollment, setCurrentEnrollment] = useState(null);

  // Fetch user's current enrollment and available courses
  useEffect(() => {
    const fetchData = async () => {
      if (!visible || !userId) return;

      try {
        setLoading(true);

        // Fetch courses first
        const coursesResponse = await api.get("/courses");
        setCourses(coursesResponse.data || []);

        // Then fetch enrollments for the user
        const enrollmentsResponse = await api.get(
          "/enrollments/my-enrollments",
          {
            params: {
              userId,
              status: "active", // Only get active enrollments
              limit: 10, // Limit the number of enrollments
              page: 1, // First page
            },
          }
        );

        // Handle the response based on the API structure
        let enrollments = [];
        if (
          enrollmentsResponse.data?.success &&
          Array.isArray(enrollmentsResponse.data.data)
        ) {
          enrollments = enrollmentsResponse.data.data;
        } else if (Array.isArray(enrollmentsResponse.data)) {
          // Fallback in case the response is just an array
          enrollments = enrollmentsResponse.data;
        }

        // Find the most relevant enrollment
        let activeEnrollment = null;
        if (enrollments.length > 0) {
          // Try to find an active enrollment, or just take the first one
          activeEnrollment = enrollments[0];

        }

        if (activeEnrollment) {
          setCurrentEnrollment({
            ...activeEnrollment,
            // Make sure we have the course details from the nested course object
            course: activeEnrollment.course || null,
          });
        } else {
          setCurrentEnrollment(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Failed to load enrollment data");
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchData();
      form.resetFields();
    } else {
      // Reset state when modal is closed
      setCurrentEnrollment(null);
    }
  }, [visible, form, userId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setEnrolling(true);
      await onEnroll(userId, values.courseId, values.status);
      message.success("User enrolled in course successfully");
      onCancel();
    } catch (error) {
      console.error("Error enrolling user:", error);
      message.error(error.message || "Failed to enroll user in course");
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
    return (
      <Tag color={statusInfo.color} style={{ marginLeft: 8 }}>
        {statusInfo.text}
      </Tag>
    );
  };


  return (
    <Modal
      title={
        currentEnrollment
          ? currentEnrollment.course
            ? `Enrolled in: ${currentEnrollment.course.title}`
            : `User's Current Enrollment`
          : "Enroll User in Course"
      }
      open={visible}
      onCancel={onCancel}
      onOk={currentEnrollment ? onCancel : handleSubmit}
      confirmLoading={enrolling}
      okText={currentEnrollment ? "Close" : "Enroll"}
      cancelText="Cancel"
    >
      <Spin spinning={loading}>
        {currentEnrollment ? (
          <div>
            <div className="space-y-2">
              <p className="text-lg font-medium">
                <span className="text-gray-700">Course:</span>{" "}
                {currentEnrollment.course?.title || "N/A"}
                {getStatusTag(currentEnrollment.status || "active")}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Enrolled on:</span>{" "}
                {new Date(
                  currentEnrollment.enrollmentDate ||
                    currentEnrollment.createdAt
                ).toLocaleDateString()}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Progress:</span>{" "}
                {currentEnrollment.progress || 0}%
              </p>
              {currentEnrollment.completedAt && (
                <p className="text-gray-600">
                  <span className="font-medium">Completed on:</span>{" "}
                  {new Date(currentEnrollment.completedAt).toLocaleDateString()}
                </p>
              )}
              {currentEnrollment.certificateIssued && (
                <p className="text-green-600 font-medium">Certificate Issued</p>
              )}
            </div>
          </div>
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="courseId"
              label="Select Course"
              rules={[{ required: true, message: "Please select a course" }]}
            >
              <Select
                placeholder="Select a course"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >=
                  0
                }
              >
                {courses
                  .sort((a, b) => a.title.localeCompare(b.title)) // A → Z sort
                  .map((course) => (
                    <Option key={course._id} value={course._id}>
                      {course.title}
                    </Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="Enrollment Status"
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
      </Spin>
    </Modal>
  );
};

export default EnrollUserModal;
