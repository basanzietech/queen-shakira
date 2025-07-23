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
        <head>
          <title>Pair Your WhatsApp</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; color: #222; margin: 0; padding: 0; }
            .container { max-width: 400px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 32px 24px; }
            h1 { color: #1c8c43; font-size: 1.5em; margin-bottom: 0.5em; }
            label { display: block; margin: 1em 0 0.3em; font-weight: 500; }
            input, select, button { width: 100%; padding: 0.7em; margin-bottom: 1em; border-radius: 6px; border: 1px solid #ccc; font-size: 1em; }
            button { background: #1c8c43; color: #fff; border: none; font-weight: bold; cursor: pointer; transition: background 0.2s; }
            button:hover { background: #166c32; }
            .qr-img { display: block; margin: 1.5em auto; max-width: 260px; border-radius: 8px; box-shadow: 0 2px 8px #0002; }
            .step { background: #e8f5e9; border-left: 4px solid #1c8c43; padding: 0.7em 1em; margin-bottom: 1em; border-radius: 6px; font-size: 0.98em; }
            .pair-code { font-size: 2em; color: #1c8c43; letter-spacing: 0.1em; margin: 0.5em 0; }
            @media (max-width: 600px) { .container { padding: 16px 4px; } }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Pair Your WhatsApp</h1>
            <form method="GET" action="/pair">
              <label>Enter your number:</label>
              <input type="text" name="number" required placeholder="e.g. 255712345678" />
              <label>Pairing Method:</label>
              <select name="method">
                <option value="code">Pairing Code</option>
                <option value="qr">QR Code</option>
              </select>
              <button type="submit">Pair</button>
            </form>
            <div class="step">
              <b>Step 1:</b> Enter your WhatsApp number in international format (e.g. 255712345678).<br>
              <b>Step 2:</b> Choose your preferred pairing method.<br>
              <b>Step 3:</b> Click <b>Pair</b> and follow the instructions.
            </div>
          </div>
        </body>
      </html>
    `);
  }
  if (method === 'code') {
    await createUserSession(number, (code, err) => {
      if (err) {
        return res.send('<div class="container"><h1>Error</h1><div class="step">Error generating pairing code: ' + err + '</div></div>');
      }
      res.send(`
        <html>
          <head>
            <title>Pairing Code</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; color: #222; margin: 0; padding: 0; }
              .container { max-width: 400px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 32px 24px; }
              h1 { color: #1c8c43; font-size: 1.5em; margin-bottom: 0.5em; }
              .step { background: #e8f5e9; border-left: 4px solid #1c8c43; padding: 0.7em 1em; margin-bottom: 1em; border-radius: 6px; font-size: 0.98em; }
              .pair-code { font-size: 2em; color: #1c8c43; letter-spacing: 0.1em; margin: 0.5em 0; }
              @media (max-width: 600px) { .container { padding: 16px 4px; } }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Pairing Code for WhatsApp</h1>
              <div class="step">
                <b>Step 1:</b> Open WhatsApp on your phone.<br>
                <b>Step 2:</b> Go to <b>Settings &gt; Linked Devices &gt; Link a Device &gt; Enter Code</b>.<br>
                <b>Step 3:</b> Enter the code below:
              </div>
              <div class="pair-code">${code}</div>
              <div class="step">Number: ${number}</div>
            </div>
          </body>
        </html>
      `);
    });
    return;
  }
  // QR code method
  let qrSent = false;
  await createUserSession(number, async (qr, err) => {
    if (qrSent) return; // prevent multiple responses
    qrSent = true;
    if (err) {
      return res.send('<div class="container"><h1>Error</h1><div class="step">Error generating QR code: ' + err + '</div></div>');
    }
    try {
      const qrDataUrl = await QRCode.toDataURL(qr);
      res.send(`
        <html>
          <head>
            <title>Pair Your WhatsApp</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; background: #f7f7fa; color: #222; margin: 0; padding: 0; }
              .container { max-width: 400px; margin: 40px auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 16px #0001; padding: 32px 24px; }
              h1 { color: #1c8c43; font-size: 1.5em; margin-bottom: 0.5em; }
              .qr-img { display: block; margin: 1.5em auto; max-width: 260px; border-radius: 8px; box-shadow: 0 2px 8px #0002; }
              .step { background: #e8f5e9; border-left: 4px solid #1c8c43; padding: 0.7em 1em; margin-bottom: 1em; border-radius: 6px; font-size: 0.98em; }
              @media (max-width: 600px) { .container { padding: 16px 4px; } }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Pair Your WhatsApp with Queen Shakira</h1>
              <div class="step">
                <b>Step 1:</b> Open WhatsApp on your phone.<br>
                <b>Step 2:</b> Go to <b>Settings &gt; Linked Devices &gt; Link a Device</b>.<br>
                <b>Step 3:</b> Scan the QR code below:
              </div>
              <img class="qr-img" src="${qrDataUrl}" alt="QR Code" />
              <div class="step">Number: ${number}</div>
            </div>
          </body>
        </html>
      `);
    } catch (e) {
      res.send('<div class="container"><h1>Error</h1><div class="step">Error rendering QR code: ' + e + '</div></div>');
    }
  });
});

module.exports = router; 