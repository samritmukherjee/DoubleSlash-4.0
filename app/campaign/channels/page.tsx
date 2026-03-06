'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaign } from '../CampaignContext'

export default function ChannelsPage() {
  const router = useRouter()
  const { campaign, updateCampaign } = useCampaign()
  const [channels, setChannels] = useState<('Text' | 'Voice' | 'Calls')[]>(campaign.channels)
  const [tone, setTone] = useState(campaign.toneOfVoice || 'professional')
  const [wordLimit, setWordLimit] = useState(campaign.wordLimit || 100)
  const [voiceDuration, setVoiceDuration] = useState(campaign.voiceDuration || 1)
  const [error, setError] = useState('')

  const channelOptions = ['Text', 'Voice', 'Calls'] as const
  const toneOptions = ['friendly', 'professional', 'energetic', 'formal', 'casual'] as const
  const wordLimitOptions = [50, 100, 150, 200, 300] as const
  const voiceDurationOptions = [1, 2, 3] as const

  const toggleChannel = (channel: 'Text' | 'Voice' | 'Calls') => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]))
    setError('')
  }

  const handleContinue = () => {
    if (channels.length === 0) {
      setError('Please select at least one channel')
      return
    }
    updateCampaign({ 
      channels, 
      toneOfVoice: tone as any,
      wordLimit: channels.includes('Text') ? wordLimit : undefined,
      voiceDuration: (channels.includes('Voice') || channels.includes('Calls')) ? voiceDuration : undefined
    })
    router.push('/campaign/assets')
  }

  const showTone = channels.includes('Voice') || channels.includes('Calls')
  const showWordLimit = channels.includes('Text')
  const showVoiceDuration = channels.includes('Voice') || channels.includes('Calls')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl  text-white mb-2">Choose channels</h1>
        <p className="text-slate-400">Select which channels you want to use for this campaign</p>
      </div>

      {/* Channel Selection */}
      <div>
        <div className="grid grid-cols-3 gap-3">
          {channelOptions.map((channel) => (
            <button
              key={channel}
              onClick={() => toggleChannel(channel)}
              className={`px-4 py-3 rounded-2xl cursor-pointer transition ${
                channels.includes(channel)
                  ? 'bg-white text-black hover:bg-white/95 shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                  : 'bg-black/40 border border-white/20 text-white/70 hover:bg-black/50'
              }`}
            >
              {channel}
            </button>
          ))}
        </div>
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>

      {/* Tone of Voice */}
      {showTone && (
        <div>
          <h3 className="text-sm  text-white mb-3">Tone of voice</h3>
          <div className="flex flex-wrap gap-2">
            {toneOptions.map((option) => (
              <button
                key={option}
                onClick={() => setTone(option)}
                className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition ${
                  tone === option
                    ? 'bg-white text-black hover:bg-white/95'
                    : 'bg-black/40 border border-white/20 text-white/70 hover:bg-black/50'
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Text Word Limit */}
      {showWordLimit && (
        <div>
          <h3 className="text-sm  text-white mb-3">Word limit</h3>
          <div className="flex flex-wrap gap-2">
            {wordLimitOptions.map((limit) => (
              <button
                key={limit}
                onClick={() => setWordLimit(limit)}
                className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition ${
                  wordLimit === limit
                    ? 'bg-white text-black hover:bg-white/95 shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                    : 'bg-black/40 border border-white/20 text-white/70 hover:bg-black/50'
                }`}
              >
                {limit} words
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Voice Duration */}
      {showVoiceDuration && (
        <div>
          <h3 className="text-sm  text-white mb-3">Voice message duration</h3>
          <div className="flex flex-wrap gap-2">
            {voiceDurationOptions.map((duration) => (
              <button
                key={duration}
                onClick={() => setVoiceDuration(duration)}
                className={`px-4 py-2 rounded-lg text-sm cursor-pointer transition ${
                  voiceDuration === duration
                    ? 'bg-white text-black hover:bg-white/95 shadow-[0_4px_12px_rgba(255,255,255,0.2)]'
                    : 'bg-black/40 border border-white/20 text-white/70 hover:bg-black/50'
                }`}
              >
                {duration} min
              </button>
            ))}
          </div>
          <p className="text-xs text-white/50 mt-2">Default: 1 minute</p>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-4">
        <button
          onClick={() => router.push('/campaign/description')}
          className="px-6 py-2.5 rounded-lg bg-black/40 border border-white/20 hover:bg-black/50 text-white font-medium transition cursor-pointer"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold transition shadow-[0_4px_12px_rgba(255,255,255,0.2)] cursor-pointer"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
