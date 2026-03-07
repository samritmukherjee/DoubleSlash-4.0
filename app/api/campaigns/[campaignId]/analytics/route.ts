import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase/admin'
import { auth } from '@clerk/nextjs/server'
import { twilioClient } from '@/lib/twilio-client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await params

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Fetching analytics for campaign: ${campaignId}, userId: ${userId}`)

    const db_ref = db

    // Fetch campaign data from user's campaigns collection
    const campaignDoc = await db_ref
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)
      .get()
    
    if (!campaignDoc.exists) {
      console.log(`❌ Campaign not found at users/${userId}/campaigns/${campaignId}`)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    const campaign = campaignDoc.data()
    console.log('✅ Campaign found:', campaign?.title)

    // Fetch all contacts from campaign
    const contactsFromCampaign = campaign?.contacts || campaign?.contactsSummary?.items || []
    console.log(`📌 Found ${contactsFromCampaign.length} contacts in campaign`)

    // Fetch messages from inbox structure: inbox/contacts/contacts/{contactId}/messages
    let allMessages: any[] = []
    const inboxContactsRef = db_ref
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)
      .collection('inbox')
      .doc('contacts')
      .collection('contacts')

    const contactsSnapshot = await inboxContactsRef.get()
    console.log(`📬 Found ${contactsSnapshot.docs.length} contact conversations`)

    // Fetch messages for each contact
    for (const contactDoc of contactsSnapshot.docs) {
      const messagesRef = contactDoc.ref.collection('messages')
      const messagesSnapshot = await messagesRef.get()
      
      messagesSnapshot.docs.forEach((msgDoc: any) => {
        allMessages.push({
          id: msgDoc.id,
          contactId: contactDoc.id,
          ...msgDoc.data()
        })
      })
    }

    console.log(`Total messages found: ${allMessages.length}`)
    const messages = allMessages

    // Calculate analytics
    const totalContacts = contactsFromCampaign.length
    
    // Count unique contacts who received the campaign message (have messages from campaign)
    const contactsReceivedMessage = new Set(
      messages
        .filter((msg: any) => msg.sender === 'campaign')
        .map((msg: any) => msg.contactId)
    ).size

    // Count contacts who replied (have incoming messages from user)
    const contactsReplied = new Set(
      messages
        .filter((msg: any) => msg.sender !== 'campaign' && msg.sender !== 'bot')
        .map((msg: any) => msg.contactId)
    ).size

    // Count contacts with opened chats (those with any messages)
    const contactsOpenedChat = new Set(
      messages.map((msg: any) => msg.contactId)
    ).size

    // Check if calls channel is enabled for this campaign
    const callsChannelEnabled = campaign?.channels?.calls?.enabled || campaign?.channels?.voice?.enabled || false
    console.log(`📞 Calls channel enabled: ${callsChannelEnabled}`)

    // Fetch real call data from Twilio
    let voiceCalls = 0
    let voiceCallsAnswered = 0

    if (callsChannelEnabled) {
      try {
        // Get campaign contact phone numbers
        const campaignPhones = contactsFromCampaign
          .map((c: any) => c.phone)
          .filter(Boolean)
        
        console.log(`📱 Searching Twilio for calls to: ${campaignPhones.join(', ')}`)

        // Fetch calls from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        
        const recentCalls = await twilioClient.calls.list({
          limit: 100,
          startTimeAfter: oneDayAgo,
        })

        console.log(`📞 Found ${recentCalls.length} calls in last 24h`)

        // Filter calls to campaign phone numbers
        const campaignCalls = recentCalls.filter((call: any) => {
          // Normalize both numbers - remove all non-digits
          const callToDigits = call.to?.replace(/\D/g, '')
          
          // Check if any campaign phone matches this call
          const isMatch = campaignPhones.some((phone: any) => {
            const phoneDigits = phone.replace(/\D/g, '')
            
            // Match if either:
            // 1. Exact match after removing non-digits
            // 2. Campaign phone is last 10 digits of call (e.g., 9883479073 matches +919883479073)
            if (phoneDigits === callToDigits) return true
            if (callToDigits?.endsWith(phoneDigits)) return true
            
            return false
          })

          if (isMatch) {
            console.log(`   ✓ Call to ${call.to} (${call.status}) - MATCHED campaign phone`)
          }

          return isMatch
        })

        // Count initiated calls and answered calls
        voiceCalls = campaignCalls.length
        voiceCallsAnswered = campaignCalls.filter((call: any) => 
          call.status === 'completed'
        ).length

        console.log(`Twilio calls to campaign phones: ${voiceCalls} initiated, ${voiceCallsAnswered} answered`)

        // Cache in Firebase for persistence
        await db_ref
          .collection('users')
          .doc(userId)
          .collection('campaigns')
          .doc(campaignId)
          .update({
            callStats: {
              initiated: voiceCalls,
              answered: voiceCallsAnswered,
              updatedAt: new Date().toISOString(),
            },
          })

        console.log(`✅ Call stats cached in Firebase`)
      } catch (error) {
        console.error('❌ Error fetching Twilio calls:', error)
        
        // Try to use cached data from Firebase
        try {
          const cachedStats = campaign?.callStats
          if (cachedStats) {
            voiceCalls = cachedStats.initiated
            voiceCallsAnswered = cachedStats.answered
            console.log(`⚠️ Using cached call stats: ${voiceCalls} initiated, ${voiceCallsAnswered} answered`)
          }
        } catch (cacheError) {
          console.error('Could not load cached stats:', cacheError)
        }
      }
    } else {
      console.log('⚠️ Call channel not enabled for this campaign, skipping call metrics')
    }

    // Count text interactions (incoming messages)
    const textInteractions = messages.filter(
      (msg: any) => msg.sender !== 'campaign' && msg.sender !== 'bot'
    ).length

    // Count AI chatbot responses
    const aiResponses = messages.filter(
      (msg: any) => msg.sender === 'bot' || msg.sender === 'ai' || msg.type === 'bot'
    ).length

    // Calculate average response time (time between campaign message and first reply per contact)
    const responseTimesMs: number[] = []
    
    const campaignMessageTimestamps: { [contactId: string]: number } = {}
    const firstReplyTimestamps: { [contactId: string]: number } = {}
    
    messages.forEach((msg: any) => {
      const contactId = msg.contactId
      const msgTime = new Date(msg.timestamp || msg.createdAt).getTime()
      
      if (msg.sender === 'campaign' && !campaignMessageTimestamps[contactId]) {
        campaignMessageTimestamps[contactId] = msgTime
      } else if (msg.sender !== 'campaign' && msg.sender !== 'bot' && !firstReplyTimestamps[contactId]) {
        firstReplyTimestamps[contactId] = msgTime
      }
    })
    
    Object.keys(firstReplyTimestamps).forEach((contactId) => {
      const sentTime = campaignMessageTimestamps[contactId]
      const replyTime = firstReplyTimestamps[contactId]
      if (sentTime && replyTime) {
        responseTimesMs.push(replyTime - sentTime)
      }
    })
    
    const avgResponseTime = responseTimesMs.length > 0
      ? Math.round(responseTimesMs.reduce((a, b) => a + b) / responseTimesMs.length)
      : 0

    // Channel breakdown
    const voiceChannelEnabled = campaign?.channels?.voice?.enabled || false
    const callChannelEnabled = campaign?.channels?.calls?.enabled || false
    const textChannelEnabled = campaign?.channels?.text?.enabled || false

    // Engagement score: percentage of contacts who engaged (replied OR answered real calls from Twilio)
    // ONLY count calls that were actually made via Twilio, not message-based fallbacks
    const engagedContacts = new Set([
      ...Array.from(
        new Set(
          messages
            .filter((msg: any) => msg.sender !== 'campaign' && msg.sender !== 'bot')
            .map((msg: any) => msg.contactId)
        )
      ),
    ]).size

    // Add Twilio call contacts to engagement (but only real Twilio calls, not fallback message-based)
    let engagementScore = totalContacts > 0
      ? Math.round((engagedContacts / totalContacts) * 100)
      : 0

    console.log(`📊 Analytics Summary:`)
    console.log(`   Total Contacts: ${totalContacts}`)
    console.log(`   Received Message: ${contactsReceivedMessage} (${Math.round((contactsReceivedMessage/totalContacts)*100)}%)`)
    console.log(`   Replied: ${contactsReplied} (${Math.round((contactsReplied/totalContacts)*100)}%)`)
    console.log(`   Voice Calls Answered: ${voiceCallsAnswered}`)
    console.log(`   Engagement Score: ${engagementScore}%`)
    console.log(`   Total Messages: ${messages.length}`)
    console.log(`   Total Conversations: ${contactsSnapshot.docs.length}`)

    return NextResponse.json({
      campaign: {
        id: campaignId,
        title: campaign?.title,
        description: campaign?.description,
        status: campaign?.status,
        createdAt: campaign?.createdAt,
        launchedAt: campaign?.launchedAt,
      },
      analytics: {
      // Contact metrics
        totalContacts,
        contactsReceivedMessage,
        contactsOpenedChat,
        contactsReplied,
        contactsNotInteracted: Math.max(0, totalContacts - contactsReplied),
        
        // Message delivery metrics
        deliveryRate: totalContacts > 0
          ? Math.round((contactsReceivedMessage / totalContacts) * 100)
          : 0,
        responseRate: totalContacts > 0
          ? Math.round((contactsReplied / totalContacts) * 100)
          : 0,
        
        // Voice/Call metrics
        voiceCalls,
        voiceCallsAnswered,
        voiceCallsMissed: Math.max(0, voiceCalls - voiceCallsAnswered),
        voiceCallsAnsweredRate: voiceCalls > 0
          ? Math.round((voiceCallsAnswered / voiceCalls) * 100)
          : 0,
        
        // Text metrics
        textInteractions,
        aiResponsesCount: aiResponses,
        avgResponseTimeMs: 0,
        
        // Channel configuration
        channels: {
          voice: campaign?.channels?.voice?.enabled || false,
          calls: campaign?.channels?.calls?.enabled || false,
          text: campaign?.channels?.text?.enabled || false,
        },
        
        // Engagement: only count real interactions (replies + real Twilio calls)
        engagementScore,
        
        // Additional metrics
        totalConversations: contactsSnapshot.docs.length,
        totalMessages: messages.length,
        
        // Debug info
        debug: {
          contactsReceivedMessage,
          contactsReplied,
          voiceCallsAnswered,
          totalContacts,
        }
      },
      conversationSummary: contactsSnapshot.docs.slice(0, 10).map((contactDoc: any) => {
        const contactId = contactDoc.id
        const contactMessages = messages.filter((msg: any) => msg.contactId === contactId)
        const lastMessage = contactMessages[contactMessages.length - 1]
        
        return {
          contactId,
          contactName: contactDoc.data().name || "Unknown",
          lastMessage: lastMessage?.content || "",
          lastMessageTime: lastMessage?.timestamp || lastMessage?.createdAt,
          messageCount: contactMessages.length,
          callDuration: contactDoc.data().callDuration || 0,
          callStatus: contactDoc.data().callStatus,
        }
      }),
    })
  } catch (error) {
    console.error('❌ Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
