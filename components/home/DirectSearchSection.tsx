import React from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import RestaurantSearch from "../RestaurantSearch";

interface DirectSearchSectionProps {
  isLoading: boolean;
  directUrlInput: string;
  onDirectUrlInputChange: (value: string) => void;
  onSubmit: (url: string) => void;
  onRestaurantSelect: (placeId: string, name: string, url: string) => void;
}

const DirectSearchSection: React.FC<DirectSearchSectionProps> = ({
  isLoading,
  directUrlInput,
  onDirectUrlInputChange,
  onSubmit,
  onRestaurantSelect,
}) => {
  return (
    <div className='bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-lg p-6 md:p-8 mb-12 text-center'>
      <SparklesIcon className='w-10 h-10 text-indigo-600 dark:text-indigo-400 mx-auto mb-4' />
      <h2 className='text-2xl font-bold text-gray-900 dark:text-white mb-3'>
        Already Know the Restaurant?
      </h2>
      <p className='text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto'>
        Get instant AI insights by searching its name or pasting its Google Maps URL.
      </p>
      <div className='max-w-lg mx-auto'>
        <div className='mb-4'>
          <RestaurantSearch onRestaurantSelect={onRestaurantSelect} />
        </div>
        <details className='text-sm'>
          <summary className='cursor-pointer text-indigo-600 dark:text-indigo-400 hover:underline'>
            Or paste Google Maps URL
          </summary>
          <div className='mt-3 flex gap-2'>
            <input
              type='url'
              className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              placeholder='https://maps.app.goo.gl/...'
              value={directUrlInput}
              onChange={(e) => onDirectUrlInputChange(e.target.value)}
              disabled={isLoading}
            />
            <button
              onClick={() => onSubmit(directUrlInput)}
              disabled={isLoading || !directUrlInput.trim()}
              className='px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm whitespace-nowrap'>
              Analyze URL
            </button>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DirectSearchSection;
