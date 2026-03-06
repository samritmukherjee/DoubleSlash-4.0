'use client'

import React from 'react'
import font from 'next/font/google';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import FUIHeroWithBorders from '@/components/ui/herowith-logos';

const page = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleCampaignClick = () => {
    if (isSignedIn) {
      // User is signed in, navigate to campaign builder
      router.push('/campaign/title');
    }
    // If not signed in, the SignInButton will handle it
  };

  return (
    <FUIHeroWithBorders 
      isSignedIn={isSignedIn} 
      onCampaignClick={handleCampaignClick}
    />
  )
}

export default page
