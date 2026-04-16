// Email Service Abstraction
// This file provides a simple interface for sending emails
// You can swap out the provider by changing the implementation

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Get the configured email provider
function getProvider(): string {
  return process.env.EMAIL_PROVIDER || "console";
}

// Send email using configured provider
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const provider = getProvider();

  switch (provider) {
    case "resend":
      return sendViaResend(options);
    case "brevo":
      return sendViaBrevo(options);
    case "sendgrid":
      return sendViaSendGrid(options);
    case "ses":
      return sendViaSES(options);
    case "console":
    default:
      return sendViaConsole(options);
  }
}

// Console provider (for development/testing)
async function sendViaConsole(options: EmailOptions): Promise<EmailResult> {
  console.log("=".repeat(60));
  console.log("📧 EMAIL (Console Provider - Development Mode)");
  console.log("=".repeat(60));
  console.log(`To: ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log("-".repeat(60));
  console.log(options.text || "HTML email - see html field");
  console.log("=".repeat(60));
  
  return { success: true, messageId: `console-${Date.now()}` };
}

// Resend provider
async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.EMAIL_FROM || "MUSICSITE <noreply@yourdomain.com>";
  
  console.log("📧 Resend: Attempting to send email");
  console.log("📧 Resend: API Key exists:", !!apiKey);
  console.log("📧 Resend: From:", fromEmail);
  console.log("📧 Resend: To:", options.to);
  
  if (!apiKey) {
    console.log("📧 Resend: ERROR - No API key");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    const data = await res.json();
    console.log("📧 Resend: Response status:", res.status);
    console.log("📧 Resend: Response data:", JSON.stringify(data));
    
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to send" };
    }

    return { success: true, messageId: data.id };
  } catch (error) {
    console.log("📧 Resend: ERROR -", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Brevo (Sendinblue) provider
async function sendViaBrevo(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "BREVO_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { 
          name: process.env.EMAIL_FROM_NAME || "MUSICSITE",
          email: process.env.EMAIL_FROM_ADDRESS || "noreply@yourdomain.com"
        },
        to: [{ email: options.to }],
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      return { success: false, error: data.message || "Failed to send" };
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// SendGrid provider
async function sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    return { success: false, error: "SENDGRID_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: process.env.EMAIL_FROM_ADDRESS || "noreply@yourdomain.com" },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text || "" },
          { type: "text/html", value: options.html },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { success: false, error: text || "Failed to send" };
    }

    return { success: true, messageId: res.headers.get("x-message-id") || undefined };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Amazon SES provider
async function sendViaSES(options: EmailOptions): Promise<EmailResult> {
  // SES requires AWS SDK - this is a placeholder
  // You would need to install @aws-sdk/client-ses
  console.log("SES provider not yet implemented - install @aws-sdk/client-ses");
  return { success: false, error: "SES provider not implemented" };
}

// Batch send emails (with rate limiting)
export async function sendBatchEmails(
  emails: EmailOptions[],
  delayMs: number = 100
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = { sent: 0, failed: 0, errors: [] as string[] };

  for (const email of emails) {
    const result = await sendEmail(email);
    
    if (result.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push(`${email.to}: ${result.error}`);
    }

    // Rate limiting delay
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}
