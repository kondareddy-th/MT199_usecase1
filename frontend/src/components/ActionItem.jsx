import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ActionItem = ({ action, onUpdateStatus, disabled }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getActionTypeIcon = (type) => {
    switch (type) {
      case 'information_request':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'amendment_request':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'customer_notification':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'cancellation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
    }
  };
  
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
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  const isDeadlineNear = () => {
    if (!action.deadline || action.status === 'completed' || action.status === 'cancelled') {
      return false;
    }
    
    const deadline = new Date(action.deadline);
    const now = new Date();
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    return daysRemaining <= 1;
  };
  
  const isOverdue = () => {
    if (!action.deadline || action.status === 'completed' || action.status === 'cancelled') {
      return false;
    }
    
    const deadline = new Date(action.deadline);
    const now = new Date();
    
    return deadline < now;
  };
  
  const handleUpdateStatus = async (newStatus) => {
    setIsUpdating(true);
    await onUpdateStatus(action.id, newStatus, actionNotes);
    setIsUpdating(false);
    setIsExpanded(false);
    setActionNotes('');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg border ${
        isOverdue() ? 'border-red-200' : isDeadlineNear() ? 'border-yellow-200' : 'border-gray-200'
      } overflow-hidden shadow-sm`}
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-2 rounded-full ${
              action.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              {getActionTypeIcon(action.action_type)}
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">{action.description}</h3>
              <div className="flex items-center mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(action.status)}`}>
                  {action.status}
                </span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(action.priority)}`}>
                  {action.priority}
                </span>
                {action.deadline && (
                  <span className={`ml-2 text-xs ${
                    isOverdue() 
                      ? 'text-red-600' 
                      : isDeadlineNear() 
                      ? 'text-yellow-600' 
                      : 'text-gray-500'
                  }`}>
                    Due: {formatDate(action.deadline)}
                    {isOverdue() && ' (Overdue)'}
                    {!isOverdue() && isDeadlineNear() && ' (Soon)'}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {action.suggested_response && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Suggested Response</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{action.suggested_response}</p>
                </div>
              </div>
            )}
            
            {action.notes && (
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{action.notes}</p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            {action.status !== 'completed' && action.status !== 'cancelled' && !disabled && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Update Status</h4>
                <div className="space-y-3">
                  <textarea
                    className="textarea w-full text-sm"
                    placeholder="Add notes about this action (optional)"
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                  ></textarea>
                  
                  <div className="flex flex-wrap gap-2">
                    {action.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus('in_progress')}
                        className="btn btn-sm btn-outline"
                        disabled={isUpdating}
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus('completed')}
                      className="btn btn-sm btn-accent"
                      disabled={isUpdating}
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus('cancelled')}
                      className="btn btn-sm btn-outline text-red-600 hover:bg-red-50 hover:border-red-300"
                      disabled={isUpdating}
                    >
                      Cancel Action
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Timestamps */}
            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
              <p>Created: {formatDate(action.created_at)}</p>
              {action.completed_at && (
                <p>Completed: {formatDate(action.completed_at)}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ActionItem;