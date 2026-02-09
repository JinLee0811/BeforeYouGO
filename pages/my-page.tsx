import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { UserProfile } from "@/types/user";
import ProfileEdit from "@/components/profile/ProfileEdit";
import {
  BookmarkIcon,
  ChatBubbleBottomCenterTextIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import WishlistCard from "@/components/mypage/WishlistCard";
import EditReviewForm from "@/components/review/EditReviewForm";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/hooks/useUser";
import { useRouter } from "next/router";

interface Bookmark {
  id: string;
  place_id: string;
  restaurant_name: string;
  restaurant_address: string;
  image_url: string | null;
  average_rating: number;
  sentiment: "positive" | "negative" | "mixed";
  positive_keywords: string[];
  negative_keywords: string[];
  mentioned_menu_items: string[];
  recommended_dishes: string[];
  summary: string;
  photo_urls: string[];
  created_at: string;
  is_pro_analysis: boolean;
}

interface Review {
  id: string;
  user_id: string;
  content: string;
  rating: number;
  created_at: string;
  restaurant_name: string;
  restaurant_address: string;
  place_id: string;
  user_sentiment: "positive" | "negative" | "mixed" | null;
  mentioned_menu_items: string[] | null;
  recommended_dishes: string[] | null;
}

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: { opacity: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};
// --- End Animation Variants ---

export default function MyPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"bookmarks" | "reviews">("bookmarks");
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const { user, isLoading } = useUser();
  const router = useRouter();

  const handleDeleteBookmark = async (id: string) => {
    try {
      const { error: deleteError } = await supabase.from("bookmarks").delete().eq("id", id);

      if (deleteError) {
        console.error("Error deleting bookmark:", deleteError);
        alert("Failed to delete the bookmark. Please try again.");
        return;
      }

      fetchUserData();
    } catch (error) {
      console.error("Error in handleDeleteBookmark:", error);
      alert("An error occurred while deleting the bookmark. Please try again later.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const { error: deleteError } = await supabase.from("reviews").delete().eq("id", reviewId);

      if (deleteError) {
        console.error("Error deleting review:", deleteError);
        alert("Failed to delete the review. Please try again.");
        return;
      }

      setReviews(reviews.filter((review) => review.id !== reviewId));
    } catch (error) {
      console.error("Error in handleDeleteReview:", error);
      alert("An error occurred while deleting the review. Please try again later.");
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        console.error("User authentication information not found");
        return;
      }

      // Fetch profile information
      let { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, nickname, settings, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        return;
      }

      // Create new profile if it doesn't exist
      if (!profileData) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            nickname: user.user_metadata?.nickname || user.email?.split("@")[0] || "User",
            settings: {
              notifications: {
                email: true,
                push: true,
                reviewResponse: true,
                newRestaurant: true,
              },
              language: "en",
              theme: "system",
            },
          })
          .select("id, email, nickname, settings, created_at, updated_at")
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          return;
        }

        profileData = newProfile;
      }

      if (!profileData) {
        console.error("Could not fetch profile data");
        return;
      }

      const userProfile: UserProfile = {
        id: profileData.id,
        email: profileData.email,
        nickname: profileData.nickname,
        settings: profileData.settings,
        createdAt: new Date(profileData.created_at),
        updatedAt: new Date(profileData.updated_at),
      };

      setProfile(userProfile);

      // Fetch bookmarks with all necessary data
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select(
          `
          id,
          place_id,
          restaurant_name,
          restaurant_address,
          image_url,
          average_rating,
          sentiment,
          positive_keywords,
          negative_keywords,
          mentioned_menu_items,
          recommended_dishes,
          summary,
          photo_urls,
          created_at,
          is_pro_analysis
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (bookmarksError) {
        console.error("Error fetching bookmarks:", bookmarksError);
        setError("Error fetching bookmarks");
        return;
      }

      setBookmarks(bookmarksData || []);

      // Fetch reviews including new fields
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select(
          `
          id,
          user_id,
          place_id,
          restaurant_name,
          restaurant_address,
          content,
          rating,
          created_at,
          user_sentiment,
          mentioned_menu_items,
          recommended_dishes
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        setError("Error fetching reviews");
        return;
      }

      // Ensure arrays are not null for the component
      const processedReviews = (reviewsData || []).map((review) => ({
        ...review,
        mentioned_menu_items: review.mentioned_menu_items ?? [],
        recommended_dishes: review.recommended_dishes ?? [],
      }));
      setReviews(processedReviews as Review[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    fetchUserData();
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
        <div className='w-10 h-10 border-4 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors'>
      {profile && (
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl overflow-hidden mb-8 transition-colors'>
            <div className='p-8'>
              <div className='mb-8'>
                <ProfileEdit profile={profile} onProfileUpdate={setProfile} />
              </div>

              {/* Navigation Tabs */}
              <nav className='flex space-x-8'>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("bookmarks")}
                  className={`flex items-center py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === "bookmarks"
                      ? "bg-blue-600 text-white font-medium shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-blue-500"
                  }`}>
                  <BookmarkIcon className='w-5 h-5 mr-2' />
                  Saved Restaurants
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab("reviews")}
                  className={`flex items-center py-3 px-4 rounded-xl transition-all duration-200 ${
                    activeTab === "reviews"
                      ? "bg-blue-600 text-white font-medium shadow-md"
                      : "text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-700/60 hover:text-blue-500"
                  }`}>
                  <ChatBubbleBottomCenterTextIcon className='w-5 h-5 mr-2' />
                  My Reviews
                </motion.button>
              </nav>
            </div>
          </motion.div>

          {/* Content Section with Animation */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              variants={fadeIn}
              initial='initial'
              animate='animate'
              exit='exit'
              transition={{ duration: 0.3 }}
              className='space-y-8'>
              {activeTab === "bookmarks" ? (
                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {bookmarks.length > 0 ? (
                    bookmarks.map((bookmark) => (
                      <motion.div key={bookmark.id} variants={itemVariants}>
                        <WishlistCard
                          id={bookmark.id}
                          placeId={bookmark.place_id}
                          restaurantName={bookmark.restaurant_name}
                          address={bookmark.restaurant_address}
                          imageUrl={bookmark.image_url}
                          averageRating={bookmark.average_rating}
                          sentiment={bookmark.sentiment as "positive" | "negative" | "mixed"}
                          positiveKeywords={bookmark.positive_keywords}
                          negativeKeywords={bookmark.negative_keywords}
                          mentionedMenuItems={bookmark.mentioned_menu_items}
                          recommendedDishes={bookmark.recommended_dishes}
                          summary={bookmark.summary}
                          photoUrls={bookmark.photo_urls}
                          isProAnalysis={bookmark.is_pro_analysis}
                          onDelete={handleDeleteBookmark}
                          onUpdate={fetchUserData}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      initial='hidden'
                      animate='visible'
                      className='col-span-full bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl p-8'>
                      <div className='flex flex-col items-center justify-center text-center'>
                        <div className='w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6'>
                          <BookmarkIcon className='w-10 h-10 text-blue-500/70 dark:text-blue-400/70' />
                        </div>
                        <h3 className='text-xl font-medium text-gray-900 dark:text-white mb-2'>
                          No Saved Restaurants
                        </h3>
                        <p className='text-gray-600 dark:text-gray-300 max-w-md text-sm'>
                          Start exploring and save your favorite restaurants to your wishlist!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  className='space-y-8'>
                  {reviews.length > 0 ? (
                    reviews.map((review) => (
                      <motion.div
                        key={review.id}
                        variants={itemVariants}
                        className='bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white dark:hover:bg-gray-800 group'>
                        <div className='flex items-start gap-8'>
                          <div className='flex-1'>
                            <div className='flex items-center justify-between mb-6'>
                              <h3 className='font-semibold text-2xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200'>
                                {review.restaurant_name}
                              </h3>
                              <div className='flex items-center space-x-4'>
                                <div className='flex items-center bg-yellow-50/80 dark:bg-yellow-900/30 px-5 py-2.5 rounded-xl'>
                                  <div className='flex text-yellow-400 mr-2'>
                                    {[...Array(5)].map((_, i) =>
                                      i < review.rating ? (
                                        <StarIconSolid key={i} className='w-6 h-6' />
                                      ) : (
                                        <StarIcon
                                          key={i}
                                          className='w-6 h-6 text-gray-300 dark:text-gray-600'
                                        />
                                      )
                                    )}
                                  </div>
                                  <span className='text-yellow-700 dark:text-yellow-500 font-semibold text-lg'>
                                    {review.rating}/5
                                  </span>
                                </div>
                                <div className='flex items-center space-x-2'>
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setEditingReview(review)}
                                    className='p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors'
                                    title='Edit review'>
                                    <PencilIcon className='w-5 h-5' />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteReview(review.id)}
                                    className='p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors'
                                    title='Delete review'>
                                    <TrashIcon className='w-5 h-5' />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center text-gray-600 dark:text-gray-300 mb-6'>
                              <MapPinIcon className='w-5 h-5 mr-3 flex-shrink-0 text-blue-500/70 dark:text-blue-400/70' />
                              <p className='text-base'>{review.restaurant_address}</p>
                            </div>
                            <p className='text-gray-700 dark:text-gray-200 text-lg mb-6 leading-relaxed'>
                              {review.content}
                            </p>
                            <div className='flex items-center text-gray-500 dark:text-gray-400'>
                              <ClockIcon className='w-5 h-5 mr-3 text-blue-500/70 dark:text-blue-400/70' />
                              <span className='text-base'>
                                Reviewed on {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      initial='hidden'
                      animate='visible'
                      className='bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-3xl p-12'>
                      <div className='flex flex-col items-center justify-center text-center'>
                        <div className='w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-8'>
                          <ChatBubbleBottomCenterTextIcon className='w-12 h-12 text-blue-500/70 dark:text-blue-400/70' />
                        </div>
                        <h3 className='text-2xl font-medium text-gray-900 dark:text-white mb-4'>
                          No Reviews Yet
                        </h3>
                        <p className='text-gray-600 dark:text-gray-300 max-w-md'>
                          Share your honest reviews about the restaurants you've visited!
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Edit Review Modal Animation - Moved inside the main return block */}
      <AnimatePresence>
        {editingReview && (
          <motion.div
            key='edit-review-modal-wrapper'
            initial='hidden'
            animate='visible'
            exit='exit'
            variants={modalVariants}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'>
            <EditReviewForm
              isOpen={true}
              onClose={() => setEditingReview(null)}
              reviewId={editingReview.id}
              restaurantName={editingReview.restaurant_name}
              initialRating={editingReview.rating}
              initialContent={editingReview.content}
              initialUserSentiment={editingReview.user_sentiment ?? null}
              initialMentionedMenuItems={editingReview.mentioned_menu_items ?? []}
              initialRecommendedDishes={editingReview.recommended_dishes ?? []}
              onReviewUpdate={() => {
                setEditingReview(null);
                fetchUserData();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
