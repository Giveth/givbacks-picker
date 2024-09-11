import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p className="footer-text">
          © {new Date().getFullYear()} Giveth. 100% cc0.
        </p>
      </div>
    </footer>
  );
};

export default Footer;