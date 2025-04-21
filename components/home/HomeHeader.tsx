import React from "react";

const HomeHeader: React.FC = () => {
  return (
    <div className='text-center mb-12 md:mb-16'>
      <h1 className='text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight'>
        Dine Smarter, Not Harder
      </h1>
      <p className='text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8'>
        Stop scrolling endless reviews!{" "}
        <strong className='text-blue-600 dark:text-blue-400'>Before You Go</strong> uses AI to
        instantly summarize what locals *really* think, helping you find authentic dining
        experiences anywhere in Australia.
      </p>
    </div>
  );
};

export default HomeHeader;
