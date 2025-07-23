// routes/pair.js
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { createUserSession } = require('../bot/sessionManager');

router.get('/pair', async (req, res) => {
  const number = req.query.number;
  const method = req.query.method || 'code'; // default ni code
  if (!number) {
    return res.send(`
      <html>
        <head><title>Pair Your WhatsApp</title></head>
        <body>
          <h1>Pair Your WhatsApp with Queen Shakira</h1>
          <form method="GET" action="/pair">
            <label>Enter your number:</label>
            <input type="text" name="number" required />
            <br/>
            <label>Pairing Method:</label>
            <select name="method">
              <option value="code">Pairing Code</option>
              <option value="qr">QR Code</option>
            </select>
            <br/>
            <button type="submit">Pair</button>
          </form>
        </body>
      </html>
    `);
  }
  if (method === 'code') {
    await createUserSession(number, (code, err) => {
      if (err) {
        return res.send('Error generating pairing code: ' + err);
      }
      res.send(`
        <html>
          <head><title>Pairing Code</title></head>
          <body>
            <h1>Pairing Code for WhatsApp</h1>
            <p>Enter this code in WhatsApp (Settings > Linked Devices > Link a Device > Enter Code):</p>
            <h2>${code}</h2>
            <p>Number: ${number}</p>
          </body>
        </html>
      `);
    });
    return;
  }
  // QR code method
  // Instead of using a static link, generate QR from Baileys QR string
  let qrSent = false;
  await createUserSession(number, async (qr, err) => {
    if (qrSent) return; // prevent multiple responses
    qrSent = true;
    if (err) {
      return res.send('Error generating QR code: ' + err);
    }
    try {
      const qrDataUrl = await QRCode.toDataURL(qr);
      res.send(`
        <html>
          <head><title>Pair Your WhatsApp</title></head>
          <body>
            <h1>Pair Your WhatsApp with Queen Shakira</h1>
            <p>Scan the QR code below with your WhatsApp:</p>
            <img src="${qrDataUrl}" width="300" height="300" />
            <p>Number: ${number}</p>
          </body>
        </html>
      `);
    } catch (e) {
      res.send('Error rendering QR code: ' + e);
    }
  });
});

module.exports = router; 