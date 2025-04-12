import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import apiService from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * Helper to make sure we never try to render a raw object (which React will reject)
 */
const formatValue = (val) => {
  if (val === null || val === undefined) return '-';
  if (Array.isArray(val)) return val.map(formatValue).join(', ');
  if (typeof val === 'object') {
    try {
      return JSON.stringify(val, null, 2);
    } catch {
      return String(val);
    }
  }
  return String(val);
};

const MT199Analyzer = () => {
  const navigate = useNavigate();
  const [mtMessage, setMtMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mtMessage) {
      toast.error('Please enter an MT199 message');
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const result = await apiService.post('/api/mt/analyze-mt199', {
        content: mtMessage,
      });

      setAnalysis(result);
      toast.success('MT199 message analyzed successfully');
    } catch (error) {
      console.error('Error analyzing MT199 message:', error);
      toast.error(error.detail || 'An error occurred while analyzing the message');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMtMessage('');
    setAnalysis(null);
  };

  const handleCreateInvestigation = () => {
    // Store the message in session storage to pre-populate the investigation form
    sessionStorage.setItem('mt199_message', mtMessage);
    sessionStorage.setItem('mt199_analysis', JSON.stringify(analysis));
    navigate('/investigations/new');
  };

  const getWorkcaseTypeBadge = (workcase_type) => (
    <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-medium shadow-sm">
      {formatValue(workcase_type).replace(/_/g, ' ')}
    </span>
  );

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(formatValue(text));
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
              <h1 className="text-2xl font-bold text-white">MT199 Analyzer</h1>
              <p className="text-primary-100 text-sm mt-1">Analyze MT199 messages for workcase types and response templates</p>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="mtMessage" className="block text-sm font-medium text-gray-700 mb-2">
                    MT199 Message
                  </label>
                  <textarea
                    id="mtMessage"
                    className="block w-full h-80 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
                    value={mtMessage}
                    onChange={(e) => setMtMessage(e.target.value)}
                    placeholder="Paste your MT199 message here..."
                  ></textarea>
                  <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    Enter a complete MT199 message to analyze its content and determine the workcase type. The system will provide analysis results, extracted fields, response templates, and suggested timeline.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="submit"
                    className="flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner />
                        <span className="ml-2">Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Analyze Message
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
              </form>
            </div>
          </div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: analysis ? 1 : 0, y: analysis ? 0 : 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full"
          >
            {analysis && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                      <div className="mt-1 flex items-center">
                        <span className="mr-2 text-primary-100 text-sm">Workcase Type:</span>
                        {getWorkcaseTypeBadge(analysis.workcase_type)}
                      </div>
                    </div>
                    {analysis.workcase_type !== 'UNKNOWN' && (
                      <button
                        onClick={handleCreateInvestigation}
                        className="mt-2 sm:mt-0 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm font-medium flex items-center transition-all duration-200 shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Create Investigation
                      </button>
                    )}
                  </div>
                </div>

                {/* Tabbed Content */}
                <div className="border-b border-gray-200 bg-gray-50">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {[
                      { id: 'overview', label: 'Overview', icon: (
                        <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                      ) },
                      { id: 'fields', label: 'Extracted Fields', icon: (
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                      ) },
                      { id: 'response', label: 'Response Template', icon: (
                        <path
                          fillRule="evenodd"
                          d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                          clipRule="evenodd"
                        />
                      ) },
                      { id: 'timeline', label: 'Timeline', icon: (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      ) },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                          activeTab === tab.id
                            ? 'border-primary-500 text-primary-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          {tab.icon}
                        </svg>
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Analysis
                        </h3>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                          <h4 className="font-medium text-gray-800 mb-2">Classification Reasoning</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{formatValue(analysis.reasoning)}</p>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Recommended Next Steps
                        </h3>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 shadow-sm">
                          <ul className="space-y-2">
                            {(analysis.next_steps || []).map((step, index) => (
                              <li key={index} className="flex items-start">
                                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
                                  <span className="text-xs font-bold text-green-600">{index + 1}</span>
                                </span>
                                <span className="text-gray-700">{formatValue(step)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          SLA Timelines
                        </h3>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {Object.entries(analysis.sla || {}).map(([key, value]) => (
                              <div key={key} className="bg-white bg-opacity-60 p-3 rounded-lg shadow-sm">
                                <dt className="text-sm font-medium text-gray-500 capitalize mb-1">
                                  {key.replace(/_/g, ' ')}
                                </dt>
                                <dd className="text-lg font-semibold text-blue-700">
                                  {formatValue(value)} hours
                                </dd>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path
                              fillRule="evenodd"
                              d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Applicable Regulations
                        </h3>
                        <div className="space-y-3">
                          {(analysis.regulations || []).map((regulation, index) => (
                            <div
                              key={index}
                              className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200 shadow-sm"
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-amber-800">{formatValue(regulation.name)}</h4>
                                  <p className="text-sm text-gray-700 mt-1">{formatValue(regulation.description)}</p>
                                </div>
                                <div className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-500 border border-gray-200 ml-2">
                                  Ref: {formatValue(regulation.reference)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Fields Tab */}
                  {activeTab === 'fields' && (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(analysis.extracted_fields || {}).map(([key, value]) => (
                          <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 p-4 bg-gray-50 border-r border-gray-200">
                                {/* Icon logic remains unchanged for brevity */}
                              </div>
                              <div className="p-4 flex-1">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-gray-800 whitespace-pre-wrap break-words">
                                  {formatValue(value)}
                                </p>
                              </div>
                              <button
                                onClick={() => copyToClipboard(value)}
                                className="p-2 text-gray-400 hover:text-primary-500 focus:outline-none focus:text-primary-500 self-start mt-2 mr-2"
                                title="Copy to clipboard"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Template Tab */}
                  {activeTab === 'response' && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Response Template
                          </h3>
                          <button
                            onClick={() => copyToClipboard(analysis.response_template)}
                            className="inline-flex items-center px-3 py-1 border border-primary-300 text-sm leading-5 font-medium rounded-full text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:border-primary-400 focus:shadow-outline-primary active:bg-primary-200 transition ease-in-out duration-150"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy Text
                          </button>
                        </div>
                        <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
                          <pre className="whitespace-pre-wrap text-sm text-gray-700">
                            {formatValue(analysis.response_template)}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            MT199 Response Format
                          </h3>
                          <button
                            onClick={() => copyToClipboard(analysis.mt199_formatted_response)}
                            className="inline-flex items-center px-3 py-1 border border-indigo-300 text-sm leading-5 font-medium rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:border-indigo-400 focus:shadow-outline-indigo active:bg-indigo-200 transition ease-in-out duration-150"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            Copy MT Format
                          </button>
                        </div>
                        <div className="rounded-lg overflow-hidden shadow-sm">
                          <SyntaxHighlighter language="plaintext" style={atomOneDark} customStyle={{ borderRadius: '0.5rem' }}>
                            {formatValue(analysis.mt199_formatted_response)}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timeline Tab */}
                  {activeTab === 'timeline' && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Suggested Investigation Timeline
                      </h3>

                      {/* Visual Timeline */}
                      <div className="relative mb-10 px-6">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-1 bg-gradient-to-r from-blue-300 to-indigo-500 rounded"></div>
                        </div>
                        <div className="relative flex justify-between">
                          {(analysis.timeline || []).map((item, index) => (
                            <div key={index} className="flex flex-col items-center">
                              <div
                                className={`h-7 w-7 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-md ${
                                  (item.status || '').includes('open')
                                    ? 'bg-blue-500'
                                    : (item.status || '').includes('progress')
                                    ? 'bg-yellow-500'
                                    : (item.status || '').includes('pending')
                                    ? 'bg-orange-500'
                                    : (item.status || '').includes('resolve')
                                    ? 'bg-green-500'
                                    : 'bg-gray-500'
                                }`}
                              >
                                <span className="text-white text-xs font-bold">{index + 1}</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-2 font-medium">{formatValue(item.date)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline Details */}
                      <div className="space-y-4 mt-6">
                        {(analysis.timeline || []).map((item, index) => (
                          <div
                            key={index}
                            className="relative pl-8 pb-8 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-0.5 before:bg-gray-200 last:before:hidden"
                          >
                            <div
                              className={`absolute left-0 top-0 h-6 w-6 rounded-full flex items-center justify-center ${
                                (item.status || '').includes('open')
                                  ? 'bg-blue-500'
                                  : (item.status || '').includes('progress')
                                  ? 'bg-yellow-500'
                                  : (item.status || '').includes('pending')
                                  ? 'bg-orange-500'
                                  : (item.status || '').includes('resolve')
                                  ? 'bg-green-500'
                                  : 'bg-gray-500'
                              }`}
                            >
                              <span className="text-white text-xs font-bold">{index + 1}</span>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex flex-wrap justify-between items-center mb-2">
                                <p className="text-sm font-semibold text-gray-800">{formatValue(item.date)}</p>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    (item.status || '').includes('open')
                                      ? 'bg-blue-100 text-blue-800'
                                      : (item.status || '').includes('progress')
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : (item.status || '').includes('pending')
                                      ? 'bg-orange-100 text-orange-800'
                                      : (item.status || '').includes('resolve')
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {formatValue(item.status).replace(/_/g, ' ')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{formatValue(item.action || item.description)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MT199Analyzer;


// import React, { useState } from 'react';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import SyntaxHighlighter from 'react-syntax-highlighter';
// import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// import apiService from '../services/apiService';
// import LoadingSpinner from '../components/LoadingSpinner';

// /**
//  * Safely stringify any value so React never tries to render a raw object.
//  */
// const formatValue = (val) => {
//   if (val === null || val === undefined) return '-';
//   if (Array.isArray(val)) return val.map(formatValue).join(', ');
//   if (typeof val === 'object') {
//     try {
//       return JSON.stringify(val, null, 2);
//     } catch {
//       return String(val);
//     }
//   }
//   return String(val);
// };

// const MT199Analyzer = () => {
//   const navigate = useNavigate();
//   const [mtMessage, setMtMessage] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [analysis, setAnalysis] = useState(null);
//   const [activeTab, setActiveTab] = useState('overview');

//   /**
//    * Convert any backend error object into a readable string for the toast.
//    */
//   const normaliseErrorMessage = (error) => {
//     let errMsg =
//       error?.response?.data?.detail ||
//       error?.response?.data?.message ||
//       error?.message ||
//       'An error occurred while analyzing the message';

//     if (typeof errMsg === 'object') {
//       if (Array.isArray(errMsg)) {
//         errMsg = errMsg.map((e) => e.msg || JSON.stringify(e)).join(', ');
//       } else {
//         errMsg = errMsg.msg || JSON.stringify(errMsg);
//       }
//     }
//     return String(errMsg);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!mtMessage) {
//       toast.error('Please enter an MT199 message');
//       return;
//     }

//     setLoading(true);
//     setAnalysis(null);

//     try {
//       const { data } = await apiService.post('/api/mt/analyze-mt199', { content: mtMessage });
//       setAnalysis(data);
//       toast.success('MT199 message analyzed successfully');
//     } catch (error) {
//       console.error('Error analyzing MT199 message:', error);
//       toast.error(normaliseErrorMessage(error));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleClear = () => {
//     setMtMessage('');
//     setAnalysis(null);
//   };

//   const handleCreateInvestigation = () => {
//     sessionStorage.setItem('mt199_message', mtMessage);
//     sessionStorage.setItem('mt199_analysis', JSON.stringify(analysis));
//     navigate('/investigations/new');
//   };

//   const getWorkcaseTypeBadge = (workcase_type) => (
//     <span className="px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-800 border border-indigo-200 rounded-full text-xs font-medium shadow-sm">
//       {formatValue(workcase_type).replace(/_/g, ' ')}
//     </span>
//   );

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(formatValue(text));
//     toast.success('Copied to clipboard');
//   };

//   /* -------------------------------------------------------------------------- */
//   /*                                 COMPONENT                                  */
//   /* -------------------------------------------------------------------------- */

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* ----------------------------- INPUT PANEL ----------------------------- */}
//           <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
//             <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
//               <h1 className="text-2xl font-bold text-white">MT199 Analyzer</h1>
//               <p className="text-primary-100 text-sm mt-1">Analyze MT199 messages for workcase types and response templates</p>
//             </div>

//             <div className="p-6">
//               <form onSubmit={handleSubmit}>
//                 <div className="mb-6">
//                   <label htmlFor="mtMessage" className="block text-sm font-medium text-gray-700 mb-2">
//                     MT199 Message
//                   </label>
//                   <textarea
//                     id="mtMessage"
//                     className="block w-full h-80 px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 font-mono text-sm"
//                     value={mtMessage}
//                     onChange={(e) => setMtMessage(e.target.value)}
//                     placeholder="Paste your MT199 message here..."
//                   />
//                   <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200">
//                     Enter a complete MT199 message to analyze its content and determine the workcase type. The system will provide analysis results, extracted fields, response templates, and suggested timeline.
//                   </p>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <button
//                     type="submit"
//                     className="flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
//                     disabled={loading}
//                   >
//                     {loading ? (
//                       <>
//                         <LoadingSpinner />
//                         <span className="ml-2">Analyzing...</span>
//                       </>
//                     ) : (
//                       <>
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                           <path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z" clipRule="evenodd" />
//                         </svg>
//                         Analyze Message
//                       </>
//                     )}
//                   </button>
//                   <button
//                     type="button"
//                     className="py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
//                     onClick={handleClear}
//                   >
//                     Clear
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>

//           {/* ----------------------------- RESULTS PANEL ----------------------------- */}
//           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: analysis ? 1 : 0, y: analysis ? 0 : 20 }} transition={{ duration: 0.5, delay: 0.2 }} className="h-full">
//             {analysis && (
//               <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 h-full">
//                 {/* Header */}
//                 <div className="bg-gradient-to-r from-primary-600 to-primary-700 py-4 px-6">
//                   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//                     <div>
//                       <h2 className="text-xl font-bold text-white">Analysis Results</h2>
//                       <div className="mt-1 flex items-center">
//                         <span className="mr-2 text-primary-100 text-sm">Workcase Type:</span>
//                         {getWorkcaseTypeBadge(analysis.workcase_type)}
//                       </div>
//                     </div>
//                     {analysis.workcase_type !== 'UNKNOWN' && (
//                       <button
//                         onClick={handleCreateInvestigation}
//                         className="mt-2 sm:mt-0 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm font-medium flex items-center transition-all duration-200 shadow-sm"
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
//                         </svg>
//                         Create Investigation
//                       </button>
//                     )}
//                   </div>
//                 </div>

//                 {/* Tabs */}
//                 <div className="border-b border-gray-200 bg-gray-50">
//                   <nav className="flex space-x-8 px-6" aria-label="Tabs">
//                     {[
//                       { id: 'overview', label: 'Overview', iconPath: 'M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z' },
//                       { id: 'fields', label: 'Extracted Fields', iconPath: 'M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z' },
//                       { id: 'response', label: 'Response Template', iconPath: 'M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z' },
//                       { id: 'timeline', label: 'Timeline', iconPath: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z' },
//                     ].map((tab) => (
//                       <button
//                         key={tab.id}
//                         onClick={() => setActiveTab(tab.id)}
//                         className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
//                           activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                         }`}
//                       >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
//                           <path d={tab.iconPath} />
//                         </svg>
//                         {tab.label}
//                       </button>
//                     ))}
//                   </nav>
//                 </div>

//                 {/* Tab Content */}
//                 <div className="p-6 overflow-y-auto max-h-[calc(100vh-300px)]">
//                   {/* --------------------------- OVERVIEW TAB --------------------------- */}
//                   {activeTab === 'overview' && (
//                     <div className="space-y-6">
//                       {/* Classification Reasoning */}
//                       <section>
//                         <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
//                           </svg>
//                           Analysis
//                         </h3>
//                         <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
//                           <h4 className="font-medium text-gray-800 mb-2">Classification Reasoning</h4>
//                           <p className="text-gray-700 whitespace-pre-wrap">{formatValue(analysis.reasoning)}</p>
//                         </div>
//                       </section>

//                       {/* Recommended Next Steps */}
//                       <section>
//                         <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//                           </svg>
//                           Recommended Next Steps
//                         </h3>
//                         <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 shadow-sm">
//                           <ul className="space-y-2">
//                             {(analysis.next_steps || []).map((step, index) => (
//                               <li key={index} className="flex items-start">
//                                 <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5">
//                                   <span className="text-xs font-bold text-green-600">{index + 1}</span>
//                                 </span>
//                                 <span className="text-gray-700">{formatValue(step)}</span>
//                               </li>
//                             ))}
//                           </ul>
//                         </div>
//                       </section>

//                       {/* SLA Timelines */}
//                       <section>
//                         <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//                           </svg>
//                           SLA Timelines
//                         </h3>
//                         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 shadow-sm">
//                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                             {Object.entries(analysis.sla || {}).map(([key, value]) => (
//                               <div key={key} className="bg-white bg-opacity-60 p-3 rounded-lg shadow-sm">
//                                 <dt className="text-sm font-medium text-gray-500 capitalize mb-1">{key.replace(/_/g, ' ')}</dt>
//                                 <dd className="text-lg font-semibold text-blue-700">{formatValue(value)} hours</dd>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       </section>

//                       {/* Applicable Regulations */}
//                       <section>
//                         <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center">
//                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
//                             <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
//                           </svg>
//                           Applicable Regulations
//                         </h3>
//                         <div className="space-y-3">
//                           {(analysis.regulations || []).map((regulation, index) => (
//                             <div key={index} className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-lg border border-amber-200 shadow-sm">
//                               <div className="flex items-start">
//                                 <div className="flex-1">
//                                   <h4 className="font-semibold text-amber-800">{formatValue(regulation.name)}</h4>
//                                   <p className="text-sm text-gray-700 mt-1">{formatValue(regulation.description)}</p>
//                                 </div>
//                                 <div className="bg-white px-2 py-1 rounded text-xs font-medium text-gray-500 border border-gray-200 ml-2">Ref: {formatValue(regulation.reference)}</div>
//                               </div>
//                             </div>
//                           ))}
//                         </div>
//                       </section>
//                     </div>
//                   )}

//                   {/* ----------------------- EXTRACTED FIELDS TAB ----------------------- */}
//                   {activeTab === 'fields' && (
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                       {Object.entries(analysis.extracted_fields || {}).map(([key, value]) => (
//                         <div key={key} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
//                           <div className="p-4">
//                             <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{key.replace(/_/g, ' ')}</p>
//                             <p className="text-gray-800 whitespace-pre-wrap break-words">{formatValue(value)}</p>
//                           </div>
//                           <button
//                             onClick={() => copyToClipboard(value)}
//                             className="p-2 text-gray-400 hover:text-primary-500 focus:outline-none focus:text-primary-500 absolute top-2 right-2"
//                             title="Copy to clipboard"
//                           >
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                             </svg>
//                           </button>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {/* ---------------------- RESPONSE TEMPLATE TAB ---------------------- */}
//                   {activeTab === 'response' && (
//                     <div className="space-y-6">
//                       {/* Response Template */}
//                       <section>
//                         <div className="flex justify-between items-center mb-3">
//                           <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary-500" viewBox="0 0 20 20" fill="currentColor">
//                               <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
//                             </svg>
//                             Response Template
//                           </h3>
//                           <button onClick={() => copyToClipboard(analysis.response_template)} className="inline-flex items-center px-3 py-1 border border-primary-300 text-sm leading-5 font-medium rounded-full text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:border-primary-400 focus:shadow-outline-primary active:bg-primary-200 transition ease-in-out duration-150">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                             </svg>
//                             Copy Text
//                           </button>
//                         </div>
//                         <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 shadow-sm">
//                           <pre className="whitespace-pre-wrap text-sm text-gray-700">{formatValue(analysis.response_template)}</pre>
//                         </div>
//                       </section>

//                       {/* MT199 formatted */}
//                       <section>
//                         <div className="flex justify-between items-center mb-3">
//                           <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
//                               <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
//                             </svg>
//                             MT199 Response Format
//                           </h3>
//                           <button onClick={() => copyToClipboard(analysis.mt199_formatted_response)} className="inline-flex items-center px-3 py-1 border border-indigo-300 text-sm leading-5 font-medium rounded-full text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:border-indigo-400 focus:shadow-outline-indigo active:bg-indigo-200 transition ease-in-out duration-150">
//                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
//                             </svg>
//                             Copy MT Format
//                           </button>
//                         </div>
//                         <div className="rounded-lg overflow-hidden shadow-sm">
//                           <SyntaxHighlighter language="plaintext" style={atomOneDark} customStyle={{ borderRadius: '0.5rem' }}>
//                             {formatValue(analysis.mt199_formatted_response)}
//                           </SyntaxHighlighter>
//                         </div>
//                       </section>
//                     </div>
//                   )}

//                   {/* --------------------------- TIMELINE TAB --------------------------- */}
//                   {activeTab === 'timeline' && (
//                     <div>
//                       <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
//                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//                         </svg>
//                         Suggested Investigation Timeline
//                       </h3>

//                       {/* Visual timeline */}
//                       <div className="relative mb-10 px-6">
//                         <div className="absolute inset-0 flex items-center justify-center">
//                           <div className="w-full h-1 bg-gradient-to-r from-blue-300 to-indigo-500 rounded" />
//                         </div>
//                         <div className="relative flex justify-between">
//                           {(analysis.timeline || []).map((item, index) => (
//                             <div key={index} className="flex flex-col items-center">
//                               <div className={`h-7 w-7 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-md ${
//                                 (item.status || '').includes('open')
//                                   ? 'bg-blue-500'
//                                   : (item.status || '').includes('progress')
//                                   ? 'bg-yellow-500'
//                                   : (item.status || '').includes('pending')
//                                   ? 'bg-orange-500'
//                                   : (item.status || '').includes('resolve')
//                                   ? 'bg-green-500'
//                                   : 'bg-gray-500'
//                               }`}>
//                                 <span className="text-white text-xs font-bold">{index + 1}</span>
//                               </div>
//                               <div className="text-xs text-gray-600 mt-2 font-medium">{formatValue(item.date)}</div>
//                             </div>
//                           ))}
//                         </div>
//                       </div>

//                       {/* Detailed timeline */}
//                       <div className="space-y-4 mt-6">
//                         {(analysis.timeline || []).map((item, index) => (
//                           <div key={index} className="relative pl-8 pb-8 before:absolute before:top-0 before:bottom-0 before:left-3 before:w-0.5 before:bg-gray-200 last:before:hidden">
//                             <div className={`absolute left-0 top-0 h-6 w-6 rounded-full flex items-center justify-center ${
//                               (item.status || '').includes('open')
//                                 ? 'bg-blue-500'
//                                 : (item.status || '').includes('progress')
//                                 ? 'bg-yellow-500'
//                                 : (item.status || '').includes('pending')
//                                 ? 'bg-orange-500'
//                                 : (item.status || '').includes('resolve')
//                                 ? 'bg-green-500'
//                                 : 'bg-gray-500'
//                             }`}>
//                               <span className="text-white text-xs font-bold">{index + 1}</span>
//                             </div>
//                             <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
//                               <div className="flex flex-wrap justify-between items-center mb-2">
//                                 <p className="text-sm font-semibold text-gray-800">{formatValue(item.date)}</p>
//                                 <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                                   (item.status || '').includes('open')
//                                     ? 'bg-blue-100 text-blue-800'
//                                     : (item.status || '').includes('progress')
//                                     ? 'bg-yellow-100 text-yellow-800'
//                                     : (item.status || '').includes('pending')
//                                     ? 'bg-orange-100 text-orange-800'
//                                     : (item.status || '').includes('resolve')
//                                     ? 'bg-green-100 text-green-800'
//                                     : 'bg-gray-100 text-gray-800'
//                                 }`}>
//                                   {formatValue(item.status).replace(/_/g, ' ')}
//                                 </span>
//                               </div>
//                               <p className="text-sm text-gray-700">{formatValue(item.action || item.description)}</p>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             )}
//           </motion.div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

// export default MT199Analyzer;
