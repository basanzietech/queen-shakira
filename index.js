// index.js

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const fs = require('fs');
const express = require('express');
const QRCode = require('qrcode'); // npm install qrcode
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// === Multi-User Session Manager ===
const sessions = new Map(); // number -> { sock, saveCreds, state }

function getUserAuthDir(number) {
  return path.join('auth_info', `user-${number}`);
}

async function createUserSession(number, sendQR) {
  const authDir = getUserAuthDir(number);
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    generateHighQualityLinkPreview: true,
    // Only print QR in terminal for main bot
  });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    if (update.qr && sendQR) {
      sendQR(update.qr);
    }
    if (update.connection === 'close') {
      sessions.delete(number);
    }
  });
  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]?.message) return;
    const msg = messages[0];
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    const messageContent = getMessageText(msg).trim();
    const lowerText = messageContent.toLowerCase();
    // Only allow the session owner to control their session
    if (jid.split('@')[0] !== number) return;
    if (lowerText === 'ping') {
      const start = Date.now();
      await sock.sendMessage(jid, { text: '💫 Pong!' });
      const latency = Date.now() - start;
      return await sock.sendMessage(jid, { text: `Ping Speed: ${latency} ms` });
    }
    if (lowerText === 'logout') {
      await sock.logout();
      sessions.delete(number);
      return sock.sendMessage(jid, { text: 'Logged out and session removed.' });
    }
    // Add more per-user commands here if needed
  });
  sessions.set(number, { sock, saveCreds, state });
}

// Basic landing page
app.get('/', (req, res) => {
  res.send('Hello World!👀 Queen Shakira is active now👸');
});

// Web route for pairing
app.get('/pair', async (req, res) => {
  const number = req.query.number;
  if (!number) {
    // Show form if no number provided
    return res.send(`
      <html>
        <head><title>Pair Your WhatsApp</title></head>
        <body>
          <h1>Pair Your WhatsApp with Queen Shakira</h1>
          <form method="GET" action="/pair">
            <label>Enter your number:</label>
            <input type="text" name="number" required />
            <button type="submit">Pair</button>
          </form>
        </body>
      </html>
    `);
  }
  // Build pairing URL
  const pairingUrl = `https://queen-shakira-d3790e790c70.herokuapp.com/pair?number=${encodeURIComponent(number)}&bot=Queen%20Shakira`;
  try {
    const qrDataUrl = await QRCode.toDataURL(pairingUrl);
    res.send(`
      <html>
        <head><title>Pair Your WhatsApp</title></head>
        <body>
          <h1>Pair Your WhatsApp with Queen Shakira</h1>
          <p>Scan the QR code below:</p>
          <img src="${qrDataUrl}" width="300" height="300" />
          <p>Or click: <a href="${pairingUrl}">${pairingUrl}</a></p>
        </body>
      </html>
    `);
  } catch (err) {
    res.send(`Error generating QR code: ${err}`);
  }
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// === Bot logic ===

const OWNER = '255657779003@s.whatsapp.net';
let autoTyping = false;
let autoRecording = false;
let alwaysOnline = false;
let autoStatusSeen = true;
let autoStatusReact = true;
let antiWorldValues = [];

const allowedGroups = [
  '120363365676830775@g.us'
];

function getMessageText(msg) {
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text)
    return msg.message.extendedTextMessage.text;
  if (msg.message.imageMessage?.caption)
    return msg.message.imageMessage.caption;
  if (msg.message.videoMessage?.caption)
    return msg.message.videoMessage.caption;
  return '';
}

function getHelpText() {
  return {
    image: { url: "https://files.catbox.moe/2rf7lh.jpg" },
    channel: { url: "https://whatsapp.com/channel/0029VaJX1NzCxoAyVGHlfY2l" },
    caption: `> *Queen Shakira Commands:*

Owner Commands (only for owner):
• auto typing on/off
• auto recording on/off
• always online on/off
• auto status seen on/off
• auto status react on/off
• set antiworld word1,word2
• getgroupid
• addgroup group_id

User Commands:
• pair <your_number>
• ping
• .menu or .help

Group Management:
• Anti-link
• Anti-sticker
• Antiviewonce
• Antiworld

> Follow Whatsapp Channel:
www.whatsapp.com/channel/0029VaJX1NzCxoAyVGHlfY2l

> Script:
www.github.com/basanzietech/queen-shakira

> *@basanzietech | queen shakira*`
  };
}

async function sendFancyMenu(sock, jid) {
  const sections = [
    {
      title: "MENU 🌺",
      rows: [
        { title: "YouTube 🌹", rowId: "id-youtube", description: "Visit YouTube channel" },
        { title: "Telegram 💧", rowId: "id-telegram", description: "Open Telegram link" },
        { title: "GitHub 🔵",  rowId: "id-github",  description: "Open GitHub link"  },
        { title: "WhatsApp 🍀", rowId: "id-whatsapp", description: "Join WhatsApp link" },
        { title: "Owner 👤",    rowId: "id-owner",    description: "Contact Owner"    },
        { title: "Script 📄",   rowId: "id-script",   description: "Get script link" }
      ]
    }
  ];
  await sock.sendMessage(jid, {
    title: "Queen Shakira Bot Menu",
    text: "Select an option below:",
    footer: "Powered by Queen Shakira Bot",
    buttonText: "MENU",
    sections
  });
}

async function simulatePresence(sock, jid) {
  if (autoTyping) {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise(r => setTimeout(r, 2000));
  }
  if (autoRecording) {
    await sock.sendPresenceUpdate('recording', jid);
    await new Promise(r => setTimeout(r, 2000));
  }
  if (alwaysOnline) {
    await sock.sendPresenceUpdate('available', jid);
  }
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    if (!messages || !messages[0]?.message) return;
    const msg = messages[0];
    const jid = msg.key.remoteJid;
    const sender = msg.key.participant || jid;
    const messageContent = getMessageText(msg).trim();
    const lowerText = messageContent.toLowerCase();

    // Basic commands in any group
    const basicCommands = ['ping', 'getgroupid', '.menu', '.help'];
    if (jid.endsWith('@g.us') && basicCommands.includes(lowerText)) {
      if (lowerText === 'ping') {
        const start = Date.now();
        await sock.sendMessage(jid, { text: '💫 Pong!' });
        const latency = Date.now() - start;
        return await sock.sendMessage(jid, { text: `Ping Speed: ${latency} ms` });
      }
      if (lowerText === 'getgroupid') {
        const meta = await sock.groupMetadata(jid);
        return await sock.sendMessage(jid, { text: `Group ID: ${meta.id}` });
      }
      if (lowerText === '.menu' || lowerText === '.help') {
        const helpData = getHelpText();
        return await sock.sendMessage(
          jid,
          {
            image: helpData.image,
            caption: helpData.caption,
            channel: helpData.channel
          },
          {
            contextInfo: {
              isForwarded: true,
              forwardingScore: 999,
              forwardedNewsletterMessageInfo: {
                newsletterJid: '120363230794474148@newsletter',
                newsletterName: global.author || 'Queen Shakira',
                serverMessageId: -1
              }
            }
          }
        );
      }
    }

    // If group not allowed, ignore everything else
    if (jid.endsWith('@g.us') && !allowedGroups.includes(jid)) return;

    // ANTI-LINK
    if (jid.endsWith('@g.us')) {
      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      if (linkRegex.test(lowerText)) {
        const meta = await sock.groupMetadata(jid);
        const isAdmin = meta.participants.some(p => p.admin && p.id === sender);
        if (!isAdmin) {
          await sock.sendMessage(jid, { delete: msg.key });
          return sock.sendMessage(jid, {
            text: `@${sender.split('@')[0]} Links are not allowed!`,
            mentions: [sender]
          });
        }
      }
    }

    // ANTISTICKER
    if (msg.message.stickerMessage) {
      await sock.sendMessage(jid, { delete: msg.key });
      return sock.sendMessage(jid, {
        text: `@${sender.split('@')[0]} Stickers are not allowed!`,
        mentions: [sender]
      });
    }

    // ANTIVIEWONCE
    if (msg.message.viewOnceMessage) {
      const inner = msg.message.viewOnceMessage.message;
      if (inner.imageMessage || inner.videoMessage || inner.audioMessage || inner.documentMessage) {
        return sock.copyNForward(OWNER, msg, true);
      }
      const text = getMessageText({ message: inner });
      return sock.sendMessage(OWNER, { text: `Antiviewonce: ${text || JSON.stringify(inner)}` });
    }

    // ANTIWORLD
    if (antiWorldValues.length && jid !== OWNER) {
      for (let w of antiWorldValues) {
        if (lowerText.includes(w.toLowerCase())) {
          await sock.sendMessage(jid, { delete: msg.key });
          return sock.sendMessage(jid, {
            text: `@${sender.split('@')[0]} Banned word detected!`,
            mentions: [sender]
          });
        }
      }
    }

    // STATUS HANDLING
    if (jid === 'status@broadcast') {
      if (autoStatusSeen)  await sock.readMessages([msg.key]);
      if (autoStatusReact) await sock.sendMessage(jid, { react: { text: '🔥', key: msg.key } });
      if (lowerText.includes('@g.us')) {
        await sock.sendMessage(jid, { delete: msg.key });
        await sock.sendMessage(jid, { text: `Strong Warning: Don't mention groups in status!` });
      }
      return;
    }

    // OWNER COMMANDS (in 1:1 chat)
    if (jid === OWNER) {
      switch (lowerText) {
        case 'auto typing on':     autoTyping = true;      return sock.sendMessage(jid, { text: 'Auto typing ✅' });
        case 'auto typing off':    autoTyping = false;     return sock.sendMessage(jid, { text: 'Auto typing ❌' });
        case 'auto recording on':  autoRecording = true;   return sock.sendMessage(jid, { text: 'Auto recording ✅' });
        case 'auto recording off': autoRecording = false;  return sock.sendMessage(jid, { text: 'Auto recording ❌' });
        case 'always online on':   alwaysOnline = true;    return sock.sendMessage(jid, { text: 'Always online ✅' });
        case 'always online off':  alwaysOnline = false;   return sock.sendMessage(jid, { text: 'Always online ❌' });
        case 'auto status seen on':  autoStatusSeen = true;  return sock.sendMessage(jid, { text: 'Auto status seen ✅' });
        case 'auto status seen off': autoStatusSeen = false; return sock.sendMessage(jid, { text: 'Auto status seen ❌' });
        case 'auto status react on':  autoStatusReact = true;  return sock.sendMessage(jid, { text: 'Auto status react ✅' });
        case 'auto status react off': autoStatusReact = false; return sock.sendMessage(jid, { text: 'Auto status react ❌' });
        case 'getgroupid':
          if (!jid.endsWith('@g.us')) return sock.sendMessage(jid, { text: 'This is not a group!' });
          const gm = await sock.groupMetadata(jid);
          return sock.sendMessage(jid, { text: `Group ID: ${gm.id}` });
      }
      if (lowerText.startsWith('set antiworld ')) {
        antiWorldValues = lowerText.slice(13).split(',').map(s => s.trim());
        return sock.sendMessage(jid, { text: `Antiworld set: ${antiWorldValues.join(', ')}` });
      }
      if (lowerText.startsWith('addgroup ')) {
        const g = lowerText.slice(9).trim();
        if (!g.endsWith('@g.us')) return sock.sendMessage(jid, { text: 'Invalid group ID.' });
        if (!allowedGroups.includes(g)) {
          allowedGroups.push(g);
          return sock.sendMessage(jid, { text: `Added ${g} to allowedGroups.` });
        }
        return sock.sendMessage(jid, { text: `${g} is already allowed.` });
      }
    }

    // USER COMMANDS
    if (lowerText.startsWith('pair ')) {
      const parts = messageContent.split(' ');
      if (parts.length === 2) {
        const num = parts[1].replace(/[^0-9]/g, '');
        if (!num) return sock.sendMessage(jid, { text: 'Invalid number.' });
        if (sessions.has(num)) {
          return sock.sendMessage(jid, { text: 'Session already exists for this number. Send "logout" from your paired WhatsApp to remove.' });
        }
        // Create a new session and send QR code as image
        await createUserSession(num, async (qr) => {
          try {
            const qrImg = await QRCode.toBuffer(qr);
            await sock.sendMessage(jid, { image: qrImg, caption: `Scan this QR code with WhatsApp (${num}) to pair your session.` });
          } catch (e) {
            await sock.sendMessage(jid, { text: 'Error generating QR code.' });
          }
        });
        return sock.sendMessage(jid, { text: `Session setup started for ${num}. Scan the QR code sent above.` });
      }
      return sock.sendMessage(jid, { text: 'Use: pair <your_number>' });
    }

    // Presence simulation on every other message
    simulatePresence(sock, jid);
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Connected');
    }
  });
}

startBot().catch(err => console.log("Unexpected error:", err));
