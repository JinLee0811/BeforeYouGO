import { memo } from "react";
import { motion } from "framer-motion";
import ProfileEdit from "@/components/profile/ProfileEdit";
import type { UserProfile } from "@/types/user";

type Props = {
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
};

/**
 * Profile card at top of My page (no bookmarks/reviews tabs).
 */
function MyPageProfileHeaderComponent({ profile, onProfileUpdate }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='byg-panel mb-8 overflow-hidden transition-colors'>
      <div className='p-8'>
        <ProfileEdit profile={profile} onProfileUpdate={onProfileUpdate} />
      </div>
    </motion.div>
  );
}

export const MyPageProfileHeader = memo(MyPageProfileHeaderComponent);
