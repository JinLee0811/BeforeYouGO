import React from "react";
import Image from "next/image";
import { StarIcon } from "@heroicons/react/24/solid";
import { MapPinIcon } from "@heroicons/react/24/outline";

interface Restaurant {
  name: string;
  rating: number;
  priceLevel: number;
  photos?: { photo_reference: string }[];
  vicinity: string;
}

interface RestaurantCardProps {
  restaurant: Restaurant;
  isFirst?: boolean;
  onClick?: () => void;
}

export default function RestaurantCard({
  restaurant,
  isFirst = false,
  onClick,
}: RestaurantCardProps) {
  const { name, rating, priceLevel, photos, vicinity } = restaurant;
  const priceText = "$".repeat(priceLevel);

  return (
    <div
      onClick={onClick}
      className='group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden'>
      <div className='relative h-48 w-full'>
        {photos && photos.length > 0 ? (
          <Image
            src={`/api/photos/${photos[0].photo_reference}`}
            alt={name}
            fill
            className='object-cover transform group-hover:scale-105 transition-transform duration-300'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
            priority={isFirst}
          />
        ) : (
          <div className='w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center'>
            <MapPinIcon className='w-16 h-16 text-blue-400/70 dark:text-blue-300/70' />
          </div>
        )}
      </div>
      <div className='p-6'>
        <h3 className='font-semibold text-xl text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
          {name}
        </h3>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center text-gray-600 dark:text-gray-300'>
            <MapPinIcon className='w-5 h-5 mr-2 flex-shrink-0 text-blue-500/70 dark:text-blue-400/70' />
            <p className='text-sm truncate'>{vicinity}</p>
          </div>
          {priceLevel > 0 && (
            <span className='text-gray-600 dark:text-gray-300 text-sm font-medium'>
              {priceText}
            </span>
          )}
        </div>
        {rating > 0 && (
          <div className='flex items-center'>
            <div className='flex text-yellow-400'>
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(rating) ? "" : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <span className='ml-2 text-sm font-medium text-gray-600 dark:text-gray-300'>
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
