import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import ActionItem from '../components/ActionItem';
import CustomerNotificationModal from '../components/CustomerNotificationModal';
import AddActionModal from '../components/AddActionModal';
import ResolveInvestigationModal from '../components/ResolveInvestigationModal';

const InvestigationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [investigation, setInvestigation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Modal states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [notificationType, setNotificationType] = useState('status_update');
  const [notification, setNotification] = useState(null);
  const [generatingNotification, setGeneratingNotification] = useState(false);
  
  useEffect(() => {
    fetchInvestigation();
  }, [id]);
  
  const fetchInvestigation = async () => {
    setLoading(true);
    try {
      const result = await apiService.get(`/api/investigations/${id}`);
      setInvestigation(result);
    } catch (error) {
      console.error("Error fetching investigation:", error);
      toast.error('Failed to load investigation details');
      navigate('/investigations');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateActionStatus = async (actionId, newStatus, notes) => {
    try {
      await apiService.put(`/api/investigations/actions/${actionId}`, {
        status: newStatus,
        notes: notes
      });
      
      toast.success('Action status updated');
      fetchInvestigation();
    } catch (error) {
      console.error("Error updating action status:", error);
      toast.error('Failed to update action status');
    }
  };
  
  const handleAddAction = async (actionData) => {
    try {
      await apiService.post(`/api/investigations/${id}/actions`, actionData);
      
      toast.success('Action added successfully');
      setShowAddActionModal(false);
      fetchInvestigation();
    } catch (error) {
      console.error("Error adding action:", error);
      toast.error('Failed to add action');
    }
  };
  
  const handleResolveInvestigation = async (resolutionNotes) => {
    try {
      await apiService.put(`/api/investigations/${id}/resolve`, {
        resolution_notes: resolutionNotes
      });
      
      toast.success('Investigation resolved successfully');
      setShowResolveModal(false);
      fetchInvestigation();
    } catch (error) {
      console.error("Error resolving investigation:", error);
      toast.error('Failed to resolve investigation');
    }
  };
  
  const handleCloseInvestigation = async () => {
    if (!window.confirm('Are you sure you want to close this investigation?')) {
      return;
    }
    
    try {
      await apiService.put(`/api/investigations/${id}/close`);
      
      toast.success('Investigation closed successfully');
      fetchInvestigation();
    } catch (error) {
      console.error("Error closing investigation:", error);
      toast.error('Failed to close investigation');
    }
  };
  
  const handleGenerateNotification = async () => {
    setGeneratingNotification(true);
    setNotification(null);
    
    try {
      const result = await apiService.post(`/api/investigations/${id}/notifications`, {
        notification_type: notificationType
      });
      
      setNotification(result);
      setShowNotificationModal(true);
    } catch (error) {
      console.error("Error generating notification:", error);
      toast.error('Failed to generate customer notification');
    } finally {
      setGeneratingNotification(false);
    }
  };
  
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
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Get pending and completed actions
  const getPendingActions = () => {
    if (!investigation || !investigation.actions) return [];
    return investigation.actions.filter(action => action.status !== 'completed' && action.status !== 'cancelled');
  };
  
  const getCompletedActions = () => {
    if (!investigation || !investigation.actions) return [];
    return investigation.actions.filter(action => action.status === 'completed');
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!investigation || !investigation.actions || investigation.actions.length === 0) return 0;
    
    const total = investigation.actions.length;
    const completed = investigation.actions.filter(action => action.status === 'completed').length;
    
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {loading ? (
          <div className="card flex justify-center items-center py-12">
            <LoadingSpinner size="large" color="primary" />
            <span className="ml-3 text-gray-600 font-medium">Loading investigation details...</span>
          </div>
        ) : investigation ? (
          <>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/investigations')}
                    className="mr-4 text-primary-600 hover:text-primary-700"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h1 className="text-2xl font-bold text-primary-700">Investigation Details</h1>
                </div>
                <div className="flex items-center mt-1">
                  <p className="text-gray-500">Reference: {investigation.reference_number}</p>
                  <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(investigation.status)}`}>
                    {investigation.status.replace('_', ' ')}
                  </span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(investigation.priority)}`}>
                    {investigation.priority}
                  </span>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => setShowAddActionModal(true)}
                  className="btn btn-primary"
                  disabled={investigation.status === 'closed'}
                >
                  Add Action
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="btn btn-outline"
                    disabled={generatingNotification}
                  >
                    {generatingNotification ? (
                      <>
                        <LoadingSpinner size="small" color="primary" />
                        <span className="ml-2">Generating...</span>
                      </>
                    ) : (
                      'Customer Notification'
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="card mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Investigation Progress</h3>
                <span className="text-sm font-medium text-gray-500">{calculateProgress()}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${
                    calculateProgress() === 100 ? 'bg-green-500' : 'bg-primary-600'
                  }`}
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
              
              {investigation.status === 'in_progress' && calculateProgress() === 100 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="btn btn-accent"
                  >
                    Resolve Investigation
                  </button>
                </div>
              )}
              
              {investigation.status === 'resolved' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCloseInvestigation}
                    className="btn btn-outline"
                  >
                    Close Investigation
                  </button>
                </div>
              )}
            </div>
            
            {/* Content Tabs */}
            <div className="card">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === 'overview'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    Overview
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('actions')}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === 'actions'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    Actions
                    {investigation.actions && (
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        getPendingActions().length > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {investigation.actions.length}
                      </span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('message')}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === 'message'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    MT Message
                  </button>
                  
                  {investigation.customer_info && (
                    <button
                      onClick={() => setActiveTab('customer')}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'customer'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                      `}
                    >
                      Customer
                    </button>
                  )}
                </nav>
              </div>
              
              <div className="py-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Investigation Details</h3>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Status</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(investigation.status)}`}>
                                {investigation.status.replace('_', ' ')}
                              </span>
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Priority</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(investigation.priority)}`}>
                                {investigation.priority}
                              </span>
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Created</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(investigation.created_at)}</dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                            <dd className="mt-1 text-sm text-gray-900">{formatDate(investigation.updated_at)}</dd>
                          </div>
                          {investigation.resolved_at && (
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Resolved</dt>
                              <dd className="mt-1 text-sm text-gray-900">{formatDate(investigation.resolved_at)}</dd>
                            </div>
                          )}
                          <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500">Message ID</dt>
                            <dd className="mt-1 text-sm text-gray-900">{investigation.message.message_id}</dd>
                          </div>
                        </dl>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Action Summary</h3>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Total Actions</dt>
                              <dd className="mt-1 text-sm text-gray-900">{investigation.actions?.length || 0}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Completed Actions</dt>
                              <dd className="mt-1 text-sm text-gray-900">{getCompletedActions().length}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Pending Actions</dt>
                              <dd className="mt-1 text-sm text-gray-900">{getPendingActions().length}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Overall Progress</dt>
                              <dd className="mt-1 text-sm text-gray-900">{calculateProgress()}%</dd>
                            </div>
                          </dl>
                        </div>
                        
                        {investigation.resolution_notes && (
                          <div className="mt-6">
                            <h4 className="text-md font-semibold mb-2">Resolution Notes</h4>
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{investigation.resolution_notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Recent Actions */}
                    <div className="mt-8">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Recent Actions</h3>
                        <button
                          className="text-sm text-primary-600 hover:text-primary-800"
                          onClick={() => setActiveTab('actions')}
                        >
                          View All
                        </button>
                      </div>
                      
                      {investigation.actions && investigation.actions.length > 0 ? (
                        <div className="space-y-4">
                          {investigation.actions.slice(0, 3).map(action => (
                            <ActionItem
                              key={action.id}
                              action={action}
                              onUpdateStatus={handleUpdateActionStatus}
                              disabled={investigation.status === 'closed'}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 p-4 rounded-lg text-center">
                          <p className="text-gray-500">No actions found</p>
                          <button
                            onClick={() => setShowAddActionModal(true)}
                            className="mt-2 text-primary-600 hover:text-primary-800 text-sm font-medium"
                            disabled={investigation.status === 'closed'}
                          >
                            Add an action
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">All Actions</h3>
                      <button
                        onClick={() => setShowAddActionModal(true)}
                        className="btn btn-sm btn-primary"
                        disabled={investigation.status === 'closed'}
                      >
                        Add Action
                      </button>
                    </div>
                    
                    {investigation.actions && investigation.actions.length > 0 ? (
                      <div>
                        {/* Pending Actions */}
                        {getPendingActions().length > 0 && (
                          <div className="mb-8">
                            <h4 className="text-md font-semibold mb-3 text-yellow-800">Pending Actions</h4>
                            <div className="space-y-4">
                              {getPendingActions().map(action => (
                                <ActionItem
                                  key={action.id}
                                  action={action}
                                  onUpdateStatus={handleUpdateActionStatus}
                                  disabled={investigation.status === 'closed'}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Completed Actions */}
                        {getCompletedActions().length > 0 && (
                          <div>
                            <h4 className="text-md font-semibold mb-3 text-green-800">Completed Actions</h4>
                            <div className="space-y-4">
                              {getCompletedActions().map(action => (
                                <ActionItem
                                  key={action.id}
                                  action={action}
                                  onUpdateStatus={handleUpdateActionStatus}
                                  disabled={investigation.status === 'closed'}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-8 rounded-lg text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">No actions found</h3>
                        <p className="mt-1 text-gray-500">Get started by creating a new action.</p>
                        <div className="mt-6">
                          <button
                            onClick={() => setShowAddActionModal(true)}
                            className="btn btn-primary"
                            disabled={investigation.status === 'closed'}
                          >
                            Add Action
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* MT Message Tab */}
                {activeTab === 'message' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">MT Message Content</h3>
                    <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">{investigation.message.content}</pre>
                    </div>
                    
                    {/* Message Attributes */}
                    {investigation.message.attributes && investigation.message.attributes.workcase_type && investigation.message.attributes.workcase_type !== "UNKNOWN" && (
                        <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            </div>
                            <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">MT199 STP Failure Detected</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                                <p><strong>Workcase Type:</strong> {investigation.message.attributes.workcase_type}</p>
                                {investigation.message.attributes.reasoning && (
                                <p><strong>Reasoning:</strong> {investigation.message.attributes.reasoning}</p>
                                )}
                            </div>
                            </div>
                        </div>
                        </div>
                    )}

                    {investigation.message.attributes && investigation.message.attributes.workcase_type && investigation.message.attributes.workcase_type === "UNKNOWN" && (
                        <div className="mt-6 bg-gray-50 border-l-4 border-gray-400 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                            </div>
                            <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-800">MT199 Requires Manual Review</h3>
                            <div className="mt-2 text-sm text-gray-700">
                                <p>The workcase type could not be automatically determined. Please review the message manually.</p>
                                {investigation.message.attributes.reasoning && (
                                <p><strong>Context:</strong> {investigation.message.attributes.reasoning}</p>
                                )}
                            </div>
                            </div>
                        </div>
                        </div>
                    )}
                  </div>
                )}
                
                {/* Customer Tab */}
                {activeTab === 'customer' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
                    {investigation.customer_info ? (
                      <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {Object.entries(investigation.customer_info).map(([key, value]) => (
                            <li key={key}>
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-primary-600 truncate">{key}</p>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm text-gray-700">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-gray-500">No customer information available</p>
                      </div>
                    )}
                    
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-3">Customer Communication</h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => {
                            setNotificationType('status_update');
                            handleGenerateNotification();
                          }}
                          className="btn btn-outline"
                          disabled={generatingNotification}
                        >
                          Generate Status Update
                        </button>
                        <button
                          onClick={() => {
                            setNotificationType('request_info');
                            handleGenerateNotification();
                          }}
                          className="btn btn-outline"
                          disabled={generatingNotification}
                        >
                          Generate Information Request
                        </button>
                        {investigation.status === 'resolved' && (
                          <button
                            onClick={() => {
                              setNotificationType('resolution');
                              handleGenerateNotification();
                            }}
                            className="btn btn-outline"
                            disabled={generatingNotification}
                          >
                            Generate Resolution Notice
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Customer Notification Modal */}
            {showNotificationModal && notification && (
              <CustomerNotificationModal
                notification={notification}
                onClose={() => setShowNotificationModal(false)}
              />
            )}
            
            {/* Add Action Modal */}
            {showAddActionModal && (
              <AddActionModal
                onClose={() => setShowAddActionModal(false)}
                onSave={handleAddAction}
              />
            )}
            
            {/* Resolve Investigation Modal */}
            {showResolveModal && (
              <ResolveInvestigationModal
                onClose={() => setShowResolveModal(false)}
                onSave={handleResolveInvestigation}
              />
            )}
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Investigation not found</h3>
              <p className="mt-1 text-gray-500">The investigation you are looking for does not exist or has been deleted.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/investigations')}
                  className="btn btn-primary"
                >
                  Back to Investigations
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default InvestigationDetail;