import React, { useState } from 'react';
import RegistrationPage from './components/RegistrationPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  const handleNavigate = (page) => {
    console.log('Navigate to:', page);
    setCurrentPage(page);
  };

  return (
    <div className="App">
      {currentPage === 'register' && <RegistrationPage onNavigate={handleNavigate} />}
      {currentPage === 'login' && <LoginPage onNavigate={handleNavigate} />}
      {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
    </div>
  );
}

export default App;