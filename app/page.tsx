'use client'

import React, { useEffect } from 'react'
import font from 'next/font/google';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import FUIHeroWithBorders from '@/components/ui/herowith-logos';
import { OnboardingFlow } from '@/components/Onboarding/OnboardingFlow'
import { useOnboarding } from '@/components/Onboarding/OnboardingContext'
import { div } from 'framer-motion/client';

const page = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { showModal, isOnboardingCompleted } = useOnboarding();

  const handleCampaignClick = () => {
    if (isSignedIn) {
      // User is signed in, navigate to campaign builder
      router.push('/campaign/title')
    }
    // If not signed in, the SignInButton will handle it
  };

  return (
    <div className='w-full min-h-screen hide-scrollbar '>
      <FUIHeroWithBorders
        isSignedIn={isSignedIn}
        onCampaignClick={handleCampaignClick}
      />
      {isSignedIn && showModal && <OnboardingFlow />}
    </div>
  )


}

export default page
