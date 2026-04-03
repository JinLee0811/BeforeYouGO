import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "../components/layout/Layout";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  return (
    <div className='min-h-screen text-gray-900 dark:text-white transition-colors'>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}

export default MyApp;
