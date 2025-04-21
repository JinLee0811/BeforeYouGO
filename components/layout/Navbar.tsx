import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import { UserIcon, BookmarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
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
      handleAuthStateChange(session);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const handleAuthStateChange = (session: Session | null) => {
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
    handleAuthStateChange(session);
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
    <nav className='bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-900/30 sticky top-0 z-40 transition-colors'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex'>
            <Link href='/' className='flex items-center gap-2'>
              <Image
                src='/imageLogo.png'
                alt='Before You Go Logo'
                width={40}
                height={40}
                className='rounded-full'
              />
              <span className='text-xl font-bold text-gray-900 dark:text-white transition-colors'>
                Before You Go
              </span>
            </Link>
          </div>

          <div className='flex items-center space-x-4'>
            <ThemeToggle />
            {userId ? (
              <>
                {userNickname && (
                  <span className='text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block transition-colors'>
                    Welcome, {userNickname}!
                  </span>
                )}
                <Link
                  href='/my-page'
                  className='flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'>
                  <BookmarkIcon className='w-5 h-5 mr-1.5' />
                  My Page
                </Link>
                <button
                  onClick={handleSignOut}
                  className='flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors'>
                  <ArrowRightOnRectangleIcon className='w-5 h-5 mr-1.5' />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className='flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors'>
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
    </nav>
  );
}
