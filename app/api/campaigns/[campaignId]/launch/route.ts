import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

type Context = { params: Promise<{ campaignId: string }> };

/**
 * POST /api/campaigns/[campaignId]/launch
 * 
 * Marks a draft campaign as launched.
 * Sets status: "launched" and launchedAt timestamp.
 * Campaign will now appear in /yourcampaigns list.
 */
export async function POST(
  request: NextRequest,
  { params }: Context
): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { campaignId } = await params;

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaignId" },
        { status: 400 }
      );
    }

    const ref = db
      .collection("users")
      .doc(userId)
      .collection("campaigns")
      .doc(campaignId);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    console.log("🚀 Launching campaign:", campaignId);

    const campaignData = snap.data() as any;

    // Get contacts FIRST from campaign data (before any writes)
    const contacts = campaignData.contacts || campaignData.contactsSummary?.items || [];
    console.log(`📦 Found ${contacts.length} contacts in campaign data`);

    if (contacts.length === 0) {
      console.warn("⚠️ No contacts found in campaign, cannot launch");
      return NextResponse.json(
        { error: "Campaign has no contacts to launch" },
        { status: 400 }
      );
    }

    // Launch the campaign
    await ref.set(
      {
        status: "launched",
        launchedAt: new Date(),
        updatedAt: new Date(),
      },
      { merge: true }
    );

    console.log("✅ Campaign marked as launched");

    // Create inbox structure for this campaign
    console.log("📬 Creating inbox structure with contacts...");
    
    const inboxContactsRef = ref
      .collection("inbox")
      .doc("contacts");

    // Create the inbox/contacts document
    await inboxContactsRef.set({
      createdAt: new Date(),
      totalContacts: contacts.length,
    });

    console.log(`✅ Created inbox/contacts document with totalContacts: ${contacts.length}`);

    if (contacts.length > 0) {
      let batch = db.batch();
      let batchOps = 0;
      let addedCount = 0;

      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];
        // Create unique contact ID: phone_index (e.g., 9883131455_0, 9883131455_1)
        const contactId = `${contact.phone || contact.id || contact.name}_${i}`;

        const contactRef = inboxContactsRef
          .collection("contacts")
          .doc(contactId);

        batch.set(contactRef, {
          contactId: contactId,
          contactName: contact.name || "Unknown",
          contactPhone: contact.phone || "",
          profilePic: contact.profilePic || "",
          lastMessage: "",
          lastMessageTime: null,
          unreadCount: 0,
          createdAt: FieldValue.serverTimestamp(),
        });
        batchOps++;
        addedCount++;
        console.log(`  ✓ Queuing contact: ${contact.name} (${contactId})`);

        // Add campaign title message
        if (campaignData.title) {
          const msgRef = contactRef.collection("messages").doc("msg_title");
          batch.set(msgRef, {
            sender: "campaign",
            type: "text",
            content: campaignData.title,
            timestamp: new Date(Date.now() - 5000).toISOString(),
            createdAt: FieldValue.serverTimestamp(),
          });
          batchOps++;
          console.log(`    📝 Added title message`);
        }

        // Add campaign preview message
        if (campaignData.previewText || campaignData.description) {
          const msgRef = contactRef.collection("messages").doc("msg_preview");
          const descText = typeof campaignData.description === "string" 
            ? campaignData.description 
            : campaignData.description?.aiEnhanced || campaignData.description?.original || "";
          
          batch.set(msgRef, {
            sender: "campaign",
            type: "text",
            content: campaignData.previewText || descText || "",
            timestamp: new Date(Date.now() - 4000).toISOString(),
            createdAt: FieldValue.serverTimestamp(),
          });
          batchOps++;
          console.log(`    📝 Added preview message`);
        }

        // Add audio message if exists
        if (campaignData.audioUrls?.voice) {
          const msgRef = contactRef.collection("messages").doc("msg_audio");
          batch.set(msgRef, {
            sender: "campaign",
            type: "audio",
            content: "Voice message",
            audioUrl: campaignData.audioUrls.voice,
            timestamp: new Date(Date.now() - 3000).toISOString(),
            createdAt: FieldValue.serverTimestamp(),
          });
          batchOps++;
          console.log(`    Added audio message`);
        }

        // Add assets message if exists
        if (campaignData.assets?.length > 0) {
          const msgRef = contactRef.collection("messages").doc("msg_assets");
          batch.set(msgRef, {
            sender: "campaign",
            type: "text",
            content: `📎 ${campaignData.assets.length} file(s)`,
            assets: campaignData.assets,
            timestamp: new Date(Date.now() - 2000).toISOString(),
            createdAt: FieldValue.serverTimestamp(),
          });
          batchOps++;
          console.log(`    📎 Added assets message`);
        }

        // Commit batch if reaching limit
        if (batchOps >= 450) {
          console.log(`💾 Committing batch (${batchOps} ops)...`);
          await batch.commit();
          console.log(`✅ Batch committed successfully`);
          batch = db.batch();
          batchOps = 0;
        }
      }

      // Commit remaining
      if (batchOps > 0) {
        console.log(`💾 Committing final batch (${batchOps} ops) for ${addedCount} contacts...`);
        await batch.commit();
        console.log(`✅ Final batch committed successfully`);
      }

      console.log(`✅ All ${addedCount} contacts added to inbox with campaign messages`);
    }

    // Trigger automatic AI message sending to all contacts
    try {
      await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/campaigns/${campaignId}/send-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
    } catch (error) {
      console.error('Error triggering message sending:', error)
      // Don't fail the launch if message sending fails
    }

    return NextResponse.json({
      success: true,
      campaignId,
    });
  } catch (error) {
    console.error("Campaign launch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
