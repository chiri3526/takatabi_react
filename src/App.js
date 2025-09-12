import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
          </Routes>
        </Layout>
      </Router>
    </HelmetProvider>
  );
}

export default App;
