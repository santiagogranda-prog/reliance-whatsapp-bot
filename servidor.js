// servidor.js - RELIANCE WhatsApp Bot para Railway
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

console.log('🚀 Iniciando RELIANCE Bot en Railway...');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "reliance-railway-bot"
    }),
    puppeteer: {
        headless: true, // SIN ventana en servidor
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security'
        ]
    }
});

let isReady = false;
let qrString = '';

// Eventos del cliente
client.on('qr', (qr) => {
    console.log('QR Code generado - accede a /qr para verlo');
    qrString = qr;
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado en Railway!');
    isReady = true;
    qrString = '';
});

client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Desconectado:', reason);
    isReady = false;
});

// API Endpoints
app.get('/', (req, res) => {
    res.json({
        service: 'RELIANCE WhatsApp Bot',
        status: isReady ? 'CONNECTED' : 'DISCONNECTED',
        timestamp: new Date().toISOString()
    });
});

app.get('/status', (req, res) => {
    res.json({
        ready: isReady,
        qrAvailable: !!qrString,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para ver QR (solo si está disponible)
app.get('/qr', (req, res) => {
    if (qrString) {
        res.send(`
        <html>
        <body style="text-align:center; font-family:Arial;">
        <h2>🔗 Conectar WhatsApp</h2>
        <p>Escanea este QR con tu WhatsApp:</p>
        <div id="qr"></div>
        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
        <script>
        QRCode.toCanvas(document.createElement('canvas'), '${qrString}', function (error, canvas) {
            if (error) console.error(error)
            canvas.style.width = '300px';
            canvas.style.height = '300px';
            document.getElementById('qr').appendChild(canvas);
        });
        </script>
        <p><small>Una vez escaneado, actualiza en unos segundos</small></p>
        </body>
        </html>
        `);
    } else {
        res.send('<h2>✅ WhatsApp ya está conectado!</h2><p><a href="/status">Ver estado</a></p>');
    }
});

// Enviar mensaje
app.post('/send-message', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({ 
                success: false,
                error: 'WhatsApp no conectado',
                qrUrl: qrString ? '/qr' : null
            });
        }

        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ 
                success: false,
                error: 'Teléfono y mensaje requeridos' 
            });
        }

        // Normalizar número Ecuador
        let normalizedPhone = phone.toString().replace(/[^\d]/g, '');
        
        if (normalizedPhone.startsWith('593')) {
            normalizedPhone = normalizedPhone;
        } else if (normalizedPhone.startsWith('09')) {
            normalizedPhone = '593' + normalizedPhone.substring(1);
        } else if (normalizedPhone.startsWith('9') && normalizedPhone.length === 9) {
            normalizedPhone = '593' + normalizedPhone;
        } else if (normalizedPhone.length === 10 && normalizedPhone.startsWith('0')) {
            normalizedPhone = '593' + normalizedPhone.substring(1);
        } else if (normalizedPhone.length === 9) {
            normalizedPhone = '593' + normalizedPhone;
        }

        const chatId = normalizedPhone + '@c.us';
        
        // Verificar si tiene WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            return res.status(400).json({
                success: false,
                error: 'Número sin WhatsApp',
                phone: phone
            });
        }
        
        // Enviar mensaje
        const sentMessage = await client.sendMessage(chatId, message);
        
        console.log('✅ Mensaje enviado a ' + phone);
        
        res.json({
            success: true,
            messageId: sentMessage.id.id,
            phone: phone,
            normalizedPhone: normalizedPhone,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Inicializar
client.initialize();

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log('🌐 Bot corriendo en puerto ' + PORT);
    console.log('📡 Endpoints: /, /status, /qr, /send-message');
});