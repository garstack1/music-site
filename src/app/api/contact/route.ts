import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email-service";

// Email address to receive contact form submissions
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "garstack@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Store the contact submission in the database
    const submission = await prisma.contactSubmission.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // Send email notification
    const subjectLabels: Record<string, string> = {
      general: "General Enquiry",
      feedback: "Feedback",
      partnership: "Partnership / Collaboration",
      press: "Press / Media",
      bug: "Bug Report",
      other: "Other",
    };

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #DC2626; border-bottom: 2px solid #DC2626; padding-bottom: 10px;">
          New Contact Form Submission
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">From:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">
              <a href="mailto:${email}" style="color: #DC2626;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${subjectLabels[subject] || subject}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px;">
          <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
          <div style="background: #f9f9f9; padding: 15px; border-left: 3px solid #DC2626; white-space: pre-wrap;">${message}</div>
        </div>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          Submission ID: ${submission.id}<br>
          Received: ${new Date().toLocaleString("en-IE", { dateStyle: "full", timeStyle: "short" })}
        </p>
      </div>
    `;

    const emailText = `
New Contact Form Submission
============================

From: ${name}
Email: ${email}
Subject: ${subjectLabels[subject] || subject}

Message:
${message}

---
Submission ID: ${submission.id}
Received: ${new Date().toLocaleString("en-IE")}
    `.trim();

    await sendEmail({
      to: CONTACT_EMAIL,
      subject: `[MusicSite Contact] ${subjectLabels[subject] || subject} - from ${name}`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Your message has been received" 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
