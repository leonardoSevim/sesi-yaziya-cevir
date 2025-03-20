// Ana uygulama bileşeni
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import TranscriptionStatus from './components/TranscriptionStatus';
import TranscriptionHistory from './components/TranscriptionHistory';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="status/:id" element={<TranscriptionStatus />} />
          <Route path="history" element={<TranscriptionHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App; 