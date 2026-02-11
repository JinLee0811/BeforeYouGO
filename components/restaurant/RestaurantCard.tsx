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
      className='group cursor-pointer overflow-hidden rounded-2xl border border-indigo-100/80 bg-white/90 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
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
          <div className='flex h-full w-full items-center justify-center bg-slate-100'>
            <MapPinIcon className='h-16 w-16 text-indigo-400/70' />
          </div>
        )}
      </div>
      <div className='p-6'>
        <h3 className='byg-title mb-3 text-xl font-semibold text-slate-900 transition-colors group-hover:text-indigo-600'>
          {name}
        </h3>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center text-slate-600'>
            <MapPinIcon className='mr-2 h-5 w-5 flex-shrink-0 text-indigo-500/70' />
            <p className='text-sm truncate'>{vicinity}</p>
          </div>
          {priceLevel > 0 && (
            <span className='text-sm font-medium text-slate-600'>
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
                  className={`w-5 h-5 ${i < Math.floor(rating) ? "" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className='ml-2 text-sm font-medium text-slate-600'>
              {rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
