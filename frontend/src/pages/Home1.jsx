import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('convert');
  const [inputMethod, setInputMethod] = useState('text');
  const [mtMessage, setMtMessage] = useState('');
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feelingLucky, setFeelingLucky] = useState(false);
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    // Load user settings
    const fetchSettings = async () => {
      try {
        const settingsData = await apiService.getSettings();
        setSettings(settingsData);
        setMode(settingsData.default_mode || 'convert');
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!mtMessage && inputMethod === 'text') || (!file && inputMethod === 'file')) {
      toast.error('Please provide an MT message or upload a file');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      if (inputMethod === 'text') {
        // Process single MT message
        const response = await apiService.processMTMessage(mtMessage, mode, null, feelingLucky);
        setResult(response);
        toast.success('MT message processed successfully');
      } else {
        // Upload file
        const response = await apiService.uploadMTFile(file, mode);
        
        if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Handle bulk upload results
          setResult({
            bulk: true,
            processed: response.processed,
            results: response.results
          });
          toast.success(`Processed ${response.processed} messages successfully`);
        } else {
          // Handle single file upload result
          setResult(response);
          toast.success('MT message processed successfully');
        }
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error(error.detail || 'An error occurred while processing the message');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleViewHistory = () => {
    navigate('/history');
  };
  
  const handleClear = () => {
    setMtMessage('');
    setFile(null);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="card">
            <h1 className="text-2xl font-bold mb-6 text-primary-700">MT Message Processor</h1>
            
            <form onSubmit={handleSubmit}>
              {/* Mode Selection */}
              <div className="mb-6">
                <label className="label">Processing Mode</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className={`btn flex-1 ${mode === 'convert' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setMode('convert')}
                  >
                    Convert MT → MX
                  </button>
                  <button
                    type="button"
                    className={`btn flex-1 ${mode === 'extract' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setMode('extract')}
                  >
                    Extract Data
                  </button>
                </div>
              </div>
              
              {/* Input Method Selection */}
              <div className="mb-6">
                <label className="label">Input Method</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className={`btn flex-1 ${inputMethod === 'text' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setInputMethod('text')}
                  >
                    Text Input
                  </button>
                  <button
                    type="button"
                    className={`btn flex-1 ${inputMethod === 'file' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setInputMethod('file')}
                  >
                    File Upload
                  </button>
                </div>
              </div>
              
              {/* Text Input */}
              {inputMethod === 'text' && (
                <div className="mb-6">
                  <label htmlFor="mtMessage" className="label">MT Message</label>
                  <textarea
                    id="mtMessage"
                    className="textarea h-48 font-mono"
                    value={mtMessage}
                    onChange={(e) => setMtMessage(e.target.value)}
                    placeholder="Paste your MT message here..."
                  ></textarea>
                </div>
              )}
              
              {/* File Upload */}
              {inputMethod === 'file' && (
                <div className="mb-6">
                  <label htmlFor="file" className="label">Upload File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".txt,.swift,.csv,.xlsx,.xls"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        TXT, SWIFT, CSV, XLSX or XLS up to 10MB
                      </p>
                      {file && (
                        <p className="text-sm text-green-600 font-medium mt-2">
                          {file.name} ({Math.round(file.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Feeling Lucky Option */}
              <div className="mb-6 flex items-center">
                <input
                  id="feeling-lucky"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={feelingLucky}
                  onChange={() => setFeelingLucky(!feelingLucky)}
                />
                <label htmlFor="feeling-lucky" className="ml-2 block text-sm text-gray-700">
                  I'm Feeling Lucky (Get AI insights)
                </label>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  type="submit"
                  className="btn btn-primary flex-1 flex justify-center items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Processing...</span>
                    </>
                  ) : (
                    'Process Message'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={handleClear}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => navigate('/mt199-analyzer')}
                >
                  MT199 Analyzer
                </button>
                <button
                  type="button"
                  className="btn btn-outline flex-1"
                  onClick={handleViewHistory}
                >
                  View History
                </button>
              </div>
            </form>
          </div>
        </motion.div>
        
        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: result ? 1 : 0, y: result ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {result && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4 text-primary-700">
                {mode === 'convert' ? 'Conversion Result' : 'Extracted Data'}
              </h2>
              
              {/* Single Message Result */}
              {!result.bulk && (
                <div>
                  {mode === 'convert' && result.mx_message && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">MX Message</h3>
                      <SyntaxHighlighter
                        language="xml"
                        style={atomOneDark}
                        customStyle={{ borderRadius: '0.375rem' }}
                        wrapLines={true}
                        lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                      >
                        {result.mx_message}
                      </SyntaxHighlighter>
                    </div>
                  )}
                  
                  {mode === 'extract' && result.attributes && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Attributes</h3>
                      <div className="bg-gray-100 rounded-md p-4">
                        {Object.entries(result.attributes).map(([key, value]) => (
                          <div key={key} className="mb-2">
                            <span className="font-medium text-gray-700">{key}: </span>
                            <span className="text-gray-800">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* MT199 Workcase Detection */}
                  {result.attributes && result.attributes.workcase_type && (
                    <div className="mb-6">
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-yellow-800">MT199 STP Failure Detected</h3>
                            <div className="mt-2 text-sm text-yellow-700">
                              <p><strong>Workcase Type:</strong> {result.attributes.workcase_type}</p>
                              <p><strong>Confidence:</strong> {typeof result.attributes.confidence === 'number' ? `${Math.round(result.attributes.confidence * 100)}%` : result.attributes.confidence}</p>
                              {result.attributes.reasoning && (
                                <p><strong>Reasoning:</strong> {result.attributes.reasoning}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Feeling Lucky Insight */}
                  {result.feeling_lucky && (
                    <div className="mb-6">
                      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold mb-2 text-secondary-800">
                          <span className="inline-block mr-2">✨</span>
                          Lucky Insight
                        </h3>
                        <p className="text-secondary-800 font-medium">{result.feeling_lucky.insight}</p>
                        <p className="mt-2 text-gray-600">{result.feeling_lucky.explanation}</p>
                        {result.feeling_lucky.confidence && (
                          <p className="mt-2 text-sm text-gray-500">
                            Confidence: {typeof result.feeling_lucky.confidence === 'number' ? `${Math.round(result.feeling_lucky.confidence * 100)}%` : result.feeling_lucky.confidence}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Processing Metadata */}
                  <div className="text-sm text-gray-500 mt-4">
                    <p>Message ID: {result.message_id}</p>
                    <p>Processed at: {new Date(result.processed_at).toLocaleString()}</p>
                    <p>Processing time: {result.processing_time ? `${result.processing_time.toFixed(2)}s` : 'N/A'}</p>
                  </div>
                </div>
              )}
              
              {/* Bulk Processing Results */}
              {result.bulk && (
                <div>
                  <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-800">
                          Successfully processed {result.processed} messages
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-2">Results Summary</h3>
                  <div className="bg-gray-100 rounded-md p-4 max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message ID</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          {mode === 'convert' && (
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MX Available</th>
                          )}
                          {mode === 'extract' && (
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {result.results.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2 text-sm text-gray-500">{item.message_id}</td>
                            <td className="px-3 py-2 text-sm">
                              {item.error ? (
                                <span className="text-red-600">Error</span>
                              ) : (
                                <span className="text-green-600">Success</span>
                              )}
                            </td>
                            {mode === 'convert' && (
                              <td className="px-3 py-2 text-sm">
                                {item.mx_message ? (
                                  <span className="text-green-600">Yes</span>
                                ) : (
                                  <span className="text-red-600">No</span>
                                )}
                              </td>
                            )}
                            {mode === 'extract' && (
                              <td className="px-3 py-2 text-sm">
                                {item.attributes ? (
                                  <span className="text-green-600">{Object.keys(item.attributes).length} found</span>
                                ) : (
                                  <span className="text-red-600">None</span>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleViewHistory}
                    >
                      View Details in History
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;