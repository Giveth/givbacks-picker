"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import './Header.css';
import givethLogo from '../app/images/givethlogo.png';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <Link href="https://giveth.io/" target="_blank" rel="noopener noreferrer">
            <Image
              src={givethLogo}
              alt="Giveth Logo"
              width={40}
              height={40}
              className="logo-image"
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
