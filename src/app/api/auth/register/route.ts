import { NextRequest, NextResponse } from "next/server";
import { createSession, COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existing) {
      // If user exists with "pending" password (created via public review), upgrade them
      if (existing.passwordHash === "pending") {
        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.update({
          where: { id: existing.id },
          data: {
            passwordHash: hashed,
            name: name?.trim() || existing.name,
          },
        });

        const token = await createSession({
          userId: user.id,
          email: user.email,
          role: user.role,
        });

        const response = NextResponse.json({
          success: true,
          user: { email: user.email, name: user.name, role: user.role },
        });

        response.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });

        return response;
      }

      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        name: name?.trim() || null,
        passwordHash: hashed,
        role: "PUBLIC",
      },
    });

    const token = await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      { success: true, user: { email: user.email, name: user.name, role: user.role } },
      { status: 201 }
    );

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
