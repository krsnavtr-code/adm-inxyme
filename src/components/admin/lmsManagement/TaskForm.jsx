import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Divider, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import QuestionForm from "./QuestionForm";

const { TextArea } = Input;

const TaskForm = ({ visible, onCancel, onSave, sessionId, task = null }) => {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState([0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      if (task) {
        form.setFieldsValue({
          title: task.title || "",
          description: task.description || "",
          questions: task.questions || [
            {
              question: "",
              questionType: "multiple_choice",
              points: 1,
              options: [{ text: "", isCorrect: false }],
              explanation: "",
            },
          ],
        });
        setQuestions(task.questions ? task.questions.map((_, i) => i) : [0]);
      } else {
        form.setFieldsValue({
          title: "",
          description: "",
          questions: [
            {
              question: "",
              questionType: "multiple_choice",
              points: 1,
              options: [{ text: "", isCorrect: false }],
              explanation: "",
            },
          ],
        });
        setQuestions([0]);
      }
    }
  }, [visible, form, task]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Ensure questions have valid data
      const validatedQuestions = (values.questions || []).map((q, index) => ({
        ...q,
        order: index,
        // Ensure options have required fields
        options: (q.options || []).map((opt) => ({
          ...opt,
          text: opt.text || "",
          isCorrect: !!opt.isCorrect,
        })),
      }));

      await onSave({
        ...values,
        sessionId,
        questions: validatedQuestions,
        ...(task?._id ? { _id: task._id } : {}),
      });

      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
      if (error.errorFields) {
        message.error("Please fill in all required fields");
      }
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      question: "",
      questionType: "multiple_choice",
      points: 1,
      options: [{ text: "", isCorrect: false }],
      explanation: "",
    };

    const currentQuestions = form.getFieldValue("questions") || [];

    form.setFieldsValue({
      questions: [...currentQuestions, newQuestion],
    });

    setQuestions((prev) => [...prev, prev.length]);
  };

  const removeQuestion = (index) => {
    if (questions.length <= 1) {
      message.warning("At least one question is required");
      return;
    }

    const currentQuestions = form.getFieldValue("questions") || [];

    form.setFieldsValue({
      questions: currentQuestions.filter((_, i) => i !== index),
    });

    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      title={
        <div className="flex flex-col text-slate-900 border-b border-slate-100 pb-3 -mt-2">
          <span className="text-xs font-black uppercase text-indigo-500 tracking-wider mb-0.5">
            LMS Assessment Unit
          </span>
          <span className="text-xl font-black uppercase tracking-tight">
            {task ? "Modify Assignment" : "Configure New Assignment"}
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      confirmLoading={loading}
      style={{ top: 25 }}
      styles={{
        body: { maxHeight: "72vh", overflowY: "auto", padding: "12px 4px" },
      }}
      className="[&_.ant-modal-content]:rounded-3xl [&_.ant-modal-content]:shadow-2xl [&_.ant-modal-header]:border-0"
      footer={[
        <div
          className="flex justify-end gap-2 pt-4 border-t border-slate-100"
          key="footer-row"
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-7 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 transition-all text-sm"
          >
            {loading
              ? "Configuring..."
              : task
                ? "Save Updates"
                : "Save Assignment"}
          </button>
        </div>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        className="space-y-4"
        initialValues={{
          title: "",
          description: "",
          questions: [
            {
              question: "",
              questionType: "multiple_choice",
              points: 1,
              options: [{ text: "", isCorrect: false }],
              explanation: "",
            },
          ],
        }}
      >
        <div className="grid grid-cols-1 gap-4 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
          {/* Task Title */}
          <Form.Item
            name="title"
            label={
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Assignment Name
              </span>
            }
            rules={[{ required: true, message: "Please enter a title" }]}
            className="mb-0"
          >
            <Input
              placeholder="e.g. Assessment Quiz 1: Javascript Core"
              className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400"
            />
          </Form.Item>

          {/* Task Description */}
          <Form.Item
            name="description"
            label={
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Assigned Guidelines (Optional)
              </span>
            }
            className="mb-0"
          >
            <TextArea
              rows={2}
              placeholder="Provide directions, reference materials, passing score benchmarks or overall task purpose..."
              className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400 resize-none"
            />
          </Form.Item>
        </div>

        <Divider className="my-6">
          <span className="text-xs font-black uppercase text-slate-400 tracking-widest bg-white px-3">
            Interactive Quiz Questionnaire
          </span>
        </Divider>

        <Form.List name="questions">
          {(fields) => (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.key}
                  className="relative border border-slate-200 bg-white hover:border-slate-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-in fade-in duration-200"
                >
                  {/* Question header badge */}
                  <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-3">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black uppercase tracking-wider">
                      Question #{index + 1}
                    </span>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <DeleteOutlined className="text-xs" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>

                  <QuestionForm name={field.name} form={form} />
                </div>
              ))}

              <button
                type="button"
                onClick={addQuestion}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 font-bold rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 transition-all text-sm text-slate-500"
              >
                <PlusOutlined className="text-xs" />
                <span>Add Question to Questionnaire</span>
              </button>
            </div>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

export default TaskForm;
