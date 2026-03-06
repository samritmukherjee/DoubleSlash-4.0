'use client'

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  sender: 'user' | 'contact'
  type: 'text' | 'voice' | 'call'
  content: string
  timestamp: string
  duration?: string
}

interface Contact {
  id: string
  name: string
  phone: string
  lastMessage: string
  timestamp: string
  unread: boolean
}

interface Campaign {
  id: string
  name: string
  contacts: Contact[]
  messages: Message[]
}

// Mock data
const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale Campaign',
    contacts: [
      {
        id: 'c1',
        name: 'John Doe',
        phone: '+1234567890',
        lastMessage: 'Thanks for reaching out!',
        timestamp: '10:30 AM',
        unread: true,
      },
      {
        id: 'c2',
        name: 'Sarah Smith',
        phone: '+0987654321',
        lastMessage: 'Interested in the offer',
        timestamp: '9:15 AM',
        unread: false,
      },
      {
        id: 'c3',
        name: 'Mike Johnson',
        phone: '+1122334455',
        lastMessage: 'No thanks',
        timestamp: 'Yesterday',
        unread: false,
      },
    ],
    messages: [],
  },
  {
    id: '2',
    name: 'Product Launch',
    contacts: [
      {
        id: 'c4',
        name: 'Emma Wilson',
        phone: '+5555555555',
        lastMessage: 'Can you tell me more?',
        timestamp: '2:45 PM',
        unread: true,
      },
      {
        id: 'c5',
        name: 'David Brown',
        phone: '+6666666666',
        lastMessage: 'Sounds great!',
        timestamp: '12:00 PM',
        unread: false,
      },
    ],
    messages: [],
  },
]

const mockMessages: Record<string, Message[]> = {
  'c1': [
    {
      id: 'm1',
      sender: 'user',
      type: 'text',
      content: 'Hi John! We have an exciting summer sale happening...',
      timestamp: '10:00 AM',
    },
    {
      id: 'm2',
      sender: 'contact',
      type: 'text',
      content: 'Thanks for reaching out! Tell me more about it.',
      timestamp: '10:30 AM',
    },
    {
      id: 'm3',
      sender: 'user',
      type: 'voice',
      content: 'Voice message',
      timestamp: '10:35 AM',
      duration: '0:45',
    },
  ],
  'c2': [
    {
      id: 'm4',
      sender: 'user',
      type: 'text',
      content: 'Exclusive summer deals just for you...',
      timestamp: '8:45 AM',
    },
    {
      id: 'm5',
      sender: 'contact',
      type: 'text',
      content: 'Interested in the offer',
      timestamp: '9:15 AM',
    },
  ],
  'c4': [
    {
      id: 'm6',
      sender: 'user',
      type: 'text',
      content: 'Welcome to our new product launch!',
      timestamp: '1:00 PM',
    },
    {
      id: 'm7',
      sender: 'contact',
      type: 'text',
      content: 'Can you tell me more?',
      timestamp: '2:45 PM',
    },
    {
      id: 'm8',
      sender: 'user',
      type: 'call',
      content: 'Outgoing call',
      timestamp: '3:00 PM',
      duration: '5:23',
    },
  ],
}

const InboxPage = () => {
  const { isSignedIn } = useAuth()
  const router = useRouter()

  // Redirect if not signed in
  React.useEffect(() => {
    if (!isSignedIn) {
      router.push('/')
    }
  }, [isSignedIn, router])

  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(MOCK_CAMPAIGNS[0].id)
  const [selectedContactId, setSelectedContactId] = useState<string>(
    MOCK_CAMPAIGNS[0].contacts[0].id
  )
  const [searchTerm, setSearchTerm] = useState('')

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)
  const selectedContact = selectedCampaign?.contacts.find(
    (c) => c.id === selectedContactId
  )
  const selectedMessages = mockMessages[selectedContactId] || []

  const filteredContacts = selectedCampaign?.contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = (text: string) => {
    // Mock sending message
    alert(`Message sent to ${selectedContact?.name}: "${text}"`)
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className='h-screen bg-zinc-900 text-white flex'>
      {/* Left Panel - Campaigns */}
      <div className='w-64 bg-zinc-800 border-r border-zinc-700 flex flex-col'>
        <div className='p-4 border-b border-zinc-700'>
          <h2 className='text-xl font-bold'>Campaigns</h2>
        </div>
        <div className='flex-1 overflow-y-auto'>
          {campaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => {
                setSelectedCampaignId(campaign.id)
                setSelectedContactId(campaign.contacts[0].id)
              }}
              className={`w-full text-left p-4 border-b border-zinc-700 hover:bg-zinc-700 transition ${
                selectedCampaignId === campaign.id ? 'bg-purple-600' : ''
              }`}
            >
              <p className='font-semibold text-sm truncate'>{campaign.name}</p>
              <p className='text-xs text-gray-400 mt-1'>
                {campaign.contacts.length} contact{campaign.contacts.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Panel - Contacts */}
      <div className='w-72 bg-zinc-800 border-r border-zinc-700 flex flex-col'>
        <div className='p-4 border-b border-zinc-700'>
          <input
            type='text'
            placeholder='Search contacts...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full px-3 py-2 bg-zinc-700 text-white rounded-lg border border-zinc-600 focus:border-purple-500 focus:outline-none text-sm'
          />
        </div>
        <div className='flex-1 overflow-y-auto'>
          {filteredContacts?.map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedContactId(contact.id)}
              className={`w-full text-left p-4 border-b border-zinc-700 hover:bg-zinc-700 transition ${
                selectedContactId === contact.id ? 'bg-purple-600' : ''
              } ${contact.unread ? 'font-bold' : ''}`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <p className='text-sm'>{contact.name}</p>
                  <p className='text-xs text-gray-400 mt-1 truncate'>
                    {contact.lastMessage}
                  </p>
                </div>
                {contact.unread && (
                  <div className='w-2 h-2 bg-purple-600 rounded-full mt-1'></div>
                )}
              </div>
              <p className='text-xs text-gray-500 mt-1'>{contact.timestamp}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Messages */}
      <div className='flex-1 bg-zinc-900 flex flex-col'>
        {/* Chat Header */}
        <div className='bg-zinc-800 border-b border-zinc-700 p-4 flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-bold'>{selectedContact?.name}</h3>
            <p className='text-xs text-gray-400'>{selectedContact?.phone}</p>
          </div>
          <div className='flex gap-2'>
            <button className='bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg text-sm transition'>
              📞
            </button>
            <button className='bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded-lg text-sm transition'>
              ⋯
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-4 space-y-4'>
          {selectedMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-700 text-gray-100'
                }`}
              >
                {message.type === 'text' && (
                  <p className='text-sm'>{message.content}</p>
                )}

                {message.type === 'voice' && (
                  <div className='space-y-2'>
                    <p className='text-xs text-gray-300 mb-2'>🎙️ Voice Message</p>
                    <div className='flex items-center gap-2'>
                      <button className='bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-xs transition'>
                        ▶
                      </button>
                      <div className='h-1 w-20 bg-white/20 rounded'></div>
                      <span className='text-xs'>{message.duration}</span>
                    </div>
                  </div>
                )}

                {message.type === 'call' && (
                  <div className='space-y-2'>
                    <p className='text-xs font-semibold'>📞 {message.content}</p>
                    <p className='text-xs text-gray-300'>Duration: {message.duration}</p>
                  </div>
                )}

                <p className='text-xs opacity-70 mt-1'>{message.timestamp}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className='bg-zinc-800 border-t border-zinc-700 p-4'>
          <div className='flex gap-2'>
            <input
              type='text'
              placeholder='Type a message...'
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSendMessage(e.currentTarget.value)
                  e.currentTarget.value = ''
                }
              }}
              className='flex-1 px-4 py-2 bg-zinc-700 text-white rounded-lg border border-zinc-600 focus:border-purple-500 focus:outline-none text-sm'
            />
            <button className='bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm transition'>
              Send
            </button>
          </div>
          <div className='flex gap-2 mt-2'>
            <button className='text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded transition'>
              🎤 Voice
            </button>
            <button className='text-xs bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded transition'>
              📞 Call
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InboxPage
