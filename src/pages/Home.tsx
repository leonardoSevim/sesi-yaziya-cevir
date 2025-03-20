import React from 'react';
import { Navigate } from 'react-router-dom';

// HomePage'e yönlendirme yapar
const Home: React.FC = () => {
  return <Navigate to="/" replace />;
};

export default Home;