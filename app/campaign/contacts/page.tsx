'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCampaign } from '../CampaignContext'

interface Contact {
  name: string
  phone: string
}

export default function ContactsPage() {
  const router = useRouter()
  const { campaign, updateCampaign } = useCampaign()
  const [contacts, setContacts] = useState<Contact[]>(campaign.contacts)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const parseCSV = (text: string): Contact[] => {
    const lines = text.trim().split('\n')
    const result: Contact[] = []

    lines.forEach((line, idx) => {
      if (idx === 0) return // Skip header
      const [name, phone] = line.split(',').map((s) => s.trim())
      if (name && phone) {
        result.push({ name, phone })
      }
    })

    return result
  }

  const parseExcel = (arrayBuffer: ArrayBuffer): Contact[] => {
    // Simple Excel parsing - looking for Name and Phone columns
    const result: Contact[] = []
    try {
      // For now, we'll treat Excel similar to CSV by converting to string
      const view = new Uint8Array(arrayBuffer)
      const text = String.fromCharCode.apply(null, Array.from(view))
      return parseCSV(text)
    } catch {
      return []
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.xlsx')
    )

    if (files.length > 0) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const parsed = parseCSV(text)
          if (parsed.length > 0) {
            setContacts(parsed)
            setError('')
          } else {
            setError('No valid contacts found')
          }
        } catch (err) {
          setError('Failed to parse file')
        }
      }
      reader.readAsText(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string
          const parsed = parseCSV(text)
          if (parsed.length > 0) {
            setContacts(parsed)
            setError('')
          } else {
            setError('No valid contacts found in CSV')
          }
        } catch (err) {
          setError('Failed to parse CSV file')
        }
      }
      reader.readAsText(e.target.files[0])
    }
  }

  const handleContinue = () => {
    if (contacts.length === 0) {
      setError('Please upload contacts')
      return
    }
    updateCampaign({ contacts })
    router.push('/campaign/preview')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl  text-white mb-2">Upload contacts</h1>
        <p className="text-slate-400">Import a CSV file with Name and Phone columns</p>
      </div>

      {/* Drag and drop area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-8 text-center transition ${
          dragActive
            ? 'border-white/60 bg-white/10'
            : 'border-white/20 bg-black/30 hover:border-white/30'
        }`}
      >
        <div className="space-y-3">
          <div className="text-4xl">📊</div>
          <div>
            <p className="text-white">Drag CSV or Excel file here or</p>
            <label className="text-white/80 cursor-pointer hover:text-white">
              click to browse
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-white/50">CSV or Excel format: Name, Phone</p>
        </div>
      </div>

      {/* Contacts summary */}
      {contacts.length > 0 && (
        <div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <p className="text-sm font-semibold text-white">
              ✓ {contacts.length} contact{contacts.length !== 1 ? 's' : ''} detected
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex justify-between gap-3 pt-4">
        <button
          onClick={() => router.push('/campaign/assets')}
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
