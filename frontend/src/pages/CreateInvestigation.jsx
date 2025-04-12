import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateInvestigation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const [messages, setMessages] = useState([]);
  const [formData, setFormData] = useState({
    message_id: '',
    priority: 'medium',
    customer_info: {
      name: '',
      email: '',
      phone: '',
      account_number: '',
      reference: ''
    }
  });
  
  useEffect(() => {
    fetchMessages();

        // Check if we have MT199 analysis in session storage
        const mt199Message = sessionStorage.getItem('mt199_message');
        const mt199Analysis = sessionStorage.getItem('mt199_analysis');
        
        if (mt199Message && mt199Analysis) {
          try {
            const analysis = JSON.parse(mt199Analysis);
            
            // Pre-populate customer information if available in extracted fields
            const fields = analysis.extracted_fields || {};
            const customerInfo = {
              name: fields.beneficiary || '',
              account_number: fields.account_number || '',
              reference: fields.related_reference || fields.transaction_reference || '',
              // Others remain empty
              email: '',
              phone: ''
            };
            
            // Set priority based on case type
            let priority = 'medium';
            if (analysis.workcase_type === 'CANCELLATION' || analysis.workcase_type === 'REGULATORY_COMPLIANCE') {
              priority = 'high';
            }
            
            setFormData({
              ...formData,
              priority,
              customer_info: customerInfo
            });
            
            // No need to clear session storage yet, as the user might refresh and want the data
          } catch (error) {
            console.error("Error parsing MT199 analysis from session storage:", error);
          }
        }
  }, []);
  
  const fetchMessages = async () => {
    setFetchingMessages(true);
    try {
      // Get recent MT messages that might need investigation
      const response = await apiService.getMessageHistory(100, 0);
      
      // Filter for MT199 messages or messages with certain attributes
      let filteredMessages = response.messages.filter(message => {
        // Look for MT199 messages
        if (message.message_type === 'MT' && message.content && message.content.includes('199')) {
          return true;
        }
        
        // Look for messages with workcase_type attribute
        if (message.attributes && message.attributes.workcase_type) {
          return true;
        }
        
        return false;
      });
      
      setMessages(filteredMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error('Failed to load messages');
    } finally {
      setFetchingMessages(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      customer_info: {
        ...formData.customer_info,
        [name]: value
      }
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.message_id) {
      toast.error('Please select a message');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await apiService.post('/api/investigations', {
        message_id: formData.message_id,
        priority: formData.priority,
        customer_info: formData.customer_info
      });
      
      toast.success('Investigation created successfully');
      
      // Clear any MT199 data from session storage
      sessionStorage.removeItem('mt199_message');
      sessionStorage.removeItem('mt199_analysis');
      navigate(`/investigations/${response.id}`);
    } catch (error) {
      console.error("Error creating investigation:", error);
      toast.error('Failed to create investigation');
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6 flex items-center">
          <button
            onClick={() => navigate('/investigations')}
            className="mr-4 text-primary-600 hover:text-primary-700"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-primary-700">Create Investigation</h1>
        </div>
        
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Message Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Select Message</h2>
                
                {fetchingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="large" color="primary" />
                    <span className="ml-3 text-gray-600">Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-md text-center">
                    <p className="text-gray-500 mb-2">No relevant messages found</p>
                    <button
                      type="button"
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      onClick={fetchMessages}
                    >
                      Refresh Messages
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Select
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Message ID
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {messages.map((message) => (
                            <tr key={message.id} className={formData.message_id === message.id ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="radio"
                                  name="message_id"
                                  value={message.id}
                                  checked={formData.message_id === message.id.toString()}
                                  onChange={handleChange}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {message.message_id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                  {message.message_type}
                                </span>
                                {message.attributes.workcase_type && (
                                  <span className="ml-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    MT199
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(message.created_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Priority Selection */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Investigation Priority</h2>
                <div className="grid grid-cols-4 gap-3">
                  <label className={`flex p-4 border rounded-md cursor-pointer items-center space-x-3 ${formData.priority === 'low' ? 'bg-gray-50 border-gray-300 ring-2 ring-gray-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="priority"
                      value="low"
                      checked={formData.priority === 'low'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">Low</span>
                  </label>
                  
                  <label className={`flex p-4 border rounded-md cursor-pointer items-center space-x-3 ${formData.priority === 'medium' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="priority"
                      value="medium"
                      checked={formData.priority === 'medium'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">Medium</span>
                  </label>
                  
                  <label className={`flex p-4 border rounded-md cursor-pointer items-center space-x-3 ${formData.priority === 'high' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="priority"
                      value="high"
                      checked={formData.priority === 'high'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">High</span>
                  </label>
                  
                  <label className={`flex p-4 border rounded-md cursor-pointer items-center space-x-3 ${formData.priority === 'critical' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="radio"
                      name="priority"
                      value="critical"
                      checked={formData.priority === 'critical'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-900">Critical</span>
                  </label>
                </div>
              </div>
              
              {/* Customer Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Customer Name
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        className="input"
                        value={formData.customer_info.name}
                        onChange={handleCustomerInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="input"
                        value={formData.customer_info.email}
                        onChange={handleCustomerInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phone"
                        id="phone"
                        className="input"
                        value={formData.customer_info.phone}
                        onChange={handleCustomerInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="account_number"
                        id="account_number"
                        className="input"
                        value={formData.customer_info.account_number}
                        onChange={handleCustomerInfoChange}
                      />
                    </div>
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                      Customer Reference
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="reference"
                        id="reference"
                        className="input"
                        value={formData.customer_info.reference}
                        onChange={handleCustomerInfoChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t border-gray-200 rounded-b-lg">
              <button
                type="button"
                onClick={() => navigate('/investigations')}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !formData.message_id}
              >
                {loading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Creating...</span>
                  </>
                ) : (
                  'Create Investigation'
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateInvestigation;