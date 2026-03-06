'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { CampaignProvider } from './CampaignContext'

const steps = [
  { name: 'Title', path: '/campaign/title' },
  { name: 'Description', path: '/campaign/description' },
  { name: 'Channels', path: '/campaign/channels' },
  { name: 'Assets', path: '/campaign/assets' },
  { name: 'Contacts', path: '/campaign/contacts' },
  { name: 'Preview', path: '/campaign/preview' },
]

export default function CampaignLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  const currentStepIndex = steps.findIndex((s) => pathname.startsWith(s.path))

  return (
    <CampaignProvider>
      <div className="min-h-screen w-full bg-[radial-gradient(125%_125%_at_50%_101%,rgba(245,87,2,1)_10.5%,rgba(245,120,2,1)_16%,rgba(245,140,2,1)_17.5%,rgba(245,170,100,1)_25%,rgba(238,174,202,1)_40%,rgba(202,179,214,1)_65%,rgba(148,201,233,1)_100%)] relative overflow-hidden font-helvetica flex flex-col">
        {/* Header with Profile and Inbox */}
        <div className="relative z-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
          <a
          href='/'
            // onClick={() => router.back()}
            className="text-xl font-medium text-black px-2 py-1.5 border-2 border-black rounded-xl hover:bg-black/10 transition cursor-pointer"
          >
            Back
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/inbox"
              className="text-xl font-medium text-black px-2 py-1.5 border-2 border-black rounded-xl  hover:bg-black/10 transition cursor-pointer"
            >
              Inbox
            </Link>
          </div>
        </div>
        <div className="relative z-10 mb-10 flex flex-col items-center justify-center font-['Google Sans Flex'] ">
          <h1 className='text-7xl text-black '>Let's Start Your Campaign</h1>
        </div>
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 py-2">
          {/* Central card */}
          <div className="w-full max-w-5xl">
            {/* Step Navigation */}
            <div className="mb-8 flex items-center justify-start gap-2 overflow-x-auto pb-2">
              <div className="flex gap-2">
                {steps.map((step, idx) => {
                  const isActive = idx <= currentStepIndex
                  const isCurrent = idx === currentStepIndex
                  return (
                    <Link
                      key={step.path}
                      href={step.path}
                      className={`px-4 py-2 rounded-full text-xs transition whitespace-nowrap ${isCurrent
                        ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.3)] hover:bg-white/95'
                        : isActive
                          ? 'bg-black/60 text-white border border-white/30 hover:bg-black/70'
                          : 'bg-white/10 text-white/80 cursor-not-allowed'
                        }`}
                      onClick={(e) => !isActive && e.preventDefault()}
                    >
                      {step.name}
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Main card */}
            <div className="rounded-3xl border mb-20 border-white/20 bg-slate-900/70 backdrop-blur-xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
              {children}
            </div>
          </div>
        </div>
      </div>
    </CampaignProvider>
  )
}
