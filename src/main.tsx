import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// More robust way to get the root element
const rootElement = document.getElementById('root');

// Check if root element exists before rendering
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} else {
  console.error('Root element not found. Make sure there is a DOM element with id "root" in your HTML.');
}
