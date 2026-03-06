'use client'

import React, { createContext, useContext, useState } from 'react'

export interface CampaignData {
  title: string
  description: string
  channels: ('Text' | 'Voice' | 'Calls')[]
  toneOfVoice?: 'friendly' | 'professional' | 'energetic' | 'formal' | 'casual'
  wordLimit?: number // in words
  voiceDuration?: number // in minutes (1, 2, or 3)
  assets: File[]
  contacts: { name: string; phone: string }[]
}

interface CampaignContextType {
  campaign: CampaignData
  updateCampaign: (updates: Partial<CampaignData>) => void
}

const CampaignContext = createContext<CampaignContextType | undefined>(undefined)

export const CampaignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [campaign, setCampaign] = useState<CampaignData>({
    title: '',
    description: '',
    channels: [],
    toneOfVoice: undefined,
    wordLimit: undefined,
    voiceDuration: 1,
    assets: [],
    contacts: [],
  })

  const updateCampaign = (updates: Partial<CampaignData>) => {
    setCampaign((prev) => ({ ...prev, ...updates }))
  }

  return (
    <CampaignContext.Provider value={{ campaign, updateCampaign }}>
      {children}
    </CampaignContext.Provider>
  )
}

export const useCampaign = () => {
  const context = useContext(CampaignContext)
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider')
  }
  return context
}
