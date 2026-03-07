import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";

interface ChannelConfig {
  text?: {
    enabled: boolean;
    wordLimit?: number;
  };
  voice?: {
    enabled: boolean;
    maxDurationSeconds?: number;
  };
  calls?: {
    enabled: boolean;
    maxCallDurationSeconds?: number;
  };
}

interface CreateCampaignPayload {
  title: string;
  description: string;
  channels: ChannelConfig;
  toneOfVoice?: "friendly" | "professional" | "energetic" | "formal" | "casual";
  wordLimit?: number;
  voiceDuration?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: CreateCampaignPayload = await request.json();

    const { title, description, channels, toneOfVoice, wordLimit } = body;

    if (!title || !description || !channels) {
      return NextResponse.json(
        { error: "Missing required fields: title, description, channels" },
        { status: 400 }
      );
    }

    console.log("📝 Creating campaign (step 1 - text only):", {
      title,
      channels,
    });

    // Create campaign document with text only
    const campaignRef = db
      .collection("users")
      .doc(userId)
      .collection("campaigns")
      .doc();

    await campaignRef.set({
      title,
      description,
      channels,
      toneOfVoice,
      wordLimit: wordLimit || 160,
      assets: [],
      contactsFile: null,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("✅ Campaign created:", campaignRef.id);

    return NextResponse.json({
      success: true,
      id: campaignRef.id,
    }, { status: 201 });
  } catch (error) {
    console.error("Campaign creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
