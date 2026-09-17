import React, { useEffect, useMemo, useState } from 'react';
import { Card, Select, Typography, Divider, List, Button, Space, Tag, Spin, Empty, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getCourses } from '../../../api/courseApi';
import { getSprintsByCourse } from '../../../api/sprintApi';
import { getSessionsBySprint } from '../../../api/sessionApi';
import { createTask, getTasksBySession } from '../../../api/taskApi';
import TaskForm from './TaskForm';

const { Title, Text } = Typography;
const { Option } = Select;

const Assessment = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);

  const [tasks, setTasks] = useState([]);

  const [loading, setLoading] = useState({
    courses: false,
    sprints: false,
    sessions: false,
    tasks: false,
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);

  // Load courses
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(prev => ({ ...prev, courses: true }));
        const data = await getCourses();
        setCourses(Array.isArray(data) ? data : (data.data || []));
      } catch (e) {
        message.error('Failed to load courses');
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }
    };
    run();
  }, []);

  // Load sprints when course changes
  useEffect(() => {
    const run = async () => {
      if (!selectedCourse) {
        setSprints([]);
        setSelectedSprint(null);
        return;
      }
      try {
        setLoading(prev => ({ ...prev, sprints: true }));
        const res = await getSprintsByCourse(selectedCourse);
        const s = Array.isArray(res)
          ? res
          : (res?.data?.sprints || res?.data || []);
        setSprints(s);
        setSelectedSprint(null);
        setSessions([]);
        setSelectedSession(null);
        setTasks([]);
      } catch (e) {
        message.error('Failed to load sprints');
      } finally {
        setLoading(prev => ({ ...prev, sprints: false }));
      }
    };
    run();
  }, [selectedCourse]);

  // Load sessions when sprint changes
  useEffect(() => {
    const run = async () => {
      if (!selectedSprint) {
        setSessions([]);
        setSelectedSession(null);
        return;
      }
      try {
        setLoading(prev => ({ ...prev, sessions: true }));
        const res = await getSessionsBySprint(selectedSprint);
        const arr = res?.data?.sessions || res?.data || [];
        setSessions(arr);
        setSelectedSession(null);
        setTasks([]);
      } catch (e) {
        message.error('Failed to load sessions');
      } finally {
        setLoading(prev => ({ ...prev, sessions: false }));
      }
    };
    run();
  }, [selectedSprint]);

  // Load tasks when session changes
  useEffect(() => {
    const run = async () => {
      if (!selectedSession) {
        setTasks([]);
        return;
      }
      try {
        setLoading(prev => ({ ...prev, tasks: true }));
        const res = await getTasksBySession(selectedSession);
        const ts = res?.data?.tasks || res?.tasks || [];
        setTasks(ts);
      } catch (e) {
        message.error(e?.message || 'Failed to load assignments');
      } finally {
        setLoading(prev => ({ ...prev, tasks: false }));
      }
    };
    run();
  }, [selectedSession]);

  const selectedCourseObj = useMemo(() => courses.find(c => c._id === selectedCourse), [courses, selectedCourse]);
  const selectedSprintObj = useMemo(() => sprints.find(s => s._id === selectedSprint), [sprints, selectedSprint]);
  const selectedSessionObj = useMemo(() => sessions.find(s => s._id === selectedSession), [sessions, selectedSession]);

  const handleCreateTask = async (payload) => {
    try {
      await createTask(payload);
      message.success('Assignment created');
      setTaskModalOpen(false);
      // Refresh tasks
      const res = await getTasksBySession(selectedSession);
      const ts = res?.data?.tasks || res?.tasks || [];
      setTasks(ts);
    } catch (e) {
      message.error(e?.message || 'Failed to create assignment');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={3}>Assessment Management</Title>
        <Text type="secondary">Create and manage assignments (assessments) for each course.</Text>
      </div>

      <Card className="mb-4" title="Select Course, Sprint and Session">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Text strong>Course</Text>
            <Select
              placeholder="Select a course"
              value={selectedCourse}
              onChange={setSelectedCourse}
              loading={loading.courses}
              allowClear
              className="w-full mt-2"
              showSearch
              optionFilterProp="children"
            >
              {courses.map(c => (
                <Option key={c._id} value={c._id}>{c.title}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>Sprint</Text>
            <Select
              placeholder="Select a sprint"
              value={selectedSprint}
              onChange={setSelectedSprint}
              loading={loading.sprints}
              disabled={!selectedCourse}
              allowClear
              className="w-full mt-2"
              showSearch
              optionFilterProp="children"
            >
              {sprints.map(s => (
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
          </div>

          <div>
            <Text strong>Session</Text>
            <Select
              placeholder="Select a session"
              value={selectedSession}
              onChange={setSelectedSession}
              loading={loading.sessions}
              disabled={!selectedSprint}
              allowClear
              className="w-full mt-2"
              showSearch
              optionFilterProp="children"
            >
              {sessions.map(s => (
                <Option key={s._id} value={s._id}>{s.name}</Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card
        title={
          <Space>
            <span>Assignments</span>
            {selectedCourseObj && <Tag color="blue">{selectedCourseObj?.title}</Tag>}
            {selectedSprintObj && <Tag color="geekblue">{selectedSprintObj?.name}</Tag>}
            {selectedSessionObj && <Tag color="purple">{selectedSessionObj?.name}</Tag>}
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!selectedSession}
            onClick={() => setTaskModalOpen(true)}
          >
            New Assignment
          </Button>
        }
      >
        {loading.tasks ? (
          <div className="py-8 text-center"><Spin /></div>
        ) : tasks.length === 0 ? (
          <Empty description={selectedSession ? 'No assignments yet' : 'Select a session to view assignments'} />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={tasks}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={<span className="font-medium">{item.title}</span>}
                  description={<span className="text-gray-500">{item.description || '—'}</span>}
                />
                <div>
                  <Tag color="green">{(item.questions || []).length} questions</Tag>
                </div>
              </List.Item>
            )}
          />
        )}
      </Card>

      <TaskForm
        visible={taskModalOpen}
        sessionId={selectedSession}
        onSave={handleCreateTask}
        onCancel={() => setTaskModalOpen(false)}
      />
    </div>
  );
};

export default Assessment;
