import React from 'react';
import { BrowserRouter } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div style={{ background: 'green', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: 'white', fontSize: '50px' }}>IF YOU SEE THIS, ROUTER IS WORKING</h1>
      </div>
    </BrowserRouter>
  );
};

export default App;