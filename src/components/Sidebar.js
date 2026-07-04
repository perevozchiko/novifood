// src/components/Sidebar.js
import React from 'react';
import Link from 'next/link';

const Sidebar = () => {
  return (
    <div>
      <nav>
        <ul>
          <li>
            <Link href='/'>Главная</Link>
          </li>
          <li>
            <Link href='/stats'>Stats</Link>
          </li>
          <li>
            <Link href='/product-base'>База продуктов</Link>
          </li>
          <li>
            <Link href='/settings'>Settings</Link>
          </li>
          <li>
            <Link href='/diary'>Diary</Link>
          </li>
          <li>
            <Link href='/history'>History</Link>
          </li>
          <li>
            <Link href='/weight'>Weight</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;