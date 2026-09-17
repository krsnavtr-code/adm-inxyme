import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

const JobForm = ({ job, courses, onSubmit, onClose }) => {
  const defaultValues = {
    title: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    location: '',
    jobType: 'Full-time',
    salary: '',
    courseId: courses.length > 0 ? courses[0]._id : '',
    status: 'Draft',
    applicationDeadline: ''
  };

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: job ? {
      ...job,
      courseId: job.courseId?._id || job.courseId || (courses.length > 0 ? courses[0]._id : '')
    } : defaultValues
  });

  const [requirements, setRequirements] = useState(job?.requirements || ['']);
  const [responsibilities, setResponsibilities] = useState(job?.responsibilities || ['']);

  useEffect(() => {
    if (job) {
      // Format the date for the date input and ensure courseId is set
      const formattedJob = {
        ...job,
        courseId: job.courseId?._id || job.courseId || (courses.length > 0 ? courses[0]._id : ''),
        applicationDeadline: job.applicationDeadline ? 
          new Date(job.applicationDeadline).toISOString().split('T')[0] : ''
      };
      reset(formattedJob);
      setRequirements(job.requirements || ['']);
      setResponsibilities(job.responsibilities || ['']);
    } else {
      // Reset form when creating a new job
      reset(defaultValues);
      setRequirements(['']);
      setResponsibilities(['']);
    }
  }, [job, reset, courses]);

  const addRequirement = () => setRequirements([...requirements, '']);
  const removeRequirement = (index) => {
    if (requirements.length > 1) {
      const updated = [...requirements];
      updated.splice(index, 1);
      setRequirements(updated);
    }
  };
  const updateRequirement = (index, value) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const addResponsibility = () => setResponsibilities([...responsibilities, '']);
  const removeResponsibility = (index) => {
    if (responsibilities.length > 1) {
      const updated = [...responsibilities];
      updated.splice(index, 1);
      setResponsibilities(updated);
    }
  };
  const updateResponsibility = (index, value) => {
    const updated = [...responsibilities];
    updated[index] = value;
    setResponsibilities(updated);
  };

  const onFormSubmit = (data) => {
    const filteredRequirements = requirements.filter(req => req.trim() !== '');
    const filteredResponsibilities = responsibilities.filter(resp => resp.trim() !== '');
    
    if (filteredRequirements.length === 0 || filteredResponsibilities.length === 0) {
      toast.error('Please add at least one requirement and responsibility');
      return;
    }

    onSubmit({
      ...data,
      requirements: filteredRequirements,
      responsibilities: filteredResponsibilities,
      courseId: data.courseId || (courses.length > 0 ? courses[0]._id : '')
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{job ? 'Edit Job' : 'Create New Job'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
              <input
                type="text"
                {...register('title', { required: 'Job title is required' })}
                className={`w-full px-3 py-2 border rounded-md ${errors.title ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="e.g. Senior Web Developer"
              />
              {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
              <textarea
                {...register('description', { required: 'Job description is required' })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Detailed job description..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Requirements *</label>
                <button type="button" onClick={addRequirement} className="text-sm text-blue-600 hover:text-blue-800">
                  + Add Requirement
                </button>
              </div>
              {requirements.map((req, index) => (
                <div key={index} className="flex items-center mb-2">
                  <span className="mr-2 text-gray-500">•</span>
                  <input
                    type="text"
                    value={req}
                    onChange={(e) => updateRequirement(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={`Requirement ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeRequirement(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Responsibilities *</label>
                <button type="button" onClick={addResponsibility} className="text-sm text-blue-600 hover:text-blue-800">
                  + Add Responsibility
                </button>
              </div>
              {responsibilities.map((resp, index) => (
                <div key={index} className="flex items-center mb-2">
                  <span className="mr-2 text-gray-500">•</span>
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => updateResponsibility(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder={`Responsibility ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeResponsibility(index)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  {...register('location', { required: 'Location is required' })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.location ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="e.g. New York, NY"
                />
                {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type *</label>
                <select
                  {...register('jobType', { required: 'Job type is required' })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.jobType ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (optional)</label>
                <input
                  type="text"
                  {...register('salary')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. $60,000 - $80,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
                <select
                  {...register('status', { required: 'Status is required' })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.status ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="Draft">Draft</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select
                  {...register('courseId', { required: 'Course is required' })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.courseId ? 'border-red-500' : 'border-gray-300'}`}
                >
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                <input
                  type="date"
                  {...register('applicationDeadline', { required: 'Deadline is required' })}
                  className={`w-full px-3 py-2 border rounded-md ${errors.applicationDeadline ? 'border-red-500' : 'border-gray-300'}`}
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.applicationDeadline && (
                  <p className="mt-1 text-sm text-red-600">{errors.applicationDeadline.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {job ? 'Update Job' : 'Create Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
