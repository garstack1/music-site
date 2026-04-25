import { ImapFlow } from "imapflow";
import { prisma } from "@/lib/db";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function decodeQuotedPrintable(str: string, charset = "UTF-8"): string {
  // Remove soft line breaks
  let decoded = str.replace(/=\r\n/g, "").replace(/=\n/g, "");
  
  // Collect all QP-encoded bytes and decode as proper UTF-8
  decoded = decoded.replace(/(=[0-9A-F]{2})+/gi, (match) => {
    const bytes = match.split("=").filter(Boolean).map(h => parseInt(h, 16));
    try {
      return Buffer.from(bytes).toString("utf8");
    } catch {
      return match;
    }
  });
  
  return decoded;
}

function decodeHtmlEntities(str: string): string {
  const entities: Record<string, string> = {
    "&nbsp;": " ", "&amp;": "&", "&lt;": "<", "&gt;": ">",
    "&quot;": '"', "&apos;": "'", "&rsquo;": "'", "&lsquo;": "'",
    "&rdquo;": '"', "&ldquo;": '"', "&mdash;": "—", "&ndash;": "–",
    "&hellip;": "...", "&bull;": "•", "&copy;": "©", "&reg;": "®", "&trade;": "™",
  };
  let decoded = str;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "gi"), char);
  }
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  decoded = decoded.replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  return decoded;
}

function isTrackingPixel(src: string, width?: string, height?: string): boolean {
  if (src.startsWith("data:")) return true;
  if ((width === "1" || width === "0") && (height === "1" || height === "0")) return true;
  const trackingDomains = ["track.", "pixel.", "open.", "click.", "analytics.", "beacon."];
  try {
    const url = new URL(src);
    if (trackingDomains.some((d) => url.hostname.startsWith(d))) return true;
  } catch { return false; }
  return false;
}

function youtubeIdFromUrl(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtu\.be\/([^?\s]+)/,
    /youtube\.com\/embed\/([^?\s]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function vimeoIdFromUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

function cleanHtmlEmail(html: string): { body: string; featuredImage: string | null } {
  let content = html;

  content = decodeQuotedPrintable(content);
  content = decodeHtmlEntities(content);

  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) content = bodyMatch[1];

  content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<!--[\s\S]*?-->/g, "");

  const footerPatterns = [
    /unsubscribe[\s\S]{0,500}$/i,
    /to stop receiving[\s\S]{0,500}$/i,
    /you are receiving this[\s\S]{0,500}$/i,
    /this email was sent[\s\S]{0,500}$/i,
    /manage your preferences[\s\S]{0,500}$/i,
    /view this email in your browser[\s\S]{0,200}/i,
    /view in browser[\s\S]{0,200}/i,
    /click here to unsubscribe[\s\S]{0,300}/i,
  ];
  for (const pattern of footerPatterns) {
    content = content.replace(pattern, "");
  }
  // Collapse deeply nested empty divs (common in Apple Mail HTML)
  for (let i = 0; i < 10; i++) {
    content = content.replace(/<div>(\s*<div>\s*<\/div>\s*)*<\/div>/gi, "");
  }


  // Collapse deeply nested divs
  let prev = "";
  while (prev !== content) {
    prev = content;
    content = content.replace(/<div>\s*(<div>[\s\S]*?<\/div>)\s*<\/div>/gi, "$1");
    content = content.replace(/<div>\s*<br>\s*<\/div>/gi, "<br>");
    content = content.replace(/<div>\s*<\/div>/gi, "");
  }

  // Remove repeated br tags
  content = content.replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>");

  let featuredImage: string | null = null;
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(content)) !== null) {
    const src = imgMatch[1];
    const widthMatch = imgMatch[0].match(/width=["']?(\d+)["']?/i);
    const heightMatch = imgMatch[0].match(/height=["']?(\d+)["']?/i);
    if (!isTrackingPixel(src, widthMatch?.[1], heightMatch?.[1]) && src.startsWith("http")) {
      featuredImage = src;
      break;
    }
  }

// Remove cid: images (embedded MIME attachments - can't display in browser)
  content = content.replace(/<img[^>]+src=["']cid:[^"']+["'][^>]*>/gi, "");

  // Clean remaining images
  content = content.replace(/<img[^>]+>/gi, (match) => {
    const srcMatch = match.match(/src=["']([^"']+)["']/i);
    if (!srcMatch) return "";
    const src = srcMatch[1];
    if (src.startsWith("cid:")) return "";
    if (src.startsWith("data:")) return "";
    const widthMatch = match.match(/width=["']?(\d+)["']?/i);
    const heightMatch = match.match(/height=["']?(\d+)["']?/i);
    if (isTrackingPixel(src, widthMatch?.[1], heightMatch?.[1])) return "";
    return `<img src="${src}" alt="" style="max-width:100%;height:auto;" />`;
  });

  // Strip all inline styles (keep tags, remove style attributes)
  content = content.replace(/\s+style=["'][^"']*["']/gi, "");

  // Strip font tags
  content = content.replace(/<font[^>]*>/gi, "").replace(/<\/font>/gi, "");

  // Strip class and id attributes
  content = content.replace(/\s+class=["'][^"']*["']/gi, "");
  content = content.replace(/\s+id=["'][^"']*["']/gi, "");
  content = content.replace(/\s+dir=["'][^"']*["']/gi, "");

// Fix mangled UTF-8 smart quotes and special characters
  content = content
    .replace(/\u00e2\u0080\u0099/g, "'")   // '
    .replace(/\u00e2\u0080\u009c/g, '"')   // "
    .replace(/\u00e2\u0080\u009d/g, '"')   // "
    .replace(/\u00e2\u0080\u0093/g, "–")   // –
    .replace(/\u00e2\u0080\u0094/g, "—")   // —
    .replace(/\u00e2\u0080\u00a6/g, "...")  // …
    .replace(/â\u0080\u0099/g, "'")
    .replace(/â\u0080\u009c/g, '"')
    .replace(/â\u0080\u009d/g, '"')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€\u009d/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–")
    .replace(/â€¦/g, "...")
    .replace(/â/g, "'");  // catch remaining â characters

  // Remove excessive empty divs and br chains
  content = content
    .replace(/(<div>\s*<br>\s*<\/div>){2,}/gi, "<br>")
    .replace(/(<br>\s*){3,}/gi, "<br><br>")
    .replace(/(<div>\s*<\/div>){2,}/gi, "")
    .replace(/<div>\s*<br>\s*<\/div>/gi, "<br>")
    .trim();

// Convert YouTube links — handle both plain URLs and <a href="..."> links
  // First handle <a href="youtube-url">text</a> — replace entire anchor with iframe
  content = content.replace(
    /<a[^>]+href=["'](https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^"']+)["'][^>]*>[\s\S]*?<\/a>/gi,
    (match, url) => {
      const id = youtubeIdFromUrl(url);
      if (!id) return match;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;">
        <iframe src="https://www.youtube.com/embed/${id}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allowfullscreen loading="lazy"></iframe>
      </div>`;
    }
  );

  // Then handle plain YouTube URLs in text
  content = content.replace(
    /(?<!href=["'])https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[^\s<>"&]+/gi,
    (url) => {
      const id = youtubeIdFromUrl(url);
      if (!id) return url;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;">
        <iframe src="https://www.youtube.com/embed/${id}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allowfullscreen loading="lazy"></iframe>
      </div>`;
    }
  );

  // Convert Vimeo links
  content = content.replace(
    /<a[^>]+href=["'](https?:\/\/(?:www\.)?vimeo\.com\/\d+[^"']*)["'][^>]*>[\s\S]*?<\/a>/gi,
    (match, url) => {
      const id = vimeoIdFromUrl(url);
      if (!id) return match;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;">
        <iframe src="https://player.vimeo.com/video/${id}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allowfullscreen loading="lazy"></iframe>
      </div>`;
    }
  );

  content = content.replace(
    /(?<!href=["'])https?:\/\/(www\.)?vimeo\.com\/\d+[^\s<>"&]*/gi,
    (url) => {
      const id = vimeoIdFromUrl(url);
      if (!id) return url;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;">
        <iframe src="https://player.vimeo.com/video/${id}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allowfullscreen loading="lazy"></iframe>
      </div>`;
    }
  );

  content = content.replace(
    /https?:\/\/(www\.)?vimeo\.com\/\d+[^\s<>"&]*/gi,
    (url) => {
      const id = vimeoIdFromUrl(url);
      if (!id) return url;
      return `<div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;margin:1em 0;">
        <iframe src="https://player.vimeo.com/video/${id}"
          style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"
          allowfullscreen loading="lazy"></iframe>
      </div>`;
    }
  );

  content = content.replace(/<a([^>]*)href=["']([^"']+)["']([^>]*)>/gi, (_, _before, href) => {
    if (/unsubscribe|optout|opt-out|track\./i.test(href)) return "";
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">`;
  });

  content = content
    .replace(/\n{3,}/g, "\n\n")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br><br>")
    .replace(/(<p>\s*<\/p>)/gi, "")
    .trim();

    // Final smart quote cleanup — catch any remaining encoding artifacts
  content = content
    .replace(/â€™/g, "'")
    .replace(/â€˜/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"')
    .replace(/â€"/g, "—")
    .replace(/â€"/g, "–")
    .replace(/â€¦/g, "…")
    .replace(/Â·/g, "·")
    .replace(/Â/g, "")
    // Catch the specific pattern: â followed by a control char followed by a char
    .replace(/â[\u0080-\u00ff][\u0080-\u00ff]/g, (match) => {
      const bytes = [match.charCodeAt(0), match.charCodeAt(1), match.charCodeAt(2)];
      try {
        return Buffer.from(bytes).toString("utf8");
      } catch {
        return "'";
      }
    });
    
  return { body: content, featuredImage };
}

function extractSummaryFromHtml(html: string): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 40 && trimmed.length < 400) {
      const twoSentences = sentences.slice(0, 2).join("").trim();
      return twoSentences.length < 400 ? twoSentences : trimmed;
    }
  }
  return text.slice(0, 300);
}

function extractHtmlFromSource(source: string): string | null {
  const parts = source.split(/--[^\r\n]+\r\n/);
  for (const part of parts) {
    if (/Content-Type:\s*text\/html/i.test(part)) {
      const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);
      const isBase64 = /Content-Transfer-Encoding:\s*base64/i.test(part);
      const bodyStart = part.indexOf("\r\n\r\n");
      if (bodyStart === -1) continue;
      let body = part.substring(bodyStart + 4);
      if (isQP) {
        body = decodeQuotedPrintable(body);
      } else if (isBase64) {
        try {
          body = Buffer.from(body.replace(/\r\n/g, ""), "base64").toString("utf8");
        } catch { continue; }
      }
      return body;
    }
  }
  const htmlMatch = source.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?=\r\n--[^\r\n]+|\r\n\.\r\n|$)/i);
  if (htmlMatch) return decodeQuotedPrintable(htmlMatch[1]);
  return null;
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
  const gmailLabel = process.env.PR_IMPORT_LABEL || "PR-Import";
  const autoPublish = process.env.PR_AUTO_PUBLISH === "true";

  if (!host || !user || !pass) {
    result.errors.push("IMAP credentials not configured");
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

    let lock;
    try {
      lock = await client.getMailboxLock(gmailLabel);
    } catch {
      result.errors.push(`Could not open Gmail label: "${gmailLabel}". Make sure this label exists in Gmail.`);
      await client.logout();
      return result;
    }

    try {
      const status = await client.status(gmailLabel, { messages: true });

      if (status.messages === 0) {
        return result;
      }

      // Fetch emails
      const messages = client.fetch(
        "1:*",
        { envelope: true, source: true }
      );

      for await (const msg of messages) {
        result.processed++;

        try {
          const msgId = msg.envelope?.messageId ||
            `${msg.envelope?.from?.[0]?.address}-${msg.envelope?.date?.toISOString()}-${msg.uid}`;

          // Skip if already processed
          const alreadyDone = await prisma.processedEmail.findUnique({
            where: { messageId: msgId },
          });
          if (alreadyDone) {
            result.alreadyProcessed++;
            continue;
          }

          const source = msg.source?.toString() || "";
          const htmlBody = extractHtmlFromSource(source);

          if (!htmlBody || htmlBody.length < 20) {
            result.errors.push(`No HTML body: "${msg.envelope?.subject}"`);
            await prisma.processedEmail.create({
              data: {
                messageId: msgId,
                sender: msg.envelope?.from?.[0]?.address || "unknown",
                subject: msg.envelope?.subject,
              },
            });
            continue;
          }

          const { body, featuredImage } = cleanHtmlEmail(htmlBody);

          if (!body || body.length < 20) {
            result.errors.push(`Empty after cleaning: "${msg.envelope?.subject}"`);
            await prisma.processedEmail.create({
              data: {
                messageId: msgId,
                sender: msg.envelope?.from?.[0]?.address || "unknown",
                subject: msg.envelope?.subject,
              },
            });
            continue;
          }

          let title = msg.envelope?.subject || "Untitled";
          title = decodeHtmlEntities(title);
          title = title.replace(/^(re|fwd|fw):\s*/gi, "").trim();

          const summary = extractSummaryFromHtml(body);
          const from = msg.envelope?.from?.[0]?.address || "unknown";
          const fromName = msg.envelope?.from?.[0]?.name || from;

          let slug = slugify(title);
          const existingSlug = await prisma.newsArticle.findUnique({ where: { slug } });
          if (existingSlug) slug = `${slug}-${Date.now().toString(36)}`;

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
              hidden: !autoPublish,
              manual: true,
              sourceLabel: `${fromName} (PR)`,
              publishedAt: new Date(),
            },
          });

          await prisma.processedEmail.create({
            data: {
              messageId: msgId,
              sender: from,
              subject: msg.envelope?.subject,
            },
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

    await client.logout();
  } catch (connError) {
    result.errors.push(connError instanceof Error ? connError.message : "Connection error");
    if (client) { try { await client.logout(); } catch {} }
  }

  return result;
}
