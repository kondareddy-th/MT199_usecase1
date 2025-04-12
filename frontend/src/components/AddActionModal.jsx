import React, { useState } from 'react';
import { motion } from 'framer-motion';

const AddActionModal = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    action_type: 'information_request',
    description: '',
    suggested_response: '',
    priority: 'medium',
    deadline_days: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description) {
      alert('Please enter a description');
      return;
    }
    
    setIsSubmitting(true);
    await onSave(formData);
    setIsSubmitting(false);
  };
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-lg max-w-2xl w-full mx-4 shadow-xl overflow-hidden"
      >
        <div className="bg-primary-700 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Add New Action</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="action_type" className="block text-sm font-medium text-gray-700 mb-1">
              Action Type
            </label>
            <select
              id="action_type"
              name="action_type"
              className="input w-full"
              value={formData.action_type}
              onChange={handleChange}
              required
            >
              <option value="information_request">Information Request</option>
              <option value="amendment_request">Amendment Request</option>
              <option value="customer_notification">Customer Notification</option>
              <option value="cancellation">Cancellation</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              className="input w-full"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the action that needs to be taken"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="suggested_response" className="block text-sm font-medium text-gray-700 mb-1">
              Suggested Response (Optional)
            </label>
            <textarea
              id="suggested_response"
              name="suggested_response"
              className="textarea w-full"
              value={formData.suggested_response}
              onChange={handleChange}
              placeholder="Provide a template or suggested text for this action"
              rows={4}
            ></textarea>
          </div>
          
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                className="input w-full"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="deadline_days" className="block text-sm font-medium text-gray-700 mb-1">
                Deadline (Days)
              </label>
              <input
                type="number"
                id="deadline_days"
                name="deadline_days"
                className="input w-full"
                value={formData.deadline_days}
                onChange={handleChange}
                min={1}
                max={30}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Action'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddActionModal;