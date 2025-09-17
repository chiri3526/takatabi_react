import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import './App.css';

function App() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const articleId = searchParams.get('p');
  return (
    // <HelmetProvider>
      <Router>
        <Layout>
          {articleId ? <ArticlePage id={articleId} /> : <HomePage />}
        </Layout>
      </Router>
    // </HelmetProvider>
  );
}

export default App;
