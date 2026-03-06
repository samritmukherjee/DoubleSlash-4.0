'use client'

import React, { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  sender: 'user' | 'ai'
  type: 'text'
  content: string
  timestamp: string
}

interface Contact {
  id: string
  name: string
  phone: string
  lastMessage: string
  timestamp: string
  unread: boolean
  profilePic?: string
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
        profilePic: 'https://i.pravatar.cc/150?img=1',
      },
      {
        id: 'c2',
        name: 'Sarah Smith',
        phone: '+0987654321',
        lastMessage: 'Interested in the offer',
        timestamp: '9:15 AM',
        unread: false,
        profilePic: 'https://i.pravatar.cc/150?img=5',
      },
      {
        id: 'c3',
        name: 'Mike Johnson',
        phone: '+1122334455',
        lastMessage: 'No thanks',
        timestamp: 'Yesterday',
        unread: false,
        profilePic: 'https://i.pravatar.cc/150?img=3',
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
        profilePic: 'https://i.pravatar.cc/150?img=9',
      },
      {
        id: 'c5',
        name: 'David Brown',
        phone: '+6666666666',
        lastMessage: 'Sounds great!',
        timestamp: '12:00 PM',
        unread: false,
        profilePic: 'https://i.pravatar.cc/150?img=7',
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
      sender: 'ai',
      type: 'text',
      content: 'Thanks for reaching out! Tell me more about it.',
      timestamp: '10:30 AM',
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
      sender: 'ai',
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
      sender: 'ai',
      type: 'text',
      content: 'Can you tell me more?',
      timestamp: '2:45 PM',
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
  const [messages, setMessages] = useState<Record<string, Message[]>>(mockMessages)

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId)
  const selectedContact = selectedCampaign?.contacts.find(
    (c) => c.id === selectedContactId
  )
  const selectedMessages = messages[selectedContactId] || []

  const filteredContacts = selectedCampaign?.contacts.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return

    // Add user message
    const newMessage: Message = {
      id: `m${Date.now()}`,
      sender: 'user',
      type: 'text',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updatedMessages = [...(messages[selectedContactId] || []), newMessage]
    setMessages({ ...messages, [selectedContactId]: updatedMessages })

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiMessage: Message = {
        id: `m${Date.now()}`,
        sender: 'ai',
        type: 'text',
        content: 'Thanks for your message! How can I help you?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      updatedMessages.push(aiMessage)
      setMessages({ ...messages, [selectedContactId]: updatedMessages })
    }, 500)
  }

  const handleDeleteMessage = (messageId: string) => {
    const updatedMessages = messages[selectedContactId].filter((m) => m.id !== messageId)
    setMessages({ ...messages, [selectedContactId]: updatedMessages })
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className='h-screen bg-white text-gray-900 flex flex-col'>
      {/* Back Button Header */}
      <div className='border-b border-gray-300 p-4'>
        <button
          onClick={() => router.back()}
          className='text-xl font-medium text-black px-2 py-1.5 border-2 border-black rounded-xl hover:bg-black/10 transition cursor-pointer'
          title="Go back"
        >
          Back
        </button>
      </div>

      <div className='flex-1 flex'>
        {/* Left Panel - Campaigns */}
        <div className='w-64 bg-gray-50 border-r border-gray-300 flex flex-col'>
          <div className='p-4 border-b border-gray-300'>
            <h2 className='text-xl font-bold text-gray-900'>WhatsApp Business</h2>
          </div>
          <div className='flex-1 overflow-y-auto'>
            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => {
                  setSelectedCampaignId(campaign.id)
                  setSelectedContactId(campaign.contacts[0].id)
                }}
                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-100 transition ${selectedCampaignId === campaign.id ? 'bg-green-100 border-l-4 border-l-green-500' : ''
                  }`}
              >
                <p className='font-semibold text-sm truncate text-gray-900'>{campaign.name}</p>
                <p className='text-xs text-gray-600 mt-1'>
                  {campaign.contacts.length} contact{campaign.contacts.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Middle Panel - Contacts */}
        <div className='w-72 bg-white border-r border-gray-300 flex flex-col'>
          <div className='p-4 border-b border-gray-300'>
            <input
              type='text'
              placeholder='Search contacts...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full px-3 py-2 bg-gray-100 text-gray-900 rounded-full border border-gray-300 focus:border-green-500 focus:outline-none text-sm placeholder-gray-500'
            />
          </div>
          <div className='flex-1 overflow-y-auto'>
            {filteredContacts?.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContactId(contact.id)}
                className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition ${selectedContactId === contact.id ? 'bg-gray-100' : ''
                  }`}
              >
                <div className='flex items-start justify-between gap-3'>
                  <img
                    src={contact.profilePic || 'https://i.pravatar.cc/150'}
                    alt={contact.name}
                    className='w-12 h-12 rounded-full object-cover flex-shrink-0'
                  />
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900'>{contact.name}</p>
                    <p className='text-xs text-gray-600 mt-1 truncate'>
                      {contact.lastMessage}
                    </p>
                  </div>
                  {contact.unread && (
                    <div className='w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold ml-2 flex-shrink-0'>
                      1
                    </div>
                  )}
                </div>
                <p className='text-xs text-gray-500 mt-1'>{contact.timestamp}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel - Messages */}
        <div className='flex-1 bg-gray-50 flex flex-col'>
          {/* Chat Header */}
          <div className='bg-white border-b border-gray-300 p-4 flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-bold text-gray-900'>{selectedContact?.name}</h3>
              <p className='text-xs text-gray-600'>{selectedContact?.phone}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div
            className='flex-1 overflow-y-auto p-4 space-y-3 bg-cover bg-center relative'
            style={{
              backgroundImage: 'url(https://i.postimg.cc/VNpNSfZ8/messages-background.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Messages */}
            <div className='relative z-10 flex flex-col space-y-3'>
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'
                    } group`}
                >
                  <div className='flex items-end gap-2'>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg break-words shadow-sm ${message.sender === 'user'
                          ? 'bg-gray-200 text-gray-900'
                          : 'bg-green-500 text-white'
                        }`}
                    >
                      <p className='text-sm'>{message.content}</p>
                      <p className='text-xs mt-1 opacity-70'>{message.timestamp}</p>
                    </div>

                    {/* Delete Button - Only for User Messages */}
                    {message.sender === 'user' && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className='opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs mb-1'
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <div className='bg-white border-t border-gray-300 p-4'>
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Message'
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    handleSendMessage(e.currentTarget.value)
                    e.currentTarget.value = ''
                  }
                }}
                className='flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-full border border-gray-300 focus:border-green-500 focus:outline-none text-sm placeholder-gray-500'
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Message"]') as HTMLInputElement
                  if (input && input.value.trim()) {
                    handleSendMessage(input.value)
                    input.value = ''
                  }
                }}
                className='bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full text-sm transition font-medium'
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InboxPage
