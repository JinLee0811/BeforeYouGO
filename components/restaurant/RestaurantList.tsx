import React, { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import {
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Restaurant } from "@/types/restaurant";
import Image from "next/image";
import { motion } from "framer-motion";

interface RestaurantListProps {
  restaurants: Restaurant[];
  onRestaurantSelect: (placeId: string, name: string, url: string) => void;
}

export default function RestaurantList({ restaurants, onRestaurantSelect }: RestaurantListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const totalPages = Math.ceil(restaurants.length / itemsPerPage);

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`rounded-xl px-4 py-2 transition-colors ${
            currentPage === i
              ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white"
              : "text-slate-700 hover:bg-white"
          }`}>
          {i}
        </button>
      );
    }

    return pages;
  };

  if (!restaurants.length) {
    return (
      <div className='text-center py-8'>
        <p className='text-slate-500'>
          No restaurants found matching your criteria.
        </p>
      </div>
    );
  }

  const currentRestaurants = restaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {currentRestaurants.map((restaurant) => (
          <div
            key={restaurant.id}
            onClick={() =>
              onRestaurantSelect(
                restaurant.id,
                restaurant.name,
                `https://www.google.com/maps/place/?q=place_id:${restaurant.id}`
              )
            }
            className='group overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/90 shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-xl'>
            <div className='relative h-48'>
              <Image
                src={restaurant.imageUrl || "/placeholder-restaurant.jpg"}
                alt={restaurant.name}
                fill
                className='object-cover'
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                priority={false}
                loading='lazy'
              />
              <div className='absolute inset-0 bg-black opacity-0 group-hover:opacity-75 transition-opacity duration-300 flex items-center justify-center'>
                <div className='flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300'>
                  <div className='transition-all duration-500 group-hover:animate-spin-slow'>
                    <SparklesIcon className='h-8 w-8 text-indigo-300' />
                  </div>
                  <span className='text-lg font-medium text-white'>AI Review Analysis</span>
                </div>
              </div>
              <div className='absolute right-4 top-4 rounded-full bg-white px-3 py-1 shadow-md'>
                <div className='flex items-center gap-1'>
                  <StarIcon className='h-5 w-5 text-yellow-400' />
                  <span className='font-semibold text-slate-900'>
                    {restaurant.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              {restaurant.isOpenNow !== undefined && (
                <div
                  className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-md ${
                    restaurant.isOpenNow ? "bg-green-500" : "bg-red-500"
                  }`}>
                  {restaurant.isOpenNow ? "Open" : "Closed"}
                </div>
              )}
            </div>
            <div className='p-4'>
              <h3 className='byg-title mb-2 text-lg font-semibold text-slate-900'>
                {restaurant.name}
              </h3>
              <div className='mb-2 flex items-center gap-2 text-slate-600'>
                <MapPinIcon className='w-4 h-4' />
                <span className='text-sm'>{formatDistance(restaurant.distance)}</span>
              </div>
              <p className='line-clamp-2 text-sm text-slate-500'>
                {restaurant.address}
              </p>
              <div className='mt-3 flex items-center justify-between'>
                <span className='text-sm text-slate-600'>
                  {restaurant.reviewCount} reviews
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-8'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className='rounded-xl p-2 text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'>
            <ChevronLeftIcon className='w-5 h-5' />
          </button>
          {renderPageNumbers()}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='rounded-xl p-2 text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'>
            <ChevronRightIcon className='w-5 h-5' />
          </button>
        </div>
      )}
    </div>
  );
}
