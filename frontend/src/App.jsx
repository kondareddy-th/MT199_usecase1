import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/Home';
import History from './pages/History';
import MessageDetail from './pages/MessageDetail';
import Settings from './pages/Settings';
import Investigations from './pages/Investigations';
import InvestigationDetail from './pages/InvestigationDetail';
import CreateInvestigation from './pages/CreateInvestigation';
import MT199Analyzer from './pages/MT199Analyzer';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// CSS
import './index.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/message/:id" element={<MessageDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/investigations/:id" element={<InvestigationDetail />} />
            <Route path="/investigations/new" element={<CreateInvestigation />} />
            <Route path="/mt199-analyzer" element={<MT199Analyzer />} />
          </Routes>
        </main>
        <Footer />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              style: {
                background: '#065f46',
              },
            },
            error: {
              style: {
                background: '#991b1b',
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;