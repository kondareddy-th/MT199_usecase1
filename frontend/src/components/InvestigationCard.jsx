import React from 'react';
import { motion } from 'framer-motion';

const InvestigationCard = ({ investigation, onClick }) => {
  // Status badge styling
  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Priority badge styling
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    const { action_counts } = investigation;
    
    if (action_counts.total === 0) return 0;
    return Math.round((action_counts.completed / action_counts.total) * 100);
  };
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {investigation.reference_number}
            </h3>
            <p className="text-sm text-gray-500">
              {investigation.customer_name || 'No customer name'}
            </p>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(investigation.status)}`}>
              {investigation.status.replace('_', ' ')}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(investigation.priority)}`}>
              {investigation.priority}
            </span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-gray-500 mb-1">
            <span>Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between text-sm">
            <div>
              <span className="text-gray-500">Created:</span>
              <span className="ml-1 text-gray-700">{formatDate(investigation.created_at)}</span>
            </div>
            <div>
              <span className="text-gray-500">Actions:</span>
              <span className="ml-1 text-gray-700">
                {investigation.action_counts.completed}/{investigation.action_counts.total}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InvestigationCard;