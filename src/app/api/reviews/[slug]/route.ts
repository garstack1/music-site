import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateReviewText, validateScore } from "@/lib/content-filter";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Check if public reviews are enabled
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "public_reviews_enabled" },
    });
    if (setting?.value !== "true") {
      return NextResponse.json(
        { error: "Public reviews are currently disabled" },
        { status: 403 }
      );
    }

    const { slug } = await params;
    const { score, text, name, email } = await request.json();

    // Validate score
    const scoreCheck = validateScore(score);
    if (!scoreCheck.valid) {
      return NextResponse.json({ error: scoreCheck.reason }, { status: 400 });
    }

    // Validate text
    const textCheck = validateReviewText(text);
    if (!textCheck.valid) {
      return NextResponse.json({ error: textCheck.reason }, { status: 400 });
    }

    // Find the review
    const review = await prisma.review.findUnique({
      where: { slug },
    });
    if (!review || review.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Find or create the user
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();
    let user = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name: name?.trim() || null,
          passwordHash: "pending",
          role: "PUBLIC",
        },
      });
    }

    // Check if user already reviewed this
    const existing = await prisma.publicReview.findUnique({
      where: {
        reviewId_userId: {
          reviewId: review.id,
          userId: user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already submitted a review" },
        { status: 409 }
      );
    }

    // Create the public review
    const publicReview = await prisma.publicReview.create({
      data: {
        reviewId: review.id,
        userId: user.id,
        score,
        text: text?.trim() || null,
        approved: true,
        flagged: false,
      },
    });

    return NextResponse.json({ review: publicReview }, { status: 201 });
  } catch (error) {
    console.error("Public review error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
