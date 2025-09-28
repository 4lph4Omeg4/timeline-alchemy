'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  showNumber?: boolean
  className?: string
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  showNumber = false,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(rating)

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  const handleClick = (newRating: number) => {
    if (interactive && onRatingChange) {
      setCurrentRating(newRating)
      onRatingChange(newRating)
    }
  }

  const handleMouseEnter = (newRating: number) => {
    if (interactive) {
      setHoverRating(newRating)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  const displayRating = interactive ? (hoverRating || currentRating) : rating

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const starRating = index + 1
          const isFilled = starRating <= displayRating
          const isHalfFilled = starRating === Math.ceil(displayRating) && displayRating % 1 !== 0

          return (
            <button
              key={index}
              type="button"
              className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${sizeClasses[size]}`}
              onClick={() => handleClick(starRating)}
              onMouseEnter={() => handleMouseEnter(starRating)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
            >
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : isHalfFilled 
                    ? 'fill-yellow-400/50 text-yellow-400' 
                    : 'text-gray-400'
                }`}
              />
            </button>
          )
        })}
      </div>
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Component for rating input with review text
interface RatingInputProps {
  onSubmit: (rating: number, reviewText?: string) => void
  initialRating?: number
  initialReview?: string
  className?: string
}

export function RatingInput({ 
  onSubmit, 
  initialRating = 0, 
  initialReview = '',
  className = ''
}: RatingInputProps) {
  const [rating, setRating] = useState(initialRating)
  const [reviewText, setReviewText] = useState(initialReview)

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, reviewText)
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate this package
        </label>
        <StarRating
          rating={rating}
          interactive={true}
          onRatingChange={setRating}
          size="lg"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Write a review (optional)
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Share your thoughts about this package..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={rating === 0}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        Submit Rating
      </button>
    </div>
  )
}
