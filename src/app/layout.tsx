"use client";

import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';  
import './globals.css';
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <Header />
          <main>{children}</main>
          <Footer />  
      </body>
    </html>
  );
}