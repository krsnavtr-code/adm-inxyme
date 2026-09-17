import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CategoriesList from './CategoriesList';
import CategoryForm from './CategoryForm';
import { useAuth } from '../../../contexts/AuthContext';

const Categories = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="categories-container">
      <Routes>
        <Route index element={<CategoriesList />} />
        <Route path="new" element={<CategoryForm />} />
        <Route path="edit/:id" element={<CategoryForm />} />
      </Routes>
    </div>
  );
};

export default Categories;
