const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fetch = require('node-fetch');

// 🔧 Replace with your own Google Sheet info
const SHEET_ID = 'YOUR_SHEET_ID_HERE';
const SHEET_NAME = 'Attendance'; // Your tab name

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true // headless mode required for cloud
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Scan the QR code once to log in (see Render logs)');
});

client.on('ready', async () => {
    console.log('✅ WhatsApp client is ready!');
    try {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SHEET_NAME}`;
        const response = await fetch(sheetUrl);
        const csv = await response.text();

        const rows = csv.trim().split('\n').map(r => r.split(','));
        rows.shift(); // Remove header row

        const today = new Date().toISOString().split('T')[0];

        for (const row of rows) {
            const [studentName, parentName, phoneNumber, date, status] = row.map(s => s.trim());
            if (date === today && status.toLowerCase() === 'absent') {
                const chatId = `${phoneNumber}@c.us`;
                const message = `Dear ${parentName}, your child ${studentName} was marked absent today (${date}).`;
                await client.sendMessage(chatId, message);
                console.log(`📤 Sent to ${parentName} (${phoneNumber})`);
            }
        }
    } catch (err) {
        console.error('❌ Error fetching sheet or sending:', err);
    }
});

client.initialize();
