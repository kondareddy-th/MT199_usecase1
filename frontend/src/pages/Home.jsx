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

  const getWorkcaseTypeBadge = (workcase_type) => {
    return (
      <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-medium shadow-sm">
        {workcase_type.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="w-full mx-auto px-4 py-8 sm:px-6 bg-gradient-to-b from-white to-gray-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
              <h1 className="text-2xl font-bold text-white">MT Message Processor</h1>
              <p className="text-primary-100 text-sm mt-1">Convert or extract data from SWIFT messages</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Mode Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Processing Mode</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        mode === 'convert' 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setMode('convert')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      Convert MT → MX
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        mode === 'extract' 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setMode('extract')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2h-1.528A6 6 0 004 9.528V4z" />
                        <path fillRule="evenodd" d="M8 10a4 4 0 00-3.446 6.032l-1.261 1.26a1 1 0 101.414 1.415l1.261-1.261A4 4 0 108 10zm-2 4a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                      </svg>
                      Extract Data
                    </button>
                  </div>
                </div>
                
                {/* Input Method Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Input Method</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        inputMethod === 'text' 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setInputMethod('text')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      Text Input
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center ${
                        inputMethod === 'file' 
                          ? 'bg-primary-600 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => setInputMethod('file')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      File Upload
                    </button>
                  </div>
                </div>
                
                {/* Text Input */}
                {inputMethod === 'text' && (
                  <div className="mb-6">
                    <label htmlFor="mtMessage" className="block text-sm font-medium text-gray-700 mb-2">MT Message</label>
                    <textarea
                      id="mtMessage"
                      className="block w-full h-48 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                      value={mtMessage}
                      onChange={(e) => setMtMessage(e.target.value)}
                      placeholder="Paste your MT message here..."
                    ></textarea>
                  </div>
                )}
                
                {/* File Upload */}
                {inputMethod === 'file' && (
                  <div className="mb-6">
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 transition-colors duration-200 px-2 py-1 shadow-sm">
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
                          <p className="pl-1 pt-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          TXT, SWIFT, CSV, XLSX or XLS up to 10MB
                        </p>
                        {file && (
                          <div className="text-sm text-green-600 font-medium mt-2 bg-green-50 py-2 px-3 rounded-lg inline-block">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            {file.name} ({Math.round(file.size / 1024)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Feeling Lucky Option */}
                <div className="mb-6 flex items-center bg-gray-50 p-3 rounded-lg">
                  <input
                    id="feeling-lucky"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={feelingLucky}
                    onChange={() => setFeelingLucky(!feelingLucky)}
                  />
                  <label htmlFor="feeling-lucky" className="ml-2 block text-sm text-gray-700">
                    <span className="font-medium">I'm Feeling Lucky</span> - Get AI insights on your message
                  </label>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Processing...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Process Message
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                    onClick={handleClear}
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    className="py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 transition-all duration-200 flex items-center justify-center"
                    onClick={() => navigate('/mt199-analyzer')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
                    </svg>
                    MT199 Analyzer
                  </button>
                  <button
                    type="button"
                    className="py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 flex items-center justify-center"
                    onClick={handleViewHistory}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    View History
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
        
        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: result ? 1 : 0, y: result ? 0 : 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full"
        >
          {result && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
                <h2 className="text-xl font-bold text-white">
                  {mode === 'convert' ? 'Conversion Result' : 'Extracted Data'}
                </h2>
                <p className="text-primary-100 text-sm mt-1">
                  {mode === 'convert' ? 'MT to MX conversion complete' : 'Data extraction complete'}
                </p>
              </div>
              
              <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                {/* Single Message Result */}
                {!result.bulk && (
                  <div>
                    {mode === 'convert' && result.camt110 && ( // *** CHANGED: Check for result.camt110 ***
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-gray-800">CAMT.110 (XML)</h3> {/* *** CHANGED: Title *** */}
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(result.camt110, null, 2)); // *** CHANGED: Copy JSON ***
                              toast.success('Copied JSON to clipboard');
                            }}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy JSON {/* *** CHANGED: Button text *** */}
                          </button>
                        </div>
                        <div className="rounded-lg overflow-hidden">
                          <SyntaxHighlighter
                            language="json" // *** CHANGED: Language to json ***
                            style={atomOneDark}
                            customStyle={{ borderRadius: '0.5rem', maxHeight: '350px' }}
                            wrapLines={true}
                            lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                          >
                            {JSON.stringify(result.camt110, null, 2)} {/* *** CHANGED: Display stringified JSON *** */}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    )}
                    
                    {mode === 'extract' && result.attributes && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">Attributes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(result.attributes).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                              <p className="text-xs font-medium text-gray-500 uppercase">{key.replace(/_/g, ' ')}</p>
                              <p className="mt-1 text-sm text-gray-800 font-medium break-words">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* MT199 Workcase Detection */}
                    {result.attributes && result.attributes.workcase_type && (
                      <div className="mb-6">
                        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-sm">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">MT199 STP Failure Detected</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <div className="flex flex-wrap gap-2 mb-2">
                                  <div className="flex items-center">
                                    <span className="font-semibold mr-2">Workcase Type:</span>
                                    {getWorkcaseTypeBadge(result.attributes.workcase_type)}
                                  </div>
                                </div>
                                {/* <p><span className="font-semibold">Confidence:</span> {typeof result.attributes.confidence === 'number' ? `${Math.round(result.attributes.confidence * 100)}%` : result.attributes.confidence}</p> */}
                                {result.attributes.reasoning && (
                                  <div className="mt-2 bg-white bg-opacity-50 p-2 rounded">
                                    <p><span className="font-semibold">Reasoning:</span> {result.attributes.reasoning}</p>
                                  </div>
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
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-indigo-100">
                          <h3 className="text-lg font-semibold mb-2 text-indigo-800">
                            <span className="inline-block mr-2">✨</span>
                            Lucky Insight
                          </h3>
                          <p className="text-indigo-800 font-medium">{result.feeling_lucky.insight}</p>
                          <p className="mt-2 text-gray-700">{result.feeling_lucky.explanation}</p>
                          {result.feeling_lucky.confidence && (
                            <div className="mt-3 bg-white bg-opacity-50 py-1 px-2 rounded inline-block text-sm text-gray-600">
                              Confidence: {typeof result.feeling_lucky.confidence === 'number' ? `${Math.round(result.feeling_lucky.confidence * 100)}%` : result.feeling_lucky.confidence}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Processing Metadata */}
                    <div className="bg-gray-50 rounded-lg p-3 mt-4 text-sm text-gray-500 border border-gray-200">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400">Message ID</p>
                          <p className="font-medium text-gray-600">{result.message_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Processed at</p>
                          <p className="font-medium text-gray-600">{new Date(result.processed_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Processing time</p>
                          <p className="font-medium text-gray-600">{result.processing_time ? `${result.processing_time.toFixed(2)}s` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Bulk Processing Results */}
                {result.bulk && (
                  <div>
                    <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-l-4 border-green-400 p-4 shadow-sm">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
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
                    
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Results Summary</h3>
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                      <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              {mode === 'convert' && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CAMT.110 Available</th>
                              )}
                              {mode === 'extract' && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attributes</th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {result.results.map((item, index) => (
                              <tr key={index} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                                <td className="px-4 py-3 text-sm text-gray-700 font-medium">{item.message_id}</td>
                                <td className="px-4 py-3 text-sm">
                                  {item.error ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                      Error
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Success
                                    </span>
                                  )}
                                </td>
                                {mode === 'convert' && (
                                  <td className="px-4 py-3 text-sm">
                                    {item.camt110 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Yes</span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">No</span>
                                    )}
                                  </td>
                                )}
                                {mode === 'extract' && (
                                  <td className="px-4 py-3 text-sm">
                                    {item.attributes ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{Object.keys(item.attributes).length} found</span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">None</span>
                                    )}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <button
                        type="button"
                        className="py-3 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 flex items-center justify-center"
                        onClick={handleViewHistory}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        View Details in History
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Home;

