import React from "react";

const HomeHeader: React.FC = () => {
  return (
    <div className='mb-10 text-center md:mb-14'>
      <p className='byg-chip mx-auto w-fit'>AI Restaurant Intelligence</p>
      <h1 className='byg-title mb-4 mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl'>
        Let AI read the reviews for you
      </h1>
      <p className='mx-auto mb-6 max-w-3xl text-base text-slate-600 md:text-lg'>
        <span className='byg-title bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500 bg-clip-text font-semibold text-transparent'>
          Before You Go
        </span>{" "}
        turns long Google review lists into a single, clear summary so you can decide where to eat
        in seconds.
      </p>
    </div>
  );
};

export default HomeHeader;
