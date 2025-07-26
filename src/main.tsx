import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
