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
    <div className='rounded-3xl border border-indigo-100/80 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/90'>
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
                className='flex-1 rounded-xl border border-indigo-100 bg-white px-4 py-2 text-lg font-medium text-slate-900 outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400'
                placeholder='Enter your nickname'
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className='rounded-xl bg-green-50 p-2 text-green-600 transition-colors duration-200 hover:bg-green-100 hover:text-green-700 disabled:opacity-50'>
                <CheckIcon className='w-5 h-5' />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNickname(profile.nickname || "");
                }}
                className='rounded-xl bg-gray-50 p-2 text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-700'>
                <XMarkIcon className='w-5 h-5' />
              </button>
            </>
          ) : (
            <>
              <h2 className='byg-title truncate text-2xl font-bold text-slate-900'>
                {profile.nickname || "User"}
              </h2>
              <button
                onClick={() => setIsEditing(true)}
                className='rounded-xl bg-gray-50 p-2 text-gray-400 transition-colors duration-200 hover:bg-gray-100 hover:text-gray-600'>
                <PencilIcon className='w-5 h-5' />
              </button>
            </>
          )}
        </div>
        <div className='flex items-center gap-4'>
          <p className='text-sm text-slate-500'>
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          {error && (
            <p className='rounded-full border border-red-100 bg-red-50 px-3 py-1 text-sm text-red-600'>
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
