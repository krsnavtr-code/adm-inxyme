import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getPendingEnrollments, updateEnrollmentStatus, getAllEnrollments } from '../../api/adminApi';
import { format } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

const AdminEnrollments = () => {
  const { t, i18n } = useTranslation();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const response = await getAllEnrollments({ 
        status: statusFilter === 'all' ? '' : statusFilter,
        search: searchTerm
      });
      setEnrollments(response.data || []);
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error(error.response?.data?.message || t('admin.enrollments.errorFetching'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEnrollments();
  };

  useEffect(() => {
    fetchEnrollments();
  }, [statusFilter]);

  const handleStatusUpdate = async (enrollmentId, status) => {
    try {
      setUpdating(enrollmentId);
      await updateEnrollmentStatus(enrollmentId, status);
      toast.success(`Enrollment ${status} successfully`);
      await fetchPendingEnrollments(); // Refresh the list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    // Handle undefined or null status
    if (!status) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {t('admin.enrollments.status.unknown') || 'UNKNOWN'}
        </span>
      );
    }

    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
    };
    
    const statusText = {
      pending: t('admin.enrollments.status.pending'),
      active: t('admin.enrollments.status.active'),
      rejected: t('admin.enrollments.status.rejected'),
      completed: t('admin.enrollments.status.completed'),
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusText[status] || (typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const locale = i18n.language === 'th' ? th : enUS;
      return format(new Date(dateString), 'PPpp', { locale });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('admin.enrollments.title')}</h1>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-md">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t("admin.enrollments.title")}</h1>
        <div className="flex space-x-4">
          <select
            value={statusFilter}
            onChange={handleStatusFilterChange}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            <option value="all">{t("admin.enrollments.filters.all")}</option>
            <option value="pending">
              {t("admin.enrollments.status.pending")}
            </option>
            <option value="active">
              {t("admin.enrollments.status.active")}
            </option>
            <option value="rejected">
              {t("admin.enrollments.status.rejected")}
            </option>
            <option value="completed">
              {t("admin.enrollments.status.completed")}
            </option>
          </select>

          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              placeholder={t("admin.enrollments.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-l-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("common.search")}
            </button>
          </form>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">
            {t("admin.enrollments.noEnrollments")}
          </p>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.enrollments.table.user")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.enrollments.table.course")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.enrollments.table.status")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.enrollments.table.enrolledAt")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t("admin.enrollments.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {enrollment.user?.fullname || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.user?.email || "N/A"}
                          </div>
                          {enrollment.user?.phone && (
                            <div className="text-sm text-gray-500">
                              {enrollment.user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 font-medium">
                        {enrollment.course?.title || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {t("admin.enrollments.table.instructor")}:{" "}
                        {enrollment.course?.instructor || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(enrollment.status)}
                      <div className="mt-1 text-xs text-gray-500">
                        {Math.round(enrollment.progress || 0)}%{" "}
                        {t("admin.enrollments.table.complete")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(enrollment.enrolledAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {enrollment.status === "pending" && (
                        <div className="space-y-2">
                          <button
                            onClick={() =>
                              handleStatusUpdate(enrollment._id, "active")
                            }
                            disabled={updating === enrollment._id}
                            className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                          >
                            {updating === enrollment._id
                              ? t("common.updating")
                              : t("admin.enrollments.actions.approve")}
                          </button>
                          <button
                            onClick={() =>
                              handleStatusUpdate(enrollment._id, "rejected")
                            }
                            disabled={updating === enrollment._id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {updating === enrollment._id
                              ? t("common.updating")
                              : t("admin.enrollments.actions.reject")}
                          </button>
                        </div>
                      )}
                      {enrollment.status === "active" && (
                        <button
                          onClick={() =>
                            handleStatusUpdate(enrollment._id, "completed")
                          }
                          disabled={updating === enrollment._id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                        >
                          {updating === enrollment._id
                            ? t("common.updating")
                            : t("admin.enrollments.actions.markComplete")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination can be added here */}
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t("common.showing")} <span className="font-medium">1</span>{" "}
                  {t("common.to")}{" "}
                  <span className="font-medium">
                    {Math.min(10, enrollments.length)}
                  </span>{" "}
                  {t("common.of")}{" "}
                  <span className="font-medium">{enrollments.length}</span>{" "}
                  {t("common.results")}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnrollments;
