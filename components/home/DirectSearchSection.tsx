import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import RestaurantSearch from "../RestaurantSearch";

interface DirectSearchSectionProps {
  isLoading: boolean;
  directUrlInput: string;
  onDirectUrlInputChange: (value: string) => void;
  onSubmit: (url: string) => void;
  onRestaurantSelect: (placeId: string, name: string, url: string) => void;
  isAuthenticated: boolean;
  onAuthRequired: () => void;
}

const DirectSearchSection: React.FC<DirectSearchSectionProps> = ({
  isLoading,
  directUrlInput,
  onDirectUrlInputChange,
  onSubmit,
  onRestaurantSelect,
  isAuthenticated,
  onAuthRequired,
}) => {
  const searchDisabled = isLoading || !isAuthenticated;

  return (
    <div className='byg-panel mb-12 p-6 text-center md:p-8'>
      <SparklesIcon className='mx-auto mb-4 h-10 w-10 text-indigo-600' />
      <h2 className='byg-title mb-3 text-2xl font-bold text-slate-900'>
        Already Know the Restaurant?
      </h2>
      <p className='mx-auto mb-6 max-w-xl text-slate-600'>
        Get instant AI insights by searching its name or pasting its Google Maps URL.
      </p>
      <div className='max-w-lg mx-auto'>
        <div className='mb-4'>
          {isAuthenticated ? (
            <RestaurantSearch onRestaurantSelect={onRestaurantSelect} />
          ) : (
            <button onClick={onAuthRequired} className='byg-btn-primary w-full'>
              Login to search restaurants
            </button>
          )}
        </div>
        <details className='text-sm' open={isAuthenticated}>
          <summary className='cursor-pointer text-indigo-600 hover:underline'>
            Or paste Google Maps URL
          </summary>
          <div className='mt-3 flex gap-2'>
            <input
              type='url'
              className='byg-input flex-1'
              placeholder='https://maps.app.goo.gl/...'
              value={directUrlInput}
              onChange={(e) => onDirectUrlInputChange(e.target.value)}
              disabled={searchDisabled}
            />
            <button
              onClick={() => onSubmit(directUrlInput)}
              disabled={searchDisabled || !directUrlInput.trim()}
              className='byg-btn-primary whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50'>
              Analyze URL
            </button>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DirectSearchSection;
