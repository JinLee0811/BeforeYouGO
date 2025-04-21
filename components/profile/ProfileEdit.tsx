import React, { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
// Removed commented out import for ProfileImageUpload
import { UserProfile } from "@/types/user";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface ProfileEditProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
}

export default function ProfileEdit({ profile, onProfileUpdate }: ProfileEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Removed handleProfileImageUpdate function

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // 프로필 테이블 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ nickname })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      // user_metadata 업데이트
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { nickname },
      });

      if (metadataError) throw metadataError;

      // Update profile object without profileImage
      onProfileUpdate({ ...profile, nickname });
      setIsEditing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className='bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-3xl p-6 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50'>
      {/* Removed flex wrapper that included image */}
      <div className='flex-1 min-w-0'>
        {" "}
        {/* Adjusted to take full width potentially */}
        <div className='flex items-center gap-3 mb-2'>
          {isEditing ? (
            <>
              <input
                type='text'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className='flex-1 px-4 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:focus:ring-blue-400/50 text-lg font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500'
                placeholder='Enter your nickname'
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className='p-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 disabled:opacity-50 bg-green-50/80 dark:bg-green-900/30 backdrop-blur rounded-xl hover:bg-green-100/80 dark:hover:bg-green-900/50 transition-colors duration-200'>
                <CheckIcon className='w-5 h-5' />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNickname(profile.nickname || "");
                }}
                className='p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200'>
                <XMarkIcon className='w-5 h-5' />
              </button>
            </>
          ) : (
            <>
              <h2 className='text-2xl font-bold text-gray-900 dark:text-white truncate'>
                {profile.nickname || "User"}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className='p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-colors duration-200'>
                <PencilIcon className='w-5 h-5' />
              </button>
            </>
          )}
        </div>
        <div className='flex items-center gap-4'>
          <p className='text-gray-500 dark:text-gray-400 text-sm'>
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          {error && (
            <p className='text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30 backdrop-blur px-3 py-1 rounded-full border border-red-100/50 dark:border-red-800/50'>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
