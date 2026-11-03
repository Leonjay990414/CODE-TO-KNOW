import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { HomePage } from '../pages/public/HomePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
};

export default App;
