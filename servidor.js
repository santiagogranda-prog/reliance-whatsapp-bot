// servidor.js - RELIANCE WhatsApp Bot para Render (CORREGIDO)
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

console.log('🚀 Iniciando RELIANCE Bot en Render...');

// Configuración especial para Render
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "reliance-render-bot"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--run-all-compositor-stages-before-draw',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-ipc-flooding-protection',
            '--single-process' // CLAVE para Render
        ],
        executablePath: process.env.CHROME_BIN || undefined
    }
});

let isReady = false;
let qrString = '';
let connectionStatus = 'CONNECTING';

// Eventos del cliente
client.on('qr', (qr) => {
    console.log('✅ QR Code generado exitosamente!');
    qrString = qr;
    connectionStatus = 'WAITING_QR';
    // Mostrar QR en consola también
    console.log('QR para conectar:');
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('✅ WhatsApp conectado en Render!');
    isReady = true;
    qrString = '';
    connectionStatus = 'CONNECTED';
});

client.on('auth_failure', msg => {
    console.error('❌ Error de autenticación:', msg);
    connectionStatus = 'AUTH_FAILED';
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Desconectado:', reason);
    isReady = false;
    connectionStatus = 'DISCONNECTED';
});

client.on('loading_screen', (percent, message) => {
    console.log('⏳ Cargando WhatsApp:', percent + '%', message);
});

// Respuestas automáticas
client.on('message', async message => {
    if (message.isGroupMsg) return;
    
    const messageText = message.body.toLowerCase().trim();
    const senderNumber = message.from.replace('@c.us', '');
    
    console.log('📨 Mensaje de ' + senderNumber + ': ' + messageText);
    
    if (messageText.includes('acepto') || messageText.includes('si') || messageText.includes('autorizo')) {
        const respuesta = 'Perfecto! Gracias por autorizar nuestras comunicaciones. Ahora recibiras saludos especiales en tu cumpleanos y noticias importantes de RELIANCE S.A. Nos alegra mantenerte informado/a! Equipo RELIANCE S.A.';
        await message.reply(respuesta);
        console.log('✅ Respuesta enviada a ' + senderNumber);
    } else if (messageText.includes('no') || messageText.includes('rechazo')) {
        const respuesta = 'Entendido. Respetamos tu decision y no recibiras mas mensajes promocionales. Si cambias de opinion, escribe ACEPTO cuando gustes. Gracias por tu tiempo.';
        await message.reply(respuesta);
        console.log('✅ Respuesta de rechazo enviada a ' + senderNumber);
    }
});

// API Endpoints
app.get('/', (req, res) => {
    res.json({
        service: 'RELIANCE WhatsApp Bot',
        status: connectionStatus,
        ready: isReady,
        qrAvailable: !!qrString,
        timestamp: new Date().toISOString(),
        info: 'Bot de cumpleanos para RELIANCE S.A.'
    });
});

app.get('/status', (req, res) => {
    res.json({
        ready: isReady,
        status: connectionStatus,
        qrAvailable: !!qrString,
        timestamp: new Date().toISOString(),
        serverTime: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })
    });
});

// Endpoint para QR mejorado
app.get('/qr', (req, res) => {
    if (qrString) {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Conectar WhatsApp - RELIANCE S.A.</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px;
                    background: #f5f5f5;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h2 { color: #0066cc; }
                #qr { margin: 20px 0; }
                .status { 
                    background: #e7f3ff; 
                    padding: 10px; 
                    border-radius: 5px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🔗 Conectar WhatsApp</h2>
                <p><strong>RELIANCE S.A. - Bot de Cumpleaños</strong></p>
                
                <div class="status">
                    📱 Escanea este código QR con tu WhatsApp
                </div>
                
                <div id="qr"></div>
                
                <div class="status">
                    <strong>Pasos:</strong><br>
                    1. Abre WhatsApp en tu teléfono<br>
                    2. Ve a Menú → Dispositivos Vinculados<br>
                    3. Toca "Vincular un dispositivo"<br>
                    4. Escanea este código QR<br>
                </div>
                
                <p><small>Una vez conectado, esta página se actualizará automáticamente</small></p>
                
                <script>
                    // Auto-refresh cada 5 segundos para verificar conexión
                    setTimeout(() => {
                        window.location.reload();
                    }, 5000);
                </script>
            </div>
            
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"></script>
            <script>
                QRCode.toCanvas(document.createElement('canvas'), '${qrString}', function (error, canvas) {
                    if (error) {
                        console.error(error);
                        document.getElementById('qr').innerHTML = '<p style="color:red;">Error generando QR</p>';
                    } else {
                        canvas.style.width = '300px';
                        canvas.style.height = '300px';
                        canvas.style.border = '2px solid #ddd';
                        document.getElementById('qr').appendChild(canvas);
                    }
                });
            </script>
        </body>
        </html>
        `);
    } else if (isReady) {
        res.send(`
        <html>
        <head><title>WhatsApp Conectado</title></head>
        <body style="text-align:center; font-family:Arial; padding:50px;">
            <h2 style="color:green;">✅ WhatsApp Conectado Exitosamente!</h2>
            <p><strong>RELIANCE S.A. Bot</strong> está listo para enviar cumpleaños</p>
            <p><a href="/status" style="background:#0066cc; color:white; padding:10px 20px; text-decoration:none; border-radius:5px;">Ver Estado</a></p>
            <p><small>Última conexión: ${new Date().toLocaleString('es-EC')}</small></p>
        </body>
        </html>
        `);
    } else {
        res.send(`
        <html>
        <head>
            <title>Conectando WhatsApp...</title>
            <meta http-equiv="refresh" content="3">
        </head>
        <body style="text-align:center; font-family:Arial; padding:50px;">
            <h2>⏳ Inicializando WhatsApp...</h2>
            <p>Estado: ${connectionStatus}</p>
            <p>Esperando QR code...</p>
            <p><small>Esta página se actualiza automáticamente</small></p>
        </body>
        </html>
        `);
    }
});

// Enviar mensaje
app.post('/send-message', async (req, res) => {
    try {
        if (!isReady) {
            return res.status(503).json({ 
                success: false,
                error: 'WhatsApp no conectado',
                status: connectionStatus,
                qrUrl: qrString ? '/qr' : null
            });
        }

        const { phone, message } = req.body;
        
        if (!phone || !message) {
            return res.status(400).json({ 
                success: false,
                error: 'Telefono y mensaje requeridos' 
            });
        }

        // Normalizar número Ecuador
        let normalizedPhone = phone.toString().replace(/[^\d]/g, '');
        
        console.log('📞 Procesando: ' + phone + ' -> ' + normalizedPhone);
        
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
        
        console.log('📱 Enviando a: ' + chatId);
        console.log('💬 Mensaje: ' + message.substring(0, 50) + '...');
        
        // Verificar si tiene WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            console.log('⚠️ Número sin WhatsApp: ' + phone);
            return res.status(400).json({
                success: false,
                error: 'Numero sin WhatsApp',
                phone: phone,
                normalizedPhone: normalizedPhone
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
            chatId: chatId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error enviando mensaje a ' + req.body.phone + ':', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            phone: req.body.phone
        });
    }
});

// Inicializar
console.log('🔌 Inicializando cliente WhatsApp...');
client.initialize().catch(err => {
    console.error('❌ Error inicializando:', err);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log('🌐 Servidor corriendo en puerto ' + PORT);
    console.log('📡 Endpoints disponibles:');
    console.log('   GET  /', '/status', '/qr');
    console.log('   POST /send-message');
    console.log('⏳ Esperando conexión WhatsApp...');
});
