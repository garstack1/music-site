// Email Templates for MUSICSITE digest emails

interface Event {
  id: string;
  name: string;
  artist: string | null;
  venue: string | null;
  city: string | null;
  country: string;
  date: Date;
  imageUrl: string | null;
  ticketUrl: string | null;
  featured: boolean;
  subscriberOnly: boolean;
  presales?: {
    name: string;
    startDateTime: Date;
    endDateTime: Date;
  }[];
}

interface Competition {
  id: string;
  title: string;
  slug: string;
  prize: string;
  endDate: Date;
  imageUrl: string | null;
}

interface DigestContent {
  featuredEvents: Event[];
  presaleEvents: Event[];
  exclusiveEvents: Event[];
  competitions: Competition[];
}

interface DigestEmailOptions {
  recipientName: string | null;
  content: DigestContent;
  unsubscribeUrl: string;
  preferencesUrl: string;
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  siteUrl: string;
}

export function generateDigestEmail(options: DigestEmailOptions): { html: string; text: string; subject: string } {
  const {
    recipientName,
    content,
    unsubscribeUrl,
    preferencesUrl,
    frequency,
    siteUrl,
  } = options;

  const greeting = recipientName ? `Hi ${recipientName}` : "Hi there";
  const frequencyText = frequency === "DAILY" ? "daily" : frequency === "WEEKLY" ? "weekly" : "monthly";
  
  const totalItems =
    content.featuredEvents.length +
    content.presaleEvents.length +
    content.exclusiveEvents.length +
    content.competitions.length;

  const subject = totalItems > 0
    ? `Your ${frequencyText} music digest - ${totalItems} new updates`
    : `Your ${frequencyText} music digest`;

  const html = generateHtmlEmail(options, greeting);
  const text = generateTextEmail(options, greeting);

  return { html, text, subject };
}

function generateHtmlEmail(options: DigestEmailOptions, greeting: string): string {
  const { content, unsubscribeUrl, preferencesUrl, siteUrl } = options;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  let sectionsHtml = "";

  // Featured Events
  if (content.featuredEvents.length > 0) {
    sectionsHtml += `
      <tr>
        <td style="padding: 30px 40px 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #DC2626;">⭐ Featured Events</h2>
        </td>
      </tr>
      ${content.featuredEvents.map(event => `
        <tr>
          <td style="padding: 10px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; overflow: hidden;">
              <tr>
                ${event.imageUrl ? `
                  <td width="120" style="vertical-align: top;">
                    <img src="${event.imageUrl}" alt="${event.name}" width="120" height="80" style="display: block; object-fit: cover;">
                  </td>
                ` : ""}
                <td style="padding: 15px; vertical-align: top;">
                  <p style="margin: 0 0 5px; font-weight: 600; color: #111;">${event.name}</p>
                  ${event.artist ? `<p style="margin: 0 0 5px; font-size: 14px; color: #DC2626;">${event.artist}</p>` : ""}
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    ${formatDate(event.date)} • ${event.venue || event.city || event.country}
                  </p>
                  ${event.ticketUrl ? `
                    <a href="${event.ticketUrl}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #DC2626; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">Get Tickets</a>
                  ` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    `;
  }

  // Pre-sale Events
  if (content.presaleEvents.length > 0) {
    sectionsHtml += `
      <tr>
        <td style="padding: 30px 40px 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #DC2626;">🎟️ Pre-sale Alerts</h2>
          <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Get early access to tickets</p>
        </td>
      </tr>
      ${content.presaleEvents.map(event => `
        <tr>
          <td style="padding: 10px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef3c7; border-radius: 8px; border: 1px solid #fcd34d;">
              <tr>
                <td style="padding: 15px;">
                  <p style="margin: 0 0 5px; font-weight: 600; color: #111;">${event.name}</p>
                  <p style="margin: 0 0 8px; font-size: 13px; color: #666;">
                    ${formatDate(event.date)} • ${event.venue || event.city || event.country}
                  </p>
                  ${event.presales && event.presales.length > 0 ? `
                    <div style="background: white; padding: 10px; border-radius: 4px; margin-bottom: 10px;">
                      ${event.presales.map(presale => `
                        <p style="margin: 0; font-size: 12px; color: #666;">
                          <strong>${presale.name}</strong><br>
                          ${new Date(presale.startDateTime).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      `).join("")}
                    </div>
                  ` : ""}
                  ${event.ticketUrl ? `
                    <a href="${event.ticketUrl}" style="display: inline-block; padding: 8px 16px; background: #DC2626; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">View Pre-sale</a>
                  ` : ""}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    `;
  }

  // Exclusive Events
  if (content.exclusiveEvents.length > 0) {
    sectionsHtml += `
      <tr>
        <td style="padding: 30px 40px 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #DC2626;">🔒 Exclusive for Subscribers</h2>
        </td>
      </tr>
      ${content.exclusiveEvents.map(event => `
        <tr>
          <td style="padding: 10px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f3e8ff; border-radius: 8px; border: 1px solid #c084fc;">
              <tr>
                <td style="padding: 15px;">
                  <p style="margin: 0 0 5px; font-weight: 600; color: #111;">${event.name}</p>
                  ${event.artist ? `<p style="margin: 0 0 5px; font-size: 14px; color: #7c3aed;">${event.artist}</p>` : ""}
                  <p style="margin: 0; font-size: 13px; color: #666;">
                    ${formatDate(event.date)} • ${event.venue || event.city || event.country}
                  </p>
                  <a href="${siteUrl}/events/${event.id}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #7c3aed; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">View Details</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    `;
  }

  // Competitions
  if (content.competitions.length > 0) {
    sectionsHtml += `
      <tr>
        <td style="padding: 30px 40px 10px;">
          <h2 style="margin: 0; font-size: 20px; color: #DC2626;">🏆 Competitions</h2>
          <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Win tickets and prizes</p>
        </td>
      </tr>
      ${content.competitions.map(comp => `
        <tr>
          <td style="padding: 10px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background: #ecfdf5; border-radius: 8px; border: 1px solid #34d399;">
              <tr>
                ${comp.imageUrl ? `
                  <td width="100" style="vertical-align: top;">
                    <img src="${comp.imageUrl}" alt="${comp.title}" width="100" height="100" style="display: block; object-fit: cover; border-radius: 8px 0 0 8px;">
                  </td>
                ` : ""}
                <td style="padding: 15px;">
                  <p style="margin: 0 0 5px; font-weight: 600; color: #111;">${comp.title}</p>
                  <p style="margin: 0 0 8px; font-size: 14px; color: #059669;">Prize: ${comp.prize}</p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #666;">Ends: ${formatDate(comp.endDate)}</p>
                  <a href="${siteUrl}/competitions/${comp.slug}" style="display: inline-block; padding: 8px 16px; background: #059669; color: white; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 500;">Enter Now</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `).join("")}
    `;
  }

  // If no content
  if (!sectionsHtml) {
    sectionsHtml = `
      <tr>
        <td style="padding: 40px; text-align: center;">
          <p style="margin: 0; color: #666; font-size: 16px;">No new updates this time, but stay tuned!</p>
          <a href="${siteUrl}/events" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #DC2626; color: white; text-decoration: none; border-radius: 4px; font-weight: 500;">Browse All Events</a>
        </td>
      </tr>
    `;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Music Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background: #0D0D0D; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">MUSICSITE</h1>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 40px 10px;">
              <p style="margin: 0; font-size: 16px; color: #333;">${greeting},</p>
              <p style="margin: 10px 0 0; font-size: 16px; color: #666;">Here's what's happening in the music world.</p>
            </td>
          </tr>
          
          <!-- Content Sections -->
          ${sectionsHtml}
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px; font-size: 12px; color: #9ca3af; text-align: center;">
                You're receiving this because you subscribed to email updates.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="${preferencesUrl}" style="color: #DC2626; text-decoration: none;">Update preferences</a>
                &nbsp;•&nbsp;
                <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function generateTextEmail(options: DigestEmailOptions, greeting: string): string {
  const { content, unsubscribeUrl, preferencesUrl, siteUrl } = options;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-IE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  let sections = [];

  if (content.featuredEvents.length > 0) {
    sections.push("⭐ FEATURED EVENTS\n" + content.featuredEvents.map(e =>
      `• ${e.name}${e.artist ? ` - ${e.artist}` : ""}\n  ${formatDate(e.date)} | ${e.venue || e.city || e.country}\n  ${e.ticketUrl || `${siteUrl}/events/${e.id}`}`
    ).join("\n\n"));
  }

  if (content.presaleEvents.length > 0) {
    sections.push("🎟️ PRE-SALE ALERTS\n" + content.presaleEvents.map(e =>
      `• ${e.name}\n  ${formatDate(e.date)} | ${e.venue || e.city || e.country}\n  ${e.ticketUrl || `${siteUrl}/events/${e.id}`}`
    ).join("\n\n"));
  }

  if (content.exclusiveEvents.length > 0) {
    sections.push("🔒 EXCLUSIVE FOR SUBSCRIBERS\n" + content.exclusiveEvents.map(e =>
      `• ${e.name}${e.artist ? ` - ${e.artist}` : ""}\n  ${formatDate(e.date)} | ${e.venue || e.city || e.country}\n  ${siteUrl}/events/${e.id}`
    ).join("\n\n"));
  }

  if (content.competitions.length > 0) {
    sections.push("🏆 COMPETITIONS\n" + content.competitions.map(c =>
      `• ${c.title}\n  Prize: ${c.prize}\n  Ends: ${formatDate(c.endDate)}\n  ${siteUrl}/competitions/${c.slug}`
    ).join("\n\n"));
  }

  if (sections.length === 0) {
    sections.push("No new updates this time, but stay tuned!\n\nBrowse all events: " + siteUrl + "/events");
  }

  return `
${greeting},

Here's what's happening in the music world.

${sections.join("\n\n---\n\n")}

---

Update preferences: ${preferencesUrl}
Unsubscribe: ${unsubscribeUrl}

MUSICSITE
  `.trim();
}
