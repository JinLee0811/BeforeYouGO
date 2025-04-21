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
          className={`px-4 py-2 rounded-lg transition-colors ${
            currentPage === i
              ? "bg-blue-600 text-white"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
        <p className='text-gray-500 dark:text-gray-400'>
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
            className='bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 cursor-pointer overflow-hidden group'>
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
                  <div className='group-hover:animate-spin-slow transition-all duration-500'>
                    <SparklesIcon className='w-8 h-8 text-blue-400' />
                  </div>
                  <span className='text-white text-lg font-medium'>AI Review Analysis</span>
                </div>
              </div>
              <div className='absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-1 rounded-full shadow-md'>
                <div className='flex items-center gap-1'>
                  <StarIcon className='w-5 h-5 text-yellow-400' />
                  <span className='font-semibold text-gray-900 dark:text-white'>
                    {restaurant.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              {restaurant.isOpenNow !== undefined && (
                <div
                  className={`absolute top-4 left-4 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-md ${
                    restaurant.isOpenNow
                      ? "bg-green-500 dark:bg-green-600"
                      : "bg-red-500 dark:bg-red-600"
                  }`}>
                  {restaurant.isOpenNow ? "Open" : "Closed"}
                </div>
              )}
            </div>
            <div className='p-4'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                {restaurant.name}
              </h3>
              <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-2'>
                <MapPinIcon className='w-4 h-4' />
                <span className='text-sm'>{formatDistance(restaurant.distance)}</span>
              </div>
              <p className='text-sm text-gray-500 dark:text-gray-400 line-clamp-2'>
                {restaurant.address}
              </p>
              <div className='mt-3 flex items-center justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-300'>
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
            className='p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
            <ChevronLeftIcon className='w-5 h-5' />
          </button>
          {renderPageNumbers()}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className='p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'>
            <ChevronRightIcon className='w-5 h-5' />
          </button>
        </div>
      )}
    </div>
  );
}
