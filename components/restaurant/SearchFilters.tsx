import React from "react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface FilterOption {
  value: string;
  label: string;
}

interface SearchFiltersProps {
  priceRange: string[];
  onPriceRangeChange: (value: string[]) => void;
  rating: number | null;
  onRatingChange: (value: number | null) => void;
}

const priceOptions: FilterOption[] = [
  { value: "1", label: "$" },
  { value: "2", label: "$$" },
  { value: "3", label: "$$$" },
  { value: "4", label: "$$$$" },
];

const ratingOptions: FilterOption[] = [
  { value: "3", label: "3+" },
  { value: "4", label: "4+" },
  { value: "4.5", label: "4.5+" },
];

export default function SearchFilters({
  priceRange,
  onPriceRangeChange,
  rating,
  onRatingChange,
}: SearchFiltersProps) {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2 text-gray-700 dark:text-gray-300'>
        <AdjustmentsHorizontalIcon className='w-5 h-5' />
        <span className='font-medium'>Filters</span>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Price Range
          </label>
          <div className='flex gap-2'>
            {priceOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const newPriceRange = priceRange.includes(option.value)
                    ? priceRange.filter((p) => p !== option.value)
                    : [...priceRange, option.value];
                  onPriceRangeChange(newPriceRange);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  priceRange.includes(option.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Minimum Rating
          </label>
          <div className='flex gap-2'>
            {ratingOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const newRating = rating === Number(option.value) ? null : Number(option.value);
                  onRatingChange(newRating);
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  rating === Number(option.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
