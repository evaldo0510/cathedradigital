import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ background: 'purple', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Routes>
          <Route path="/" element={<h1 style={{ color: 'white', fontSize: '50px' }}>IF YOU SEE THIS, ROUTES ARE WORKING</h1>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;