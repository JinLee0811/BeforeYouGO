import React from "react";
import Head from "next/head";
// import Header from "./Header"; // Remove this import
import Footer from "./Footer";
import Navbar from "./Navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className='flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors'>
      <Head>
        <title>Before You Go</title>
        <meta name='description' content='AI-powered restaurant review analysis for travelers.' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <main className='flex-grow container mx-auto px-4 py-12 md:py-16'>{children}</main>

      <Footer />
    </div>
  );
}
