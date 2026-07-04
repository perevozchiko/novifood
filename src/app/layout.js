// src/app/layout.js
import React from 'react';
import Sidebar from '../components/Sidebar';

const RootLayout = ({ children }) => {
  return (
    <html>
      <body>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <div style={{ flex: 1, padding: '20px' }}>{children}</div>
        </div>
      </body>
    </html>
  );
};

export default RootLayout;