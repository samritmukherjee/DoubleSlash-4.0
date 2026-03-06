'use client'

import React, { useState, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface CampaignFormData {
  title: string
  description: string
  campaignTypes: string[]
  toneOfVoice: string
  files: {
    assets: File[]
    csvFile: File | null
  }
  contacts: { name: string; phone: string }[]
}

interface CampaignPreview {
  type: 'text' | 'voice' | 'calls'
  content: string
  transcript?: string
  assets: string[]
}

const CampaignPage = () => {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  // Redirect if not signed in
  React.useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn, router])

  // Form state
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    campaignTypes: [],
    toneOfVoice: 'friendly',
    files: {
      assets: [],
      csvFile: null,
    },
    contacts: [],
  })

  const [currentStep, setCurrentStep] = useState<number>(0)

  const [preview, setPreview] = useState<CampaignPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const assetInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Handle text inputs
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Handle campaign type toggle
  const toggleCampaignType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      campaignTypes: prev.campaignTypes.includes(type)
        ? prev.campaignTypes.filter((t) => t !== type)
        : [...prev.campaignTypes, type],
    }))
    if (errors.campaignTypes) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors.campaignTypes
        return newErrors
      })
    }
  }

  // Handle asset file uploads
  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFormData((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          assets: [...prev.files.assets, ...newFiles],
        },
      }))
    }
  }

  // Handle CSV file upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({
        ...prev,
        files: {
          ...prev.files,
          csvFile: file,
        },
      }))
      // Parse CSV (mock)
      parseCSV(file)
    }
  }

  // Mock CSV parsing
  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map((h) => h.trim())
      const contacts = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim())
        return {
          name: values[0] || 'Contact',
          phone: values[1] || '',
        }
      })
      setFormData((prev) => ({
        ...prev,
        contacts: contacts.filter((c) => c.name),
      }))
    }
    reader.readAsText(file)
  }

  // Remove asset
  const removeAsset = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: {
        ...prev.files,
        assets: prev.files.assets.filter((_, i) => i !== index),
      },
    }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Campaign title is required'
    }

    if (formData.campaignTypes.length === 0) {
      newErrors.campaignTypes = 'Select at least one campaign type'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Generate mock preview
  const generatePreview = async () => {
    if (!validateForm()) return

    setLoading(true)

    // Simulate API call delay
    setTimeout(() => {
      const mockPreviews: Record<string, CampaignPreview> = {
        text: {
          type: 'text',
          content: `Hi {{name}}, \n\n${formData.description || formData.title}\n\nLooking forward to hearing from you!`,
          assets: formData.files.assets.map((f) => f.name),
        },
        voice: {
          type: 'voice',
          content: `Voice Message (${formData.toneOfVoice} tone)`,
          transcript: `Hello {{name}}, I'm reaching out with an exciting opportunity. ${formData.description || formData.title} I'd love to discuss this with you further. Feel free to reach out!`,
          assets: formData.files.assets.map((f) => f.name),
        },
        calls: {
          type: 'calls',
          content: `AI Call (${formData.toneOfVoice} tone)`,
          transcript: `Hello {{name}}, this is an automated call regarding ${formData.title}. ${formData.description || 'We have an exciting opportunity for you.'} Please press 1 to learn more or hang up to decline.`,
          assets: formData.files.assets.map((f) => f.name),
        },
      }

      const selectedType = formData.campaignTypes[0] || 'text'
      setPreview(mockPreviews[selectedType])
      setLoading(false)
    }, 1500)
  }

  // Regenerate preview
  const regeneratePreview = () => {
    generatePreview()
  }

  // Handle Done
  const handleDone = () => {
    // TODO: Send to backend
    alert('Campaign created! Contacts: ' + formData.contacts.length)
    router.push('/inbox')
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen  text-slate-100">
      {/* top nav */}
      <header className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-20 bg-black/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center text-xs font-bold">
              OX
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Campaign Studio</p>
              <h1 className="text-lg md:text-xl font-semibold">Create new outreach</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/inbox')}
              className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs text-slate-300 hover:bg-white/5 transition"
            >
              <span className="text-lg">📨</span>
              Inbox
            </button>
            <div className="h-8 w-8 rounded-full bg-slate-800" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 pb-32 grid gap-8 lg:grid-cols-[220px_minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* left rail */}
        <aside className="space-y-8">
          <div className="space-y-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              Flow
            </p>

            <div className="space-y-3">
              {[
                { id: 0, label: 'Details' },
                { id: 1, label: 'Channels' },
                { id: 2, label: 'Audience' },
                { id: 3, label: 'Review' },
              ].map((step) => {
                const active = currentStep === step.id
                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className={`
                    w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm
                    transition border
                    ${active
                        ? 'border-purple-500/70 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10 text-slate-50'
                        : 'border-white/5 bg-white/0 hover:bg-white/5 text-slate-400'
                      }
                  `}
                  >
                    <div className={`
                    h-6 w-6 rounded-lg flex items-center justify-center text-[11px] font-medium
                    ${active
                        ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white'
                        : 'bg-slate-900 text-slate-400'
                      }
                  `}>
                      {step.id + 1}
                    </div>
                    <span>{step.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-xs text-amber-100">
            <p className="font-semibold mb-1">Tip</p>
            <p>
              For the hackathon, keep your first campaign simple. You can duplicate and iterate later.
            </p>
          </div>
        </aside>

        {/* center: cards per step */}
        <section className="space-y-6">
          {/* STEP 0: Details */}
          {currentStep === 0 && (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.03] to-black/60 p-6 space-y-6 shadow-[0_24px_70px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Step 1</p>
                  <h2 className="text-xl font-semibold mt-1">Name your campaign</h2>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full border border-purple-500/40 text-purple-300 bg-purple-500/10">
                  Draft autosaved
                </span>
              </div>

              <div className="space-y-5">
                <div className="group">
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Title
                  </label>
                  <div className="mt-2 relative">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="eg. Black Friday SMS blitz"
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 outline-none transition"
                    />
                    {errors.title && (
                      <p className="mt-1 text-xs text-red-400">{errors.title}</p>
                    )}
                  </div>
                </div>

                <div className="group">
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="What is this campaign about?"
                    className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm placeholder:text-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/40 outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Channels */}
          {currentStep === 1 && (
            <div className="rounded-2xl border border-white/5 bg-[#070712] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Step 2</p>
                  <h2 className="text-xl font-semibold mt-1">Choose channels</h2>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'text', label: 'Text', desc: 'SMS & WhatsApp' },
                  { key: 'voice', label: 'Voice', desc: 'AI voice note' },
                  { key: 'calls', label: 'Calls', desc: 'AI dialer' },
                ].map((c) => {
                  const active = formData.campaignTypes.includes(c.key)
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => toggleCampaignType(c.key)}
                      className={`
                      group flex-1 min-w-[140px] rounded-2xl border px-4 py-3 text-left text-sm
                      transition flex flex-col justify-between
                      ${active
                          ? 'border-purple-500/70 bg-gradient-to-br from-purple-500/20 to-fuchsia-500/10 shadow-[0_0_30px_rgba(168,85,247,0.45)]'
                          : 'border-white/8 bg-white/0 hover:bg-white/5'
                        }
                    `}
                    >
                      <span className="font-medium">{c.label}</span>
                      <span className="text-[11px] text-slate-400 mt-1">
                        {c.desc}
                      </span>
                    </button>
                  )
                })}
              </div>

              {errors.campaignTypes && (
                <p className="text-xs text-red-400">{errors.campaignTypes}</p>
              )}

              {(formData.campaignTypes.includes('voice') ||
                formData.campaignTypes.includes('calls')) && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Tone of voice
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {['friendly', 'professional', 'energetic', 'formal', 'casual'].map((tone) => {
                        const active = formData.toneOfVoice === tone
                        return (
                          <button
                            key={tone}
                            type="button"
                            onClick={() =>
                              handleInputChange({
                                target: { name: 'toneOfVoice', value: tone },
                              } as any)
                            }
                            className={`
                          px-3 py-1.5 rounded-full text-xs capitalize border transition
                          ${active
                                ? 'border-purple-500 bg-purple-500/20 text-purple-100'
                                : 'border-white/10 text-slate-300 hover:bg-white/5'
                              }
                        `}
                          >
                            {tone}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* STEP 2: Assets & contacts */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* assets card */}
              <div className="rounded-2xl border border-white/5 bg-[#070712] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Assets</h2>
                  <span className="text-[11px] text-slate-400">
                    PNG · JPG · MP4 · MOV · up to 50MB
                  </span>
                </div>

                <div
                  onClick={() => assetInputRef.current?.click()}
                  className="mt-1 relative border border-dashed border-white/15 rounded-2xl px-4 py-6 text-center cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition group"
                >
                  <div className="mx-auto mb-2 h-9 w-9 rounded-2xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition">
                    ⬆
                  </div>
                  <p className="text-sm text-slate-200">
                    Drop creatives here or <span className="text-purple-300">browse</span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We auto‑optimize for each channel.
                  </p>
                  <input
                    ref={assetInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleAssetUpload}
                    className="hidden"
                  />
                </div>

                {formData.files.assets.length > 0 && (
                  <div className="pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-slate-300">
                        {formData.files.assets.length} asset(s)
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            files: { ...prev.files, assets: [] },
                          }))
                        }
                        className="text-[11px] text-slate-400 hover:text-red-300"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.files.assets.map((file, index) => (
                        <div
                          key={index}
                          className="relative rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-[11px] text-slate-300 group"
                        >
                          <p className="truncate">{file.name}</p>
                          <button
                            type="button"
                            onClick={() => removeAsset(index)}
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-[11px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* contacts card */}
              <div className="rounded-2xl border border-white/5 bg-[#070712] p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Audience</h2>
                  <span className="text-[11px] text-slate-400">
                    CSV · Excel · Name, Phone
                  </span>
                </div>

                <div
                  onClick={() => csvInputRef.current?.click()}
                  className="border border-dashed border-white/15 rounded-2xl px-4 py-5 text-center cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition"
                >
                  <p className="text-sm text-slate-200">
                    Upload contact list
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We only read Name and Phone columns.
                  </p>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </div>

                {formData.contacts.length > 0 && (
                  <div className="pt-3 border-t border-white/5 text-xs text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                    <p className="font-medium mb-1">
                      {formData.contacts.length} contact(s) detected
                    </p>
                    {formData.contacts.slice(0, 6).map((c, idx) => (
                      <p key={idx} className="text-slate-400">
                        {c.name} {c.phone && <span className="text-slate-500">({c.phone})</span>}
                      </p>
                    ))}
                    {formData.contacts.length > 6 && (
                      <p className="text-slate-500">
                        +{formData.contacts.length - 6} more…
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: just reuse your preview section if you want, or keep empty and rely on right pane */}
        </section>

        {/* right live preview */}
        <aside className="hidden md:flex flex-col gap-4">
          <div className="rounded-2xl border border-white/5 bg-gradient-to-b from-white/[0.08] to-black/80 p-5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -top-16 -right-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Live preview
            </p>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-400">Channel</p>
              <div className="flex gap-2 text-[11px]">
                {['text', 'voice', 'calls'].map((type) => {
                  const active = formData.campaignTypes.includes(type)
                  return (
                    <span
                      key={type}
                      className={`
                      px-2 py-1 rounded-full border
                      ${active
                          ? 'border-purple-400/70 bg-purple-500/20 text-purple-50'
                          : 'border-white/10 text-slate-500'
                        }
                    `}
                    >
                      {type}
                    </span>
                  )
                })}
              </div>

              <div className="mt-4 rounded-2xl bg-black/60 border border-white/10 p-4 space-y-2 text-xs">
                <p className="text-[10px] text-slate-500">Message</p>
                <p className="whitespace-pre-wrap text-slate-100">
                  {preview
                    ? preview.content
                    : formData.description ||
                    `Hi {{name}},\n\n${formData.title || 'Your campaign message will appear here.'}\n\nLooking forward to hearing from you!`}
                </p>
              </div>

              <p className="mt-3 text-[11px] text-slate-500">
                {formData.contacts.length > 0
                  ? `Ready to send to ${formData.contacts.length} contact(s).`
                  : 'Upload contacts to see audience stats.'}
              </p>
            </div>
          </div>
        </aside>
      </main>

      {/* bottom rail */}
      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            Step {currentStep + 1} of 4
          </p>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-200 hover:bg-white/5"
              >
                Back
              </button>
            )}
            {currentStep < 3 && (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="px-4 py-2 rounded-xl bg-white text-xs font-semibold text-black hover:bg-slate-100"
              >
                Continue
              </button>
            )}
            {currentStep === 3 && (
              <button
                onClick={generatePreview}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-xs font-semibold text-white shadow-[0_0_35px_rgba(168,85,247,0.7)] flex items-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Generating…' : 'Launch preview'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

}

export default CampaignPage
