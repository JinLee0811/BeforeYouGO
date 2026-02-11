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
      <div className='mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row'>
        <h2 className='byg-title text-2xl font-semibold text-slate-900'>
          Top Restaurants Found
        </h2>
        <p className='text-sm text-slate-500'>
          Showing {restaurants.length} results (Rating 4.0+)
        </p>
      </div>
      <RestaurantList restaurants={restaurants} onRestaurantSelect={onRestaurantSelect} />
    </div>
  );
};

export default RestaurantResults;
