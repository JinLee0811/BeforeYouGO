import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { UserIcon } from "@heroicons/react/24/outline";

interface NicknameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nickname: string) => void;
  userId: string | null;
}

export default function NicknameSetupModal({
  isOpen,
  onClose,
  onSuccess,
  userId,
}: NicknameSetupModalProps) {
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !nickname.trim()) {
      setError("Please enter a valid nickname");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { nickname: nickname.trim() },
      });

      if (updateError) throw updateError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ nickname: nickname.trim() })
        .eq("id", userId);

      if (profileError) throw profileError;

      onSuccess(nickname.trim());
      onClose();
    } catch (err: any) {
      console.error("Error updating nickname:", err);
      setError(err.message || "Failed to update nickname. Please try again");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setNickname("");
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={onClose} className='relative z-50'>
      <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' aria-hidden='true' />

      <div className='fixed inset-0 flex items-center justify-center p-4'>
        <Dialog.Panel className='w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl transform transition-all'>
          <div className='flex flex-col items-center mb-8'>
            <div className='w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4'>
              <UserIcon className='w-8 h-8 text-blue-500' />
            </div>
            <Dialog.Title className='text-2xl font-bold text-gray-900 text-center'>
              Ready to Discover Great Restaurants?
            </Dialog.Title>
            <Dialog.Description className='mt-2 text-sm text-center text-gray-600'>
              Set your nickname to share your restaurant experiences with other food lovers
            </Dialog.Description>
          </div>

          <form onSubmit={handleSaveNickname} className='space-y-6'>
            <div>
              <label
                htmlFor='nickname-setup'
                className='block text-sm font-medium text-gray-700 mb-2'>
                Nickname
              </label>
              <input
                id='nickname-setup'
                type='text'
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder='Enter your nickname'
                className='w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                required
                minLength={2}
                maxLength={20}
                disabled={loading}
              />
            </div>

            {error && <div className='bg-red-50 text-red-600 text-sm p-3 rounded-lg'>{error}</div>}

            <button
              type='submit'
              disabled={loading || !nickname.trim()}
              className='w-full bg-blue-600 text-white rounded-lg py-3 px-4 text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-60 disabled:cursor-not-allowed'>
              {loading ? "Setting up..." : "Start Discovering"}
            </button>
          </form>

          <button
            onClick={onClose}
            className='mt-4 w-full text-sm text-gray-600 hover:text-gray-800 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-200'
            disabled={loading}>
            I'll do this later
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
