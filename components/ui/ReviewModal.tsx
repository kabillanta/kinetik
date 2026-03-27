"use client";

import { useState } from "react";
import { Star, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/lib/auth-context";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (rating: number, comment: string) => Promise<void>;
  onSuccess?: () => void;
  eventId?: string;
  eventTitle: string;
  revieweeId?: string;
  revieweeName?: string;
  volunteerName?: string;
  type: "volunteer" | "organizer";
}

export function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  onSuccess,
  eventId,
  eventTitle,
  revieweeId,
  revieweeName,
  volunteerName,
  type,
}: ReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Use revieweeName if provided, fallback to volunteerName for backwards compatibility
  const displayName = revieweeName || volunteerName;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // If custom onSubmit is provided, use it (backwards compatibility)
      if (onSubmit) {
        await onSubmit(rating, comment);
      } else if (eventId && revieweeId && user) {
        // Otherwise use the API directly
        const token = await user.getIdToken();
        const res = await fetch(`${API_BASE_URL}/api/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            event_id: eventId,
            reviewee_id: revieweeId,
            rating,
            comment: comment.trim() || null,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.detail || "Failed to submit review");
        }
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  const title = type === "volunteer" 
    ? `Rate ${displayName || "Volunteer"}`
    : `Rate your experience`;

  const subtitle = type === "volunteer"
    ? `How was ${displayName || "this volunteer"}'s participation in "${eventTitle}"?`
    : `How was your experience volunteering at "${eventTitle}"?`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>

        {/* Star Rating */}
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`Rate ${star} stars`}
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>

        {/* Rating Label */}
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            {rating === 0 && "Select a rating"}
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </span>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
            Add a comment (optional)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={type === "volunteer" 
              ? "Share your experience working with this volunteer..."
              : "Share your experience at this event..."
            }
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">
            {comment.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 text-center mb-4" role="alert">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

// Star rating display component
interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ 
  rating, 
  size = "md", 
  showValue = false,
  reviewCount 
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              rating >= star
                ? "fill-amber-400 text-amber-400"
                : rating >= star - 0.5
                ? "fill-amber-200 text-amber-400"
                : "text-gray-300"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className={cn("font-medium text-gray-700", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={cn("text-gray-400", textSizes[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// Review card component
interface ReviewCardProps {
  reviewerName: string;
  reviewerImage?: string;
  rating: number;
  comment?: string;
  date: string;
  eventTitle?: string;
}

export function ReviewCard({
  reviewerName,
  reviewerImage,
  rating,
  comment,
  date,
  eventTitle,
}: ReviewCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {reviewerImage ? (
            <img 
              src={reviewerImage} 
              alt={reviewerName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            reviewerName.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-gray-900">{reviewerName}</span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>

          {/* Rating */}
          <div className="mt-1">
            <StarRating rating={rating} size="sm" />
          </div>

          {/* Event */}
          {eventTitle && (
            <p className="text-xs text-gray-500 mt-1">for {eventTitle}</p>
          )}

          {/* Comment */}
          {comment && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{comment}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;
