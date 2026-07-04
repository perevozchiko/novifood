// src/pages/index.js
import React from 'react';
import Sidebar from '../components/Sidebar';
import HomePageContent from '../components/HomePageContent'; // Предполагая, что у вас есть главная страница

const Home = () => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '20px' }}>
        <HomePageContent />
      </div>
    </div>
  );
};

export default Home;