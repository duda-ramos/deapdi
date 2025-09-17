import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('🚀 Main: Starting application');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {console.log('🚀 Main: Rendering App in StrictMode')}
    <App />
  </StrictMode>
);
