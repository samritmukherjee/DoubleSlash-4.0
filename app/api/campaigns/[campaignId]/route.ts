import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { userId } = await auth();

    console.log(`[API] GET /campaigns/[campaignId] - Auth check:`, { userId });

    if (!userId) {
      console.error(`[API] Authentication failed - no userId`);
      return NextResponse.json({ error: "Unauthorized - no session" }, { status: 401 });
    }

    const { campaignId } = await props.params;

    console.log(`[API] Fetching campaign:`, { userId, campaignId });

    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaignId" },
        { status: 400 }
      );
    }

    // Fetch campaign from database - TRY BOTH PATHS
    let campaignSnapshot = await db
      .collection("users")
      .doc(userId)
      .collection("campaigns")
      .doc(campaignId)
      .get();

    console.log(`[API] Campaign lookup result (user path):`, { exists: campaignSnapshot.exists });

    // Fallback to root-level campaigns if not found in user path
    if (!campaignSnapshot.exists) {
      console.log(`[API] Campaign not found in user path, trying root-level path...`);
      campaignSnapshot = await db
        .collection("campaigns")
        .doc(campaignId)
        .get();
      console.log(`[API] Campaign lookup result (root path):`, { exists: campaignSnapshot.exists });
    }

    if (!campaignSnapshot.exists) {
      console.warn(`[API] Campaign not found in either location:`, { userId, campaignId });
      return NextResponse.json(
        { error: "Campaign not found in either location" },
        { status: 404 }
      );
    }

    const campaignData = campaignSnapshot.data() as any;

    // 🔥 FIX: Explicit nested map extraction
    const channelContent = {
      voice: { 
        transcript: campaignData.channelContent?.voice?.transcript || '' 
      },
      calls: { 
        transcript: campaignData.channelContent?.calls?.transcript || '' 
      }
    };

    const audioUrls = {
      voice: campaignData.audioUrls?.voice || '',
      calls: campaignData.audioUrls?.calls || ''
    };

    return NextResponse.json(
      {
        campaign: {  
          id: campaignId,
          ...campaignData,
          channelContent,        // ← FIXED!
          audioUrls,             // ← FIXED!
          createdAt: campaignData?.createdAt?.toDate?.() || new Date(),
          updatedAt: campaignData?.updatedAt?.toDate?.() || new Date(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Get campaign error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch campaign";
    console.error("[API] Error details:", { errorMessage, error });
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
