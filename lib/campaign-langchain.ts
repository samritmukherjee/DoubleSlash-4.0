import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { db } from './firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const model = new ChatGoogleGenerativeAI({
  model: 'gemini-2.5-flash',
  apiKey: process.env.GEMINI_WHATSAPP_API_KEY!,
  temperature: 0.1,
});

/**
 * Load chat history from Firestore
 */
export async function loadChatHistory({
  userId,
  campaignId,
  contactId,
}: {
  userId: string;
  campaignId: string;
  contactId: string;
}): Promise<Array<{ input: string; output: string }>> {
  try {
    const snapshot = await db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)
      .collection('inbox')
      .doc('contacts')
      .collection('contacts')
      .doc(contactId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(20)
      .get();

    const history: Array<{ input: string; output: string }> = [];
    let lastUserMsg = '';

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.sender === 'user') {
        lastUserMsg = data.content;
      } else if (data.sender === 'ai' && lastUserMsg) {
        history.push({ input: lastUserMsg, output: data.content });
        lastUserMsg = '';
      }
    });

    return history;
  } catch (error) {
    console.error('Load history error:', error);
    return [];
  }
}

/**
 * Save AI chat message to Firestore
 */
export async function saveChatHistory({
  userId,
  campaignId,
  contactId,
  aiReply,
}: {
  userId: string;
  campaignId: string;
  contactId: string;
  aiReply: string;
}): Promise<void> {
  try {
    const contactRef = db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)
      .collection('inbox')
      .doc('contacts')
      .collection('contacts')
      .doc(contactId);

    const aiMsgId = `ai_${Date.now()}`;
    await contactRef.collection('messages').doc(aiMsgId).set({
      sender: 'ai',
      type: 'text',
      content: aiReply,
      timestamp: new Date().toISOString(),
      createdAt: Timestamp.now(),
    });

    await contactRef.set(
      {
        lastMessage: aiReply,
        lastMessageTime: Timestamp.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Save error:', error);
  }
}

/**
 * MAIN: Generate campaign-specific AI reply using GEMINI_WHATSAPP_API_KEY
 */
export async function generateCampaignReply({
  userId,
  campaignId,
  contactId,
  message,
}: {
  userId: string;
  campaignId: string;
  contactId: string;
  message: string;
}): Promise<string> {
  try {
    const campaignDoc = await db
      .collection('users')
      .doc(userId)
      .collection('campaigns')
      .doc(campaignId)
      .get();

    if (!campaignDoc.exists) return 'Campaign not found';

    const data = campaignDoc.data()!;
    // Only use description and document extracts - NOT the title
    const context = `
${data.description?.original || data.description || ''}
${data.documents?.map((d: any) => d.extractedText).join('\n\n') || ''}
    `.trim();

    const history = await loadChatHistory({ userId, campaignId, contactId });

    const prompt = `You are a professional assistant. Provide clear, formal, and informative responses.

Only answer based on this information:
${context}

Conversation history:
${history.map((h) => `User: ${h.input}\nAssistant: ${h.output}`).join('\n')}

User: ${message}
Assistant:`;

    const result = await model.invoke(prompt);
    const aiReply = result.content?.toString().trim() || 'I am here to assist you with any questions regarding the provided information.';

    await saveChatHistory({ userId, campaignId, contactId, aiReply });
    return aiReply;
  } catch (error) {
    console.error(error);
    return 'Thanks! Ask about offers, dates, or campaign info.';
  }
}
