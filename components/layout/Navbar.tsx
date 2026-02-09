import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import {
  UserIcon,
  BookmarkIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import AuthModal from "../auth/AuthModal";
import NicknameSetupModal from "../auth/NicknameSetupModal";
import { Session } from "@supabase/supabase-js";
import ThemeToggle from "../common/ThemeToggle";

export default function Navbar() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  useEffect(() => {
    checkUserSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthStateChange(_event, session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    const user = session?.user;
    const currentUserId = user?.id || null;
    const currentNickname = user?.user_metadata?.nickname || null;

    setUserId(currentUserId);
    setUserNickname(currentNickname);

    if (currentUserId && !currentNickname) {
      setTimeout(() => setShowNicknameModal(true), 100);
    } else {
      setShowNicknameModal(false);
    }
  };

  const checkUserSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    handleAuthStateChange("INITIAL", session);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserId(null);
    setUserNickname(null);
    setShowNicknameModal(false);
    router.push("/");
  };

  const handleNicknameSuccess = (newNickname: string) => {
    setUserNickname(newNickname);
    setShowNicknameModal(false);
  };

  return (
    <nav className='sticky top-0 z-40'>
      <div className='backdrop-blur-xl bg-white/70 dark:bg-gray-900/60 border-b border-white/40 dark:border-white/10 shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
          <div className='flex'>
            <Link href='/' className='flex items-center gap-2'>
              <Image
                src='/imageLogo.png'
                alt='Before You Go Logo'
                width={40}
                height={40}
                className='rounded-full ring-2 ring-indigo-200/60 dark:ring-indigo-400/40'
              />
              <span className='text-xl font-semibold text-gray-900 dark:text-white transition-colors'>
                Before You Go
              </span>
            </Link>
          </div>

          <div className='flex items-center space-x-3'>
            <ThemeToggle />
            {userId ? (
              <>
                {userNickname && (
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block transition-colors'>
                    Hi, {userNickname}
                  </span>
                )}
                <Link
                  href='/my-page'
                  className='flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/60 rounded-lg transition-colors'>
                  <BookmarkIcon className='w-5 h-5 mr-1.5' />
                  My Page
                </Link>
                <button
                  onClick={handleSignOut}
                  className='flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50/80 dark:hover:bg-red-900/30 rounded-lg transition-colors'>
                  <ArrowRightOnRectangleIcon className='w-5 h-5 mr-1.5' />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className='flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm'>
                <UserIcon className='w-5 h-5 mr-1.5' />
                Sign In / Sign Up
              </button>
            )}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={() => {
          setShowAuthModal(false);
        }}
      />

      {userId && (
        <NicknameSetupModal
          isOpen={showNicknameModal}
          onClose={() => setShowNicknameModal(false)}
          onSuccess={handleNicknameSuccess}
          userId={userId}
        />
      )}
      </div>
    </nav>
  );
}
