import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { generateCampaignReply } from "@/lib/campaign-langchain";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string; contactId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { campaignId, contactId } = await params;
    const { message } = await request.json();

    const contactRef = db
      .collection("users")
      .doc(userId)
      .collection("campaigns")
      .doc(campaignId)
      .collection("inbox")
      .doc("contacts")
      .collection("contacts")
      .doc(contactId);

    // Save USER message
    const userMsgId = `user_${Date.now()}`;
    await contactRef.collection("messages").doc(userMsgId).set({
      sender: "user",
      content: message,
      timestamp: new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    });

    // Generate AI response (WAIT for it to complete)
    const aiReply = await generateCampaignReply({
      userId,
      campaignId,
      contactId,
      message,
    });

    return NextResponse.json({
      success: true,
      messageId: userMsgId,
      aiReply: aiReply,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
