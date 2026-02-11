import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import {
  UserIcon,
  BookmarkIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import AuthModal from "../auth/AuthModal";
import NicknameSetupModal from "../auth/NicknameSetupModal";
import { Session } from "@supabase/supabase-js";

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
      <div className='border-b border-white/70 bg-white/70 backdrop-blur-xl shadow-sm'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-3'>
            <Link href='/' className='flex items-center gap-2'>
              <span className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600'>
                <SparklesIcon className='h-5 w-5 text-white' />
              </span>
              <span className='byg-title bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent'>
                Before You Go
              </span>
            </Link>
            <div className='hidden items-center gap-2 sm:flex'>
              <Link
                href='/search'
                className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-indigo-600'
              >
                Search
              </Link>
              <Link
                href='/pricing'
                className='rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-indigo-600'
              >
                Pricing
              </Link>
            </div>
          </div>

          <div className='flex items-center space-x-2.5'>
            {userId ? (
              <>
                {userNickname && (
                  <span className='hidden rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-600 sm:block'>
                    Hi, {userNickname}
                  </span>
                )}
                <Link
                  href='/my-page'
                  className='inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50'
                >
                  <BookmarkIcon className='mr-1.5 h-5 w-5' />
                  My Page
                </Link>
                <button
                  onClick={handleSignOut}
                  className='inline-flex items-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50'
                >
                  <ArrowRightOnRectangleIcon className='mr-1.5 h-5 w-5' />
                  Sign Out
                </button>
              </>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className='byg-btn-primary'>
                <UserIcon className='mr-1.5 h-5 w-5' />
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
