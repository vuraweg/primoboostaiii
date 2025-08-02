import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext'; // ✅ Import this

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider> {/* ✅ Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </StrictMode>
);
