import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import InvestigationCard from '../components/InvestigationCard';
import AnalyticsWidget from '../components/AnalyticsWidget';

const Investigations = () => {
  const navigate = useNavigate();
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 10
  });
  
  useEffect(() => {
    fetchInvestigations();
    fetchAnalytics();
  }, [pagination.offset, pagination.limit, filterStatus, filterPriority]);
  
  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      let url = `/api/investigations?limit=${pagination.limit}&offset=${pagination.offset}`;
      if (filterStatus) url += `&status=${filterStatus}`;
      if (filterPriority) url += `&priority=${filterPriority}`;
      
      const response = await apiService.get(url);
      setInvestigations(response.investigations);
      setPagination({
        ...pagination,
        total: response.total
      });
    } catch (error) {
      console.error("Error fetching investigations:", error);
      toast.error('Failed to load investigations');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAnalytics = async () => {
    try {
      const response = await apiService.get('/api/investigations/analytics/summary');
      setAnalytics(response);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };
  
  const handleViewInvestigation = (id) => {
    navigate(`/investigations/${id}`);
  };
  
  const handleCreateInvestigation = () => {
    navigate('/investigations/new');
  };
  
  const handleFilterChange = (type, value) => {
    if (type === 'status') {
      setFilterStatus(value);
    } else if (type === 'priority') {
      setFilterPriority(value);
    }
    
    // Reset pagination when filters change
    setPagination({
      ...pagination,
      offset: 0
    });
  };
  
  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination({
        ...pagination,
        offset: pagination.offset + pagination.limit
      });
    }
  };
  
  const handlePrevPage = () => {
    if (pagination.offset - pagination.limit >= 0) {
      setPagination({
        ...pagination,
        offset: pagination.offset - pagination.limit
      });
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary-700">Investigations</h1>
          <button
            className="btn btn-primary"
            onClick={handleCreateInvestigation}
          >
            Create Investigation
          </button>
        </div>
        
        {/* Analytics Widgets */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <AnalyticsWidget 
              title="Open Investigations" 
              value={analytics.status_counts.open} 
              icon="inbox" 
              color="blue"
            />
            <AnalyticsWidget 
              title="In Progress" 
              value={analytics.status_counts.in_progress} 
              icon="spinner" 
              color="yellow"
            />
            <AnalyticsWidget 
              title="Resolved" 
              value={analytics.status_counts.resolved} 
              icon="check-circle" 
              color="green"
            />
            <AnalyticsWidget 
              title="Avg. Resolution Time" 
              value={`${Math.round(analytics.avg_resolution_hours)} hours`} 
              icon="clock" 
              color="purple"
            />
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="input"
                value={filterStatus}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="priority-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="input"
                value={filterPriority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="flex-1 flex items-end">
              <button
                className="btn btn-outline w-full"
                onClick={() => {
                  setFilterStatus('');
                  setFilterPriority('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        
        {/* Investigations List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" color="primary" />
            <span className="ml-3 text-gray-600 font-medium">Loading investigations...</span>
          </div>
        ) : (
          <>
            {investigations.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No investigations found</h3>
                <p className="mt-1 text-gray-500">
                  {filterStatus || filterPriority 
                    ? 'Try changing your filters or create a new investigation.' 
                    : 'Create your first investigation to get started.'}
                </p>
                <div className="mt-6">
                  <button
                    onClick={handleCreateInvestigation}
                    className="btn btn-primary"
                  >
                    Create Investigation
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {investigations.map((investigation) => (
                  <InvestigationCard
                    key={investigation.id}
                    investigation={investigation}
                    onClick={() => handleViewInvestigation(investigation.id)}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {investigations.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm">
                <div className="flex justify-between flex-1 sm:hidden">
                  <button
                    onClick={handlePrevPage}
                    disabled={pagination.offset === 0}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.offset === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      pagination.offset + pagination.limit >= pagination.total
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{pagination.offset + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.offset + pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> investigations
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={handlePrevPage}
                        disabled={pagination.offset === 0}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          pagination.offset === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={pagination.offset + pagination.limit >= pagination.total}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          pagination.offset + pagination.limit >= pagination.total
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Investigations;