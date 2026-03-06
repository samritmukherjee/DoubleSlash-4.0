'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export interface OnboardingData {
  businessType: 'ecommerce' | 'saas' | 'local-service' | 'creator' | 'education' | 'other' | ''
  targetAudience: 'b2c' | 'b2b' | 'both' | ''
  brandStyle: ('professional' | 'friendly' | 'casual' | 'energetic' | 'premium')[]
  responsePreference: 'short' | 'balanced' | 'detailed' | ''
  language: 'english' | 'hindi' | ''
  region: 'india' | 'global' | ''
  complianceNotes: string
  termsAccepted: boolean
}

interface OnboardingContextType {
  onboarding: OnboardingData
  updateOnboarding: (updates: Partial<OnboardingData>) => void
  isOnboardingCompleted: boolean
  setIsOnboardingCompleted: (completed: boolean) => void
  saveOnboarding: () => Promise<void>
  resetOnboarding: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser()
  const [onboarding, setOnboarding] = useState<OnboardingData>({
    businessType: '',
    targetAudience: '',
    brandStyle: [],
    responsePreference: '',
    language: '',
    region: '',
    complianceNotes: '',
    termsAccepted: false,
  })

  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load onboarding state from localStorage and Clerk metadata
  useEffect(() => {
    if (user) {
      // Check Clerk metadata first for the source of truth
      const clerkOnboarded = (user.publicMetadata as any)?.onboardingCompleted ?? false
      
      if (clerkOnboarded) {
        // If completed in Clerk, load the saved data from localStorage
        const savedData = localStorage.getItem(`onboarding_${user.id}`)
        if (savedData) {
          try {
            setOnboarding(JSON.parse(savedData))
          } catch (error) {
            console.error('Failed to parse saved onboarding data:', error)
          }
        }
        setIsOnboardingCompleted(true)
      } else {
        // If not completed, load any draft data from localStorage
        const savedData = localStorage.getItem(`onboarding_${user.id}`)
        if (savedData) {
          try {
            setOnboarding(JSON.parse(savedData))
          } catch (error) {
            console.error('Failed to parse saved onboarding data:', error)
          }
        }
        setIsOnboardingCompleted(false)
      }
    }
    setIsLoading(false)
  }, [user])

  const updateOnboarding = (updates: Partial<OnboardingData>) => {
    setOnboarding((prev) => ({ ...prev, ...updates }))
  }

  const saveOnboarding = async () => {
    if (user) {
      // Save to localStorage
      localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(onboarding))

      // Update Clerk metadata to mark onboarding as completed
      try {
        await user.update({
          unsafeMetadata: {
            onboardingCompleted: true,
            onboardingData: onboarding,
            onboardingCompletedAt: new Date().toISOString(),
          },
        })
        setIsOnboardingCompleted(true)
      } catch (error) {
        console.error('Failed to save onboarding to Clerk:', error)
        // Even if Clerk update fails, mark as completed locally
        setIsOnboardingCompleted(true)
      }
    }
  }

  const resetOnboarding = () => {
    setOnboarding({
      businessType: '',
      targetAudience: '',
      brandStyle: [],
      responsePreference: '',
      language: '',
      region: '',
      complianceNotes: '',
      termsAccepted: false,
    })
    setIsOnboardingCompleted(false)
    if (user) {
      localStorage.removeItem(`onboarding_${user.id}`)
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        onboarding,
        updateOnboarding,
        isOnboardingCompleted,
        setIsOnboardingCompleted,
        saveOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
