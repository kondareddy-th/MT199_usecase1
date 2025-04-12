import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const MessageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('original');
  
  useEffect(() => {
    fetchMessage();
  }, [id]);
  
  const fetchMessage = async () => {
    setLoading(true);
    try {
      const result = await apiService.getMessageById(id);
      setMessage(result);
    } catch (error) {
      console.error("Error fetching message:", error);
      toast.error('Failed to load message details');
      navigate('/history');
    } finally {
      setLoading(false);
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
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  const hasAttributes = () => {
    return message && message.attributes && Object.keys(message.attributes).length > 0;
  };
  
  const hasMxMessage = () => {
    return message && message.converted_content;
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
            <span className="ml-3 text-gray-600 font-medium">Loading message details...</span>
          </div>
        ) : message ? (
          <>
            {/* Header */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/history')}
                    className="mr-4 text-primary-600 hover:text-primary-700"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <h1 className="text-2xl font-bold text-primary-700">Message Details</h1>
                </div>
                <p className="text-gray-500 mt-1">ID: {message.message_id}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-primary"
                >
                  Process New Message
                </button>
              </div>
            </div>
            
            {/* Message Metadata */}
            <div className="card mb-6">
              <h2 className="text-xl font-bold mb-4">Message Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Message Type</p>
                  <p className="mt-1 text-base">{message.message_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="mt-1 text-base">{formatDate(message.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Processed At</p>
                  <p className="mt-1 text-base">{formatDate(message.processed_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Processing Time</p>
                  <p className="mt-1 text-base">{message.processing_time ? `${message.processing_time.toFixed(2)} seconds` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Bulk Processing</p>
                  <p className="mt-1 text-base">{message.is_bulk ? 'Yes' : 'No'}</p>
                </div>
                {message.attributes.workcase_type && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Workcase Type</p>
                    <p className="mt-1 text-base">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {message.attributes.workcase_type}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message Content Tabs */}
            <div className="card">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`
                      whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === 'original'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                    `}
                  >
                    Original MT Message
                  </button>
                  
                  {hasMxMessage() && (
                    <button
                      onClick={() => setActiveTab('converted')}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'converted'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                      `}
                    >
                      Converted MX
                    </button>
                  )}
                  
                  {hasAttributes() && (
                    <button
                      onClick={() => setActiveTab('attributes')}
                      className={`
                        whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === 'attributes'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                      `}
                    >
                      Attributes
                    </button>
                  )}
                </nav>
              </div>
              
              <div className="py-4">
                {/* Original MT Message */}
                {activeTab === 'original' && (
                  <div>
                    <div className="bg-gray-100 rounded-md p-4 overflow-x-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">{message.content}</pre>
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                          toast.success('MT message copied to clipboard');
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Converted MX Message */}
                {activeTab === 'converted' && hasMxMessage() && (
                  <div>
                    <SyntaxHighlighter
                      language="xml"
                      style={atomOneDark}
                      customStyle={{ borderRadius: '0.375rem' }}
                      wrapLines={true}
                      lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                    >
                      {message.converted_content}
                    </SyntaxHighlighter>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.converted_content);
                          toast.success('MX message copied to clipboard');
                        }}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150"
                      >
                        <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                        Copy
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Attributes */}
                {activeTab === 'attributes' && hasAttributes() && (
                  <div>
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {Object.entries(message.attributes).map(([key, value]) => (
                          <li key={key}>
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-primary-600 truncate">{key}</p>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {value}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {message.attributes.workcase_type && (
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
                              <p><strong>Workcase Type:</strong> {message.attributes.workcase_type}</p>
                              {message.attributes.confidence && (
                                <p><strong>Confidence:</strong> {
                                  typeof message.attributes.confidence === 'number' 
                                    ? `${Math.round(message.attributes.confidence * 100)}%` 
                                    : message.attributes.confidence
                                }</p>
                              )}
                              {message.attributes.reasoning && (
                                <p><strong>Reasoning:</strong> {message.attributes.reasoning}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="card">
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Message not found</h3>
              <p className="mt-1 text-gray-500">The message you are looking for does not exist or has been deleted.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/history')}
                  className="btn btn-primary"
                >
                  Back to History
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MessageDetail;