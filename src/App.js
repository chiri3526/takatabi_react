import React from 'react';
import { BrowserRouter as Router, useLocation } from 'react-router-dom';
// import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import HomePage from './react-pages/HomePage';
import ArticlePage from './react-pages/ArticlePage';
import CategoryPage from './react-pages/CategoryPage';
import './App.css';

function AppContent() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const articleId = searchParams.get('p');
  const category = searchParams.get('category');
  return (
    <Layout>
      {articleId ? (
        <ArticlePage id={articleId} />
      ) : category ? (
        <CategoryPage category={category} />
      ) : (
        <HomePage />
      )}
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// <HelmetProvider>
// </HelmetProvider>

export default App;
