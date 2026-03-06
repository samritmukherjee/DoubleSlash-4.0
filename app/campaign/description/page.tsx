'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaign } from '../CampaignContext'
import { ArrowUp } from 'lucide-react'

export default function DescriptionPage() {
  const router = useRouter()
  const { campaign, updateCampaign } = useCampaign()
  const [description, setDescription] = useState(campaign.description)
  const [error, setError] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }

  const handleSend = () => {
    if (!description.trim()) {
      setError('Campaign description is required')
      return
    }
    updateCampaign({ description: description.trim() })
    router.push('/campaign/channels')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl  text-white mb-2">Describe your campaign</h1>
        <p className="text-slate-400">Tell us what your campaign is about and what you want to achieve</p>
      </div>

      <div className="relative">
        <div className="rounded-3xl border border-[#444444] bg-[#1F2023] backdrop-blur-xl p-4 shadow-[0_8px_30px_rgba(0,0,0,0.24)]">
          <textarea
            ref={textareaRef}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setError('')
              autoResizeTextarea()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Describe your campaign message, goals, and key details..."
            rows={1}
            className="flex w-full rounded-md border-none bg-transparent px-3 py-2.5 text-base text-gray-100 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none max-h-64 font-helvetica"
          />
          
          <div className="flex items-end justify-between gap-3 mt-4 pt-4 border-t border-white/5">
            <button
              onClick={() => router.push('/campaign/title')}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-100 bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSend}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white hover:bg-white/90 text-[#1F2023] transition shadow-[0_0_15px_rgba(255,255,255,0.2)] cursor-pointer"
              title="Send (Enter)"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  )
}
