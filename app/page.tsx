'use client'

import React from 'react'
import font from 'next/font/google';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@clerk/nextjs';

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
    <div>
      <>
      <div className='h-screen w-full bg-zinc-900 flex  flex-col p-10'>

        

<div className='justify-center flex flex-col items-center mt-20 gap-10'>
  {isSignedIn ? (
    <button onClick={handleCampaignClick} className="mx-auto text-4xl font-bold text-black p-4 bg-white rounded-lg hover:bg-white/20 transition font-['Helvetica'] cursor-pointer">
      Start your Campaign Now
    </button>
  ) : (
    <SignInButton mode="modal">
      <button className="mx-auto text-4xl font-bold text-black p-4 bg-white rounded-lg hover:bg-white/20 transition font-['Helvetica'] cursor-pointer">
        Start your Campaign Now
      </button>
    </SignInButton>
  )}
</div>
      


      </div>
      </>
    </div>
  )
}

export default page
