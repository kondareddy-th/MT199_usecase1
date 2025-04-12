import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ResolveInvestigationModal = ({ onClose, onSave }) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!resolutionNotes) {
      alert('Please enter resolution notes');
      return;
    }
    
    setIsSubmitting(true);
    await onSave(resolutionNotes);
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
        <div className="bg-accent-600 px-4 py-3 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Resolve Investigation</h3>
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
          <div className="mb-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-accent-100 rounded-full">
              <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-3 text-lg font-medium text-gray-900 text-center">Resolve this investigation</h2>
            <p className="mt-1 text-sm text-gray-500 text-center">
              All actions are completed. Document the resolution details below.
            </p>
          </div>
          
          <div className="mb-6">
            <label htmlFor="resolution-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="resolution-notes"
              className="textarea w-full"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Provide detailed notes about how this investigation was resolved"
              rows={6}
              required
            ></textarea>
            <p className="mt-1 text-xs text-gray-500">
              Include any relevant information that would be helpful for future reference.
            </p>
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
              className="btn btn-accent"
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
                'Resolve Investigation'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ResolveInvestigationModal;