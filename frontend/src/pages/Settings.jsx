import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const Settings = () => {
  const [settings, setSettings] = useState({
    api_key: '',
    model: 'gpt-4o',
    default_mode: 'convert'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Available models
  const models = [
    { value: 'gpt-4o', label: 'GPT-4o (Recommended)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' }
  ];
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const result = await apiService.getSettings();
      setSettings({
        api_key: '',  // Don't populate API key from backend for security
        model: result.model || 'gpt-4o',
        default_mode: result.default_mode || 'convert',
        api_key_set: result.api_key_set,
        api_key_masked: result.api_key_masked
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Only send API key if it has been changed
      const settingsToUpdate = {
        model: settings.model,
        default_mode: settings.default_mode
      };
      
      if (settings.api_key) {
        settingsToUpdate.api_key = settings.api_key;
      }
      
      const result = await apiService.updateSettings(settingsToUpdate);
      
      // Update local state with result
      setSettings({
        ...settings,
        api_key: '',  // Clear API key input
        api_key_set: result.api_key_set,
        api_key_masked: result.api_key_masked
      });
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  const handleClearApiKey = async () => {
    if (!window.confirm('Are you sure you want to remove the API key?')) {
      return;
    }
    
    try {
      await apiService.deleteApiKey();
      setSettings({
        ...settings,
        api_key: '',
        api_key_set: false,
        api_key_masked: null
      });
      toast.success('API key removed successfully');
    } catch (error) {
      console.error("Error removing API key:", error);
      toast.error('Failed to remove API key');
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card">
          <h1 className="text-2xl font-bold mb-6 text-primary-700">Settings</h1>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="large" color="primary" />
              <span className="ml-3 text-gray-600 font-medium">Loading settings...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* OpenAI API Key */}
              <div className="mb-6">
                <label htmlFor="api_key" className="label">
                  OpenAI API Key
                  {settings.api_key_set && (
                    <span className="ml-2 text-xs text-green-600 font-normal">
                      (API key is set)
                    </span>
                  )}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type={showApiKey ? "text" : "password"}
                    id="api_key"
                    name="api_key"
                    className="input pr-10"
                    placeholder={settings.api_key_set ? "API key is already set" : "Enter your OpenAI API key"}
                    value={settings.api_key}
                    onChange={handleChange}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {settings.api_key_masked && (
                  <div className="mt-1 flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      Current key: {settings.api_key_masked}
                    </p>
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:text-red-500"
                      onClick={handleClearApiKey}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Your API key is used to call OpenAI's API. It is stored securely and never shared.
                </p>
              </div>
              
              {/* Model Selection */}
              <div className="mb-6">
                <label htmlFor="model" className="label">Model</label>
                <select
                  id="model"
                  name="model"
                  className="input"
                  value={settings.model}
                  onChange={handleChange}
                >
                  {models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Select the OpenAI model to use for processing MT messages. More powerful models may provide better results but can be slower.
                </p>
              </div>
              
              {/* Default Mode */}
              <div className="mb-6">
                <label className="label">Default Processing Mode</label>
                <div className="mt-1">
                  <div className="flex items-center">
                    <input
                      id="convert"
                      name="default_mode"
                      type="radio"
                      value="convert"
                      checked={settings.default_mode === 'convert'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="convert" className="ml-3 block text-sm font-medium text-gray-700">
                      Convert MT → MX
                    </label>
                  </div>
                  <div className="flex items-center mt-3">
                    <input
                      id="extract"
                      name="default_mode"
                      type="radio"
                      value="extract"
                      checked={settings.default_mode === 'extract'}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <label htmlFor="extract" className="ml-3 block text-sm font-medium text-gray-700">
                      Extract Data Attributes
                    </label>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  This setting determines the default processing mode when you visit the home page.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="submit"
                  className="btn btn-primary flex justify-center items-center"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={fetchSettings}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* API Key Information */}
        <div className="mt-8 card bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">About OpenAI API Keys</h2>
          <div className="text-sm text-gray-600 space-y-3">
            <p>
              You'll need an OpenAI API key to use this application. The API key is used to access OpenAI's models for MT message processing.
            </p>
            <p>
              To get an API key:
            </p>
            <ol className="list-decimal list-inside ml-2 space-y-1">
              <li>Visit <a href="https://platform.openai.com/signup" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">OpenAI's platform</a></li>
              <li>Create an account or sign in</li>
              <li>Navigate to the API keys section</li>
              <li>Create a new secret key</li>
              <li>Copy the key and paste it here</li>
            </ol>
            <p>
              Note: OpenAI may charge for API usage. Check their <a href="https://openai.com/pricing" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500">pricing page</a> for current rates.
            </p>
          </div>
        </div>
        
        {/* MT199 STP Failure Information */}
        <div className="mt-8 card bg-yellow-50">
          <h2 className="text-lg font-semibold mb-4">About MT199 STP Failure Detection</h2>
          <div className="text-sm text-gray-700 space-y-3">
            <p>
              MT Navigator has a special feature for detecting and classifying MT199 messages that failed Straight Through Processing (STP).
            </p>
            <p>
              When processing an MT199 message, the system uses AI to:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Determine if the message represents an STP failure</li>
              <li>Classify the workcase type based on message content</li>
              <li>Provide a confidence score for the classification</li>
              <li>Explain the reasoning behind the classification</li>
            </ul>
            <p>
              This information helps you quickly understand the nature of MT199 messages and take appropriate action.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;