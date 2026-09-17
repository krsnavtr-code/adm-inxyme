import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CoursesList from './CoursesList';
import CourseForm from './CourseForm';

const AdminCourses = () => {
  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <Routes>
          <Route index element={<CoursesList />} />
          <Route path="new" element={<CourseForm />} />
          <Route path="edit/:id" element={<CourseForm isEdit={true} />} />
          <Route path="*" element={<Navigate to="/admin/courses" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminCourses;
