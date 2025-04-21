import React, { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageUpdate: (url: string) => void;
}

export default function ProfileImageUpload({
  currentImageUrl,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        setError(null);

        if (!file) return;

        // Check file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("Image size must be less than 2MB");
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("Only image files are allowed");
        }

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) throw new Error("Please sign in to upload an image");

        // Remove old image if exists
        if (currentImageUrl) {
          const oldPath = currentImageUrl.split("/").pop();
          if (oldPath) {
            await supabase.storage.from("profile-images").remove([oldPath]);
          }
        }

        // Upload new image
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from("profile-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get image URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-images").getPublicUrl(fileName);

        // Update profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ profile_image: publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        onImageUpdate(publicUrl);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An error occurred while uploading the image"
        );
      } finally {
        setUploading(false);
      }
    },
    [currentImageUrl, onImageUpdate]
  );

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  return (
    <div className='relative group'>
      <div className='relative w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 shadow-sm group-hover:shadow-md transition-all duration-300'>
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt='Profile'
            layout='fill'
            objectFit='cover'
            className='group-hover:scale-105 transition-transform duration-300'
          />
        ) : (
          <UserCircleIcon className='w-full h-full text-blue-400/70' />
        )}

        <label className='absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer'>
          <PhotoIcon className='w-8 h-8 text-white transform scale-90 group-hover:scale-100 transition-transform duration-300' />
          <input
            type='file'
            className='hidden'
            accept='image/*'
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className='absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-2xl'>
          <div className='w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        </div>
      )}

      {error && (
        <div className='absolute top-full left-0 right-0 mt-2 px-3 py-1 bg-red-50 text-sm text-red-500 rounded-xl'>
          {error}
        </div>
      )}
    </div>
  );
}
