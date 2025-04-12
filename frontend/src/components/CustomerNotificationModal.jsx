import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const CustomerNotificationModal = ({ notification, onClose }) => {
  const [emailSubject, setEmailSubject] = useState(notification.subject);
  const [emailBody, setEmailBody] = useState(notification.body);
  
  const handleCopyToClipboard = () => {
    const fullEmail = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(fullEmail);
    toast.success('Email copied to clipboard');
  };
  
  return (
    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl overflow-hidden"
      >
        <div className="bg-primary-700 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Customer Notification</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-4">
            <label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">
              Email Subject
            </label>
            <input
              type="text"
              id="email-subject"
              className="input w-full"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="email-body" className="block text-sm font-medium text-gray-700 mb-1">
              Email Body
            </label>
            <textarea
              id="email-body"
              className="textarea w-full h-64"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
            ></textarea>
          </div>
          
          <div className="text-xs text-gray-500 mb-6">
            <p>Reference: {notification.reference_number}</p>
            <p>Generated: {new Date(notification.generated_at).toLocaleString()}</p>
            <p>Type: {notification.notification_type.replace('_', ' ')}</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleCopyToClipboard}
              className="btn btn-primary"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerNotificationModal;