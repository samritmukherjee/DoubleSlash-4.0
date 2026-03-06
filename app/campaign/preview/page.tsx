'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCampaign } from '../CampaignContext'

export default function PreviewPage() {
  const router = useRouter()
  const { campaign } = useCampaign()
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [preview, setPreview] = useState<{ type: string; content: string; transcript?: string }>({
    type: campaign.channels[0] || 'Text',
    content: `${campaign.title}\n\n${campaign.description}`,
    transcript: `Hello! I'm reaching out about ${campaign.title}. ${campaign.description}`,
  })

  const generatePreview = async () => {
    setIsRegenerating(true)
    // TODO: Call backend API to generate preview
    // For now, simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setPreview({
      type: campaign.channels[0] || 'Text',
      content: `${campaign.title}\n\n${campaign.description}`,
      transcript: `Hello! I'm reaching out about ${campaign.title}. ${campaign.description}`,
    })
    setIsRegenerating(false)
  }

  const handleLaunch = () => {
    // TODO: Call backend API to launch campaign
    console.log('Campaign data:', campaign)
    alert('Campaign would be sent to backend now!')
  }

  const isTextOnly = campaign.channels.length === 1 && campaign.channels[0] === 'Text'
  const hasVoiceOrCalls = campaign.channels.includes('Voice') || campaign.channels.includes('Calls')

  return (
    <div className="space-y-6 flex flex-col  h-[60vh]">
      <div>
        <h1 className="text-3xl  text-white mb-2">Campaign preview</h1>
        <p className="text-slate-400">Review how your campaign will look</p>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 pb-3">
        {/* Campaign info */}
        <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
        <div>
          <p className="text-xs text-white/50">Title</p>
          <p className="text-white font-semibold">{campaign.title}</p>
        </div>
        <div>
          <p className="text-xs text-white/50">Channels</p>
          <div className="flex flex-wrap gap-2 mt-1">
            {campaign.channels.map((ch) => (
              <span key={ch} className="px-2 py-1 bg-white/10 text-white/80 rounded-lg text-xs border border-white/20">
                {ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Message preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white">Message preview</h3>
        {isTextOnly ? (
          <div className="bg-black/40 border border-white/10 rounded-2xl p-4 max-w-xs">
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">{preview.content}</p>
          </div>
        ) : hasVoiceOrCalls ? (
          <div className="space-y-3">
            {/* Audio player mock */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black hover:bg-white/95 transition font-semibold cursor-pointer">
                  ▶
                </button>
                <div className="flex-1">
                  <div className="h-2 bg-white/20 rounded-full" />
                  <div className="flex justify-between mt-1 text-xs text-white/50">
                    <span>0:00</span>
                    <span>2:34</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Transcript */}
            <div>
              <p className="text-xs text-white/50 mb-2">Transcript</p>
              <textarea
                value={preview.transcript}
                readOnly
                className="w-full h-24 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white/80 text-sm resize-none"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Assets */}
      {campaign.assets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-2">Attached assets</h3>
          <div className="grid grid-cols-3 gap-2">
            {campaign.assets.map((file, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-2 text-center">
                <p className="text-2xl mb-1">{file.type.startsWith('image') ? '🖼️' : '🎬'}</p>
                <p className="text-xs text-slate-400 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contacts summary */}
      <div className="bg-slate-800/30 rounded-xl p-4">
        <p className="text-slate-400">
          Will be sent to <span className="text-white font-semibold">{campaign.contacts.length}</span> contact
          {campaign.contacts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 mt-6 border-t border-white/10">
        <Link
          href="/campaign/contacts"
          className="px-6 py-2.5 rounded-lg bg-black/40 border border-white/20 hover:bg-black/50 text-white font-medium transition cursor-pointer"
        >
           Back
        </Link>
        <div className="flex gap-3">
          <button
            onClick={generatePreview}
            disabled={isRegenerating}
            className="px-6 py-2.5 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {isRegenerating ? '⟳ Regenerating...' : 'Regenerate'}
          </button>
          <button
            onClick={handleLaunch}
            className="px-6 py-2.5 rounded-lg bg-white hover:bg-white/95 text-black font-semibold transition shadow-[0_4px_12px_rgba(255,255,255,0.2)] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
