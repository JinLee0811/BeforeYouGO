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
    <div className='byg-page flex min-h-screen flex-col transition-colors'>
      <Head>
        <title>Before You Go</title>
        <meta name='description' content='AI-powered restaurant review analysis for travelers.' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Navbar />

      <main className='container mx-auto flex-grow px-4 py-12 md:py-16'>{children}</main>

      <Footer />
    </div>
  );
}
