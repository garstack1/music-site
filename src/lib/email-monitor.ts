import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/db";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function extractContent(text: string, startMarker: string, endMarker: string): string {
  let content = text;
  if (startMarker && startMarker.trim()) {
    const startIdx = content.indexOf(startMarker);
    if (startIdx !== -1) {
      content = content.substring(startIdx + startMarker.length);
    }
  }
  if (endMarker && endMarker.trim()) {
    const endIdx = content.indexOf(endMarker);
    if (endIdx !== -1) {
      content = content.substring(0, endIdx);
    }
  }
  return content.trim();
}

function extractTitle(content: string): string {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    const cleaned = line.replace(/[^a-zA-Z\s']/g, "").trim();
    if (cleaned.length > 5 && cleaned.length < 100 && cleaned === cleaned.toUpperCase()) {
      return line.replace(/\*+/g, "").trim();
    }
  }
  for (const line of lines) {
    if (line.length > 10 && !line.startsWith("Photo") && !line.startsWith("http")) {
      return line.slice(0, 150);
    }
  }
  return "Untitled Press Release";
}

function extractSummary(content: string): string {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length > 80 && line !== line.toUpperCase() && !line.startsWith("http") && !line.startsWith("Watch") && !line.startsWith("Photo")) {
      const sentences = line.match(/[^.!?]+[.!?]+/g);
      if (sentences && sentences.length >= 2) {
        return sentences.slice(0, 2).join("").trim();
      }
      return line.slice(0, 300);
    }
  }
  return content.slice(0, 300);
}

function extractImages(text: string): string[] {
  const images: string[] = [];
  const imgRegex = /https?:\/\/[^\s<>"]+\.(jpg|jpeg|png|gif|webp)(\?[^\s<>"]*)?/gi;
  let match;
  while ((match = imgRegex.exec(text)) !== null) {
    if (!images.includes(match[0])) images.push(match[0]);
  }
  return images;
}

function extractVideos(text: string): string[] {
  const videos: string[] = [];
  const ytRegex = /https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[^\s<>"]+/gi;
  let match;
  while ((match = ytRegex.exec(text)) !== null) {
    if (!videos.includes(match[0])) videos.push(match[0]);
  }
  const vimeoRegex = /https?:\/\/(www\.)?vimeo\.com\/[^\s<>"]+/gi;
  while ((match = vimeoRegex.exec(text)) !== null) {
    if (!videos.includes(match[0])) videos.push(match[0]);
  }
  return videos;
}

function decodeHtmlEntities(str: string): string {
  // HTML entity map for common special characters
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&apos;": "'",
    "&rsquo;": "\u2019",
    "&lsquo;": "\u2018",
    "&rdquo;": "\u201D",
    "&ldquo;": "\u201C",
    "&mdash;": "\u2014",
    "&ndash;": "\u2013",
    "&hellip;": "\u2026",
    "&bull;": "•",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
  };

  let decoded = str;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  // Handle numeric entities
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  decoded = decoded.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));

  return decoded;
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201C")
    .replace(/&ldquo;/g, "\u201D")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export interface EmailImportResult {
  processed: number;
  imported: number;
  skipped: number;
  alreadyProcessed: number;
  errors: string[];
  articles: string[];
}

export async function checkEmails(): Promise<EmailImportResult> {
  const result: EmailImportResult = {
    processed: 0,
    imported: 0,
    skipped: 0,
    alreadyProcessed: 0,
    errors: [],
    articles: [],
  };

  const host = process.env.IMAP_HOST;
  const port = parseInt(process.env.IMAP_PORT || "993");
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASSWORD;

  if (!host || !user || !pass) {
    result.errors.push("IMAP credentials not configured");
    return result;
  }

  const approvedSenders = await prisma.approvedSender.findMany({
    where: { active: true },
  });

  if (approvedSenders.length === 0) {
    result.errors.push("No approved senders configured");
    return result;
  }

  let client: ImapFlow | null = null;

  try {
    client = new ImapFlow({
      host,
      port,
      secure: true,
      auth: { user, pass },
      logger: false,
    });

    await client.connect();

    // Collect all labels to check
    const labelsToCheck = new Set<string>();
    labelsToCheck.add("INBOX");
    for (const sender of approvedSenders) {
      if (sender.gmailLabel && sender.gmailLabel.trim()) {
        labelsToCheck.add(sender.gmailLabel.trim());
      }
    }

    for (const mailbox of labelsToCheck) {
      let lock;
      try {
        lock = await client.getMailboxLock(mailbox);
      } catch {
        result.errors.push(`Could not open mailbox: ${mailbox}`);
        continue;
      }

      try {
        // Fetch ALL messages, not just unseen
        const status = await client.status(mailbox, { messages: true });
        if (status.messages === 0) { lock.release(); continue; }

        const messages = client.fetch("1:*", { envelope: true, source: true });

        for await (const msg of messages) {
          result.processed++;

          try {
            const from = msg.envelope?.from?.[0]?.address?.toLowerCase();
            if (!from) { result.skipped++; continue; }

            // Check if sender is approved
            const sender = approvedSenders.find((s) => {
              const sEmail = s.email.toLowerCase();
              return from === sEmail || from.endsWith("@" + sEmail.split("@")[1]);
            });

            if (!sender) { result.skipped++; continue; }

            // If sender has a specific label, only process from that label
            if (sender.gmailLabel && sender.gmailLabel.trim()) {
              if (mailbox !== sender.gmailLabel.trim()) {
                result.skipped++;
                continue;
              }
            } else {
              // Sender has no label, only process from INBOX
              if (mailbox !== "INBOX") { result.skipped++; continue; }
            }

            // Create a unique message ID
            const msgId = msg.envelope?.messageId || `${from}-${msg.envelope?.date?.toISOString() || ""}-${msg.uid}`;

            // Check if already processed
            const alreadyDone = await prisma.processedEmail.findUnique({
              where: { messageId: msgId },
            });

            if (alreadyDone) {
              result.alreadyProcessed++;
              continue;
            }

            // Get email body
            const source = msg.source?.toString() || "";
            let bodyText = "";

            // Check for charset encoding
            const charsetMatch = source.match(/Content-Type: (?:text\/html|text\/plain)[\s\S]*?charset="?([^"\s;]+)"?/i);
            const charset = charsetMatch ? charsetMatch[1].toUpperCase() : "UTF-8";

            const textMatch = source.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\.\r\n|$)/i);
            const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--|\r\n\.\r\n|$)/i);

            if (textMatch) {
              bodyText = textMatch[1];
              // Handle quoted-printable encoding
              bodyText = bodyText.replace(/=\r\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
              // Decode HTML entities
              bodyText = decodeHtmlEntities(bodyText);
            } else if (htmlMatch) {
              let htmlContent = htmlMatch[1];
              // Handle quoted-printable encoding in HTML
              htmlContent = htmlContent.replace(/=\r\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
              bodyText = stripHtml(htmlContent);
            } else {
              const headerEnd = source.indexOf("\r\n\r\n");
              if (headerEnd !== -1) {
                bodyText = stripHtml(source.substring(headerEnd + 4));
              }
            }

            if (!bodyText || bodyText.length < 20) {
              result.errors.push(`Empty email from ${from}: "${msg.envelope?.subject}"`);
              // Still mark as processed so we don't retry
              await prisma.processedEmail.create({
                data: { messageId: msgId, sender: from, subject: msg.envelope?.subject },
              });
              continue;
            }

            // Extract content using sender's markers
            const content = extractContent(bodyText, sender.startMarker || "", sender.endMarker || "");

            if (!content || content.length < 20) {
              result.errors.push(`Could not extract content from ${from}: "${msg.envelope?.subject}"`);
              await prisma.processedEmail.create({
                data: { messageId: msgId, sender: from, subject: msg.envelope?.subject },
              });
              continue;
            }

            const title = extractTitle(content);
            const summary = extractSummary(content);
            const images = extractImages(bodyText);
            const videos = extractVideos(bodyText);
            const featuredImage = images.length > 0 ? images[0] : null;

            let body = content;
            if (videos.length > 0) {
              body += "\n\n---\n\n";
              videos.forEach((url) => {
                const platform = url.includes("vimeo") ? "Vimeo" : "YouTube";
                body += `Watch on ${platform}: ${url}\n`;
              });
            }

            let slug = slugify(title);
            const existingSlug = await prisma.newsArticle.findUnique({ where: { slug } });
            if (existingSlug) {
              slug = `${slug}-${Date.now().toString(36)}`;
            }

            const sourceUrl = `email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            await prisma.newsArticle.create({
              data: {
                title,
                slug,
                summary,
                body,
                sourceUrl,
                imageUrl: featuredImage,
                featured: false,
                hidden: !sender.autoPublish,
                manual: true,
                publishedAt: new Date(),
              },
            });

            // Mark as processed
            await prisma.processedEmail.create({
              data: { messageId: msgId, sender: from, subject: msg.envelope?.subject },
            });

            result.imported++;
            result.articles.push(title);

          } catch (msgError) {
            result.errors.push(msgError instanceof Error ? msgError.message : "Unknown error");
          }
        }
      } finally {
        lock.release();
      }
    }

    await client.logout();
  } catch (connError) {
    result.errors.push(connError instanceof Error ? connError.message : "Connection error");
    if (client) {
      try { await client.logout(); } catch {}
    }
  }

  return result;
}
