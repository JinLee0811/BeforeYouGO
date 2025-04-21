import "../styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "../components/layout/Layout";

declare global {
  interface Window {
    initMap: () => void;
  }
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const loadGoogleMapsScript = () => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    };

    if (
      typeof window !== "undefined" &&
      !document.querySelector('script[src*="maps.googleapis.com"]')
    ) {
      loadGoogleMapsScript();
    }

    // Check system preference on initial load
    if (typeof window !== "undefined") {
      const isDark =
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    }
  }, []);

  return (
    <div className='min-h-screen bg-white dark:bg-gray-900 dark:text-white transition-colors'>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}

export default MyApp;
