import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import { getSupabaseEmailRedirectUrl, getSupabaseRedirectUrl } from "../../lib/externalUrls";
import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowConfirmationMessage(false);
    setShowWelcomeBanner(false);

    try {
      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
        onClose();
      } else {
        if (!nickname.trim()) {
          setError("Please enter a nickname.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname.trim(),
            },
            emailRedirectTo: getSupabaseEmailRedirectUrl(),
          },
        });
        if (error) throw error;
        setSubmittedEmail(email);
        setShowWelcomeBanner(true);
        setShowConfirmationMessage(true);
        setEmail("");
        setPassword("");
        setNickname("");
      }
    } catch (err: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (err.message) {
        if (err.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password.";
        } else if (err.message.includes("User already registered")) {
          errorMessage = "An account with this email already exists. Please sign in.";
        } else if (err.message.includes("Password should be at least 6 characters")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (err.message.includes("Unable to validate email address")) {
          errorMessage = "Please enter a valid email address.";
        } else if (mode === "signUp" && !nickname.trim()) {
          errorMessage = "Please enter a nickname.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setShowConfirmationMessage(false);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getSupabaseRedirectUrl(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoading(false);
      if (!showConfirmationMessage) {
        setEmail("");
        setPassword("");
        setNickname("");
      }
    } else {
      setEmail("");
      setPassword("");
      setNickname("");
      setError(null);
      setLoading(false);
      setShowConfirmationMessage(false);
      setSubmittedEmail("");
    }
  }, [isOpen]);

  useEffect(() => {
    setShowConfirmationMessage(false);
    setSubmittedEmail("");
  }, [mode]);

  return (
    <Dialog open={isOpen} onClose={onClose} className='relative z-50'>
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' aria-hidden='true' />
      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel className='w-full max-w-sm rounded-xl bg-white p-8 shadow-2xl relative'>
          <button
            onClick={onClose}
            className='absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-full p-1'
            aria-label='Close modal'>
            <XMarkIcon className='h-6 w-6' />
          </button>

          {showConfirmationMessage ? (
            <div className='text-center'>
              {showWelcomeBanner && (
                <div className='mb-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4 rounded-lg shadow-lg'>
                  <h4 className='text-lg font-bold mb-2'>🎉 환영합니다!</h4>
                  <p className='text-sm'>
                    회원가입을 축하드립니다! AI 상세 분석 1회 무료 이용권이 자동으로 지급되었습니다.
                  </p>
                </div>
              )}
              <CheckCircleIcon className='w-16 h-16 text-green-500 mx-auto mb-4' />
              <Dialog.Title className='text-xl font-bold text-gray-800 mb-3'>
                이메일을 확인해주세요
              </Dialog.Title>
              <p className='text-sm text-gray-600 mb-6'>
                <strong className='text-gray-800'>{submittedEmail}</strong>로 인증 링크를
                보냈습니다. 링크를 클릭하여 회원가입을 완료해주세요. 스팸 메일함도 확인해주세요.
              </p>
              <button
                onClick={onClose}
                className='w-full bg-blue-600 text-white rounded-lg py-2.5 px-4 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out'>
                닫기
              </button>
            </div>
          ) : (
            <>
              <Dialog.Title className='text-2xl font-bold text-center text-gray-800 mb-6 pt-4'>
                {mode === "signIn" ? "Welcome Back" : "Create Your Account"}
              </Dialog.Title>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className='w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-2.5 mb-5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-60'>
                <Image src='/google-logo.svg' alt='Google' width={18} height={18} />
                Continue with Google
              </button>

              <div className='relative my-6'>
                <div className='absolute inset-0 flex items-center' aria-hidden='true'>
                  <div className='w-full border-t border-gray-300'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>OR</span>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className='space-y-4'>
                {mode === "signUp" && (
                  <div>
                    <label
                      htmlFor='nickname'
                      className='block text-sm font-medium text-gray-700 sr-only'>
                      Nickname
                    </label>
                    <input
                      id='nickname'
                      type='text'
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder='Nickname'
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-4 text-sm'
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700 sr-only'>
                    Email address
                  </label>
                  <input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='Email address'
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-4 text-sm'
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 sr-only'>
                    Password
                  </label>
                  <input
                    id='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signUp" ? "Password (min. 6 characters)" : "Password"}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5 px-4 text-sm'
                    required
                    disabled={loading}
                  />
                </div>

                {error && <p className='text-red-600 text-sm text-center pt-1'>{error}</p>}

                <button
                  type='submit'
                  disabled={loading}
                  className={`w-full text-white rounded-lg py-2.5 px-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-60 ${mode === "signUp" ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"}`}>
                  {loading ? "Processing..." : mode === "signIn" ? "Sign In" : "Create Account"}
                </button>
              </form>

              <p className='mt-6 text-sm text-center text-gray-600'>
                {mode === "signIn" ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
                  className='font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline'
                  disabled={loading}>
                  {mode === "signIn" ? "Sign Up Now" : "Sign In Instead"}
                </button>
              </p>
            </>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
