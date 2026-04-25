import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
dotenv.config();

const client = new ImapFlow({
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT || '993'),
  secure: true,
  auth: { user: process.env.IMAP_USER, pass: process.env.IMAP_PASSWORD },
  logger: false,
});

await client.connect();
const mailboxes = await client.list();
mailboxes.forEach(m => console.log(m.path));
await client.logout();
