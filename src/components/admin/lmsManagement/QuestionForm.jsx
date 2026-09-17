import React, { useEffect } from "react";
import { Form, Input, Select, Button, InputNumber, Switch } from "antd";
import {
  MinusCircleOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const questionTypes = [
  { value: "multiple_choice", label: "Multiple Choice (MCQ)" },
  { value: "true_false", label: "True / False" },
  { value: "short_answer", label: "Short Answer" },
  { value: "essay", label: "Essay / Descriptive" },
  { value: "matching", label: "Matching" },
  { value: "fill_in_blank", label: "Fill in the Blank" },
];

const QuestionForm = ({ name, form }) => {
  const questionType =
    Form.useWatch(["questions", name, "questionType"], form) ||
    "multiple_choice";
  const options = Form.useWatch(["questions", name, "options"], form) || [];

  // Set default options when question type changes
  useEffect(() => {
    if (questionType === "true_false") {
      form.setFieldValue(
        ["questions", name, "options"],
        [
          { text: "True", isCorrect: false },
          { text: "False", isCorrect: false },
        ],
      );
    } else if (
      questionType === "short_answer" ||
      questionType === "essay" ||
      questionType === "fill_in_blank"
    ) {
      form.setFieldValue(["questions", name, "options"], []);
    } else if (
      questionType === "multiple_choice" &&
      (!options || options.length === 0)
    ) {
      form.setFieldValue(
        ["questions", name, "options"],
        [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      );
    }
  }, [questionType, name, form]);

  const renderOptions = () => {
    switch (questionType) {
      case "multiple_choice":
      case "matching":
      case "true_false":
        return (
          <Form.List name={[name, "options"]}>
            {(fields, { add, remove }) => (
              <div className="w-full space-y-2 pt-1">
                <span className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                  {questionType === "matching"
                    ? "Match Key-Value Pairs"
                    : "Configure Options / Answers"}
                </span>

                {fields.map((field, idx) => (
                  <div
                    key={field.key}
                    className="flex gap-3 items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 animate-in fade-in duration-150"
                  >
                    <div className="flex-1">
                      <Form.Item
                        {...field}
                        name={[field.name, "text"]}
                        rules={[
                          {
                            required: true,
                            message: "Option text is required",
                          },
                        ]}
                        className="mb-0"
                      >
                        <Input
                          placeholder={
                            questionType === "matching"
                              ? `Match target answer ${idx + 1}...`
                              : questionType === "true_false"
                                ? idx === 0
                                  ? "True"
                                  : "False"
                                : `Enter option ${idx + 1} text...`
                          }
                          disabled={questionType === "true_false"}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 outline-none text-slate-800 text-sm font-medium bg-white"
                        />
                      </Form.Item>
                    </div>

                    {questionType !== "matching" && (
                      <div className="flex items-center gap-1.5 px-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Correct:
                        </span>
                        <Form.Item
                          name={[field.name, "isCorrect"]}
                          valuePropName="checked"
                          initialValue={false}
                          className="mb-0"
                        >
                          <Switch
                            checkedChildren={
                              <CheckOutlined className="text-[9px]" />
                            }
                            unCheckedChildren={
                              <CloseOutlined className="text-[9px]" />
                            }
                            className="bg-slate-300"
                          />
                        </Form.Item>
                      </div>
                    )}

                    {fields.length > 1 && questionType !== "true_false" && (
                      <button
                        type="button"
                        onClick={() => remove(field.name)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete field"
                      >
                        <MinusCircleOutlined className="text-sm" />
                      </button>
                    )}
                  </div>
                ))}

                {questionType !== "true_false" && (
                  <button
                    type="button"
                    onClick={() => add({ text: "", isCorrect: false })}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 w-full mt-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-600 transition-all"
                  >
                    <PlusOutlined className="text-xs" />
                    <span>
                      Add{" "}
                      {questionType === "matching"
                        ? "Match Pair"
                        : "Option Choice"}
                    </span>
                  </button>
                )}
              </div>
            )}
          </Form.List>
        );

      case "short_answer":
      case "essay":
        return (
          <Form.Item
            name={[name, "correctAnswer"]}
            label={
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Reference Correct Answer
              </span>
            }
            rules={[
              { required: true, message: "Please provide the correct answer" },
            ]}
            className="mb-0"
          >
            <TextArea
              rows={questionType === "essay" ? 4 : 2}
              placeholder="Enter the correct answer for evaluation..."
              className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400 resize-none"
            />
          </Form.Item>
        );

      case "fill_in_blank":
        return (
          <Form.Item
            name={[name, "correctAnswer"]}
            label={
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                Correct Answer
              </span>
            }
            rules={[
              {
                required: true,
                message: "Please provide the correct answer",
              },
            ]}
            help={
              <span className="text-[10px] text-indigo-500 font-medium block mt-1">
                Enter the exact word or phrase that correctly fills the
                blank(s). Matches are case-insensitive.
              </span>
            }
            className="mb-0"
          >
            <Input
              placeholder="E.g., Paris"
              className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400"
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 text-left">
      {/* Question Text */}
      <Form.Item
        name={[name, "question"]}
        label={
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Question Statement
          </span>
        }
        rules={[{ required: true, message: "Please enter the question" }]}
        className="mb-0"
      >
        <TextArea
          rows={2}
          placeholder={
            questionType === "fill_in_blank"
              ? "E.g., The capital of France is _____"
              : "Enter the question statement..."
          }
          className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400 resize-none"
        />
      </Form.Item>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Question Type */}
        <div className="sm:col-span-2">
          <Form.Item
            name={[name, "questionType"]}
            label={
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Question Format
              </span>
            }
            rules={[
              { required: true, message: "Please select a question type" },
            ]}
            className="mb-0"
          >
            <Select className="h-[42px] [&_.ant-select-selector]:!rounded-xl [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selector]:!h-full [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center">
              {questionTypes.map((type) => (
                <Option key={type.value} value={type.value}>
                  <span className="font-semibold text-slate-700">
                    {type.label}
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        {/* Points */}
        <div>
          <Form.Item
            name={[name, "points"]}
            label={
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                Award Points
              </span>
            }
            initialValue={1}
            rules={[{ required: true, message: "Points" }]}
            className="mb-0"
          >
            <InputNumber
              min={0}
              className="w-full rounded-xl border border-slate-200 h-[42px] flex items-center font-bold text-slate-700"
            />
          </Form.Item>
        </div>
      </div>

      {/* Render Format Options */}
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
        {renderOptions()}
      </div>

      {/* Explanation */}
      <Form.Item
        name={[name, "explanation"]}
        label={
          <span className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
            <span>Rational Explanation</span>
            <span className="text-[10px] text-slate-400 lowercase font-medium font-sans">
              (optional)
            </span>
          </span>
        }
        className="mb-0"
      >
        <TextArea
          rows={2}
          placeholder="Provide a detailed explanation or solution key that will display after submission..."
          className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-medium placeholder:text-slate-400 resize-none"
        />
      </Form.Item>
    </div>
  );
};

export default QuestionForm;
