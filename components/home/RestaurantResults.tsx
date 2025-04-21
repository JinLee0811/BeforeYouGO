import React from "react";
import RestaurantList from "../restaurant/RestaurantList";
import { Restaurant } from "@/types/restaurant";

interface RestaurantResultsProps {
  restaurants: Restaurant[];
  onRestaurantSelect: (placeId: string, name: string, url: string) => void;
}

const RestaurantResults: React.FC<RestaurantResultsProps> = ({
  restaurants,
  onRestaurantSelect,
}) => {
  if (restaurants.length === 0) return null;

  return (
    <div className='mb-12'>
      <div className='flex flex-col sm:flex-row items-center justify-between mb-6 gap-4'>
        <h2 className='text-2xl font-semibold text-gray-900 dark:text-white'>
          Top Restaurants Found
        </h2>
        <p className='text-gray-600 dark:text-gray-400 text-sm'>
          Showing {restaurants.length} results (Rating 4.0+)
        </p>
      </div>
      <RestaurantList restaurants={restaurants} onRestaurantSelect={onRestaurantSelect} />
    </div>
  );
};

export default RestaurantResults;
