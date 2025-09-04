// servidor.js - RELIANCE WhatsApp Bot con QR FUNCIONANDO
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');

const app = express();
app.use(express.json());

console.log('🚀 Iniciando RELIANCE Bot en Render...');

// Configuración para Render
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
            '--single-process'
        ]
    }
});

let isReady = false;
let qrString = '';
let connectionStatus = 'CONNECTING';

// Eventos del cliente
client.on('qr', (qr) => {
    console.log('✅ QR Code generado exitosamente!');
    console.log('QR Data:', qr.substring(0, 50) + '...');
    qrString = qr;
    connectionStatus = 'WAITING_QR';
    // Mostrar QR en consola
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

// Endpoint QR CORREGIDO - usando servicio externo
app.get('/qr', (req, res) => {
    if (qrString) {
        // Codificar QR para URL
        const qrEncoded = encodeURIComponent(qrString);
        
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Conectar WhatsApp - RELIANCE S.A.</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 20px;
                    background: #f5f5f5;
                    margin: 0;
                }
                .container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h2 { 
                    color: #0066cc; 
                    margin-bottom: 10px;
                }
                .company {
                    color: #666;
                    margin-bottom: 30px;
                    font-size: 16px;
                }
                .qr-container {
                    margin: 30px 0;
                    padding: 20px;
                    background: #fafafa;
                    border-radius: 10px;
                    border: 2px solid #e0e0e0;
                }
                .qr-image {
                    max-width: 280px;
                    height: 280px;
                    margin: 0 auto;
                    display: block;
                    border: 3px solid #0066cc;
                    border-radius: 10px;
                }
                .status { 
                    background: #e7f3ff; 
                    padding: 15px; 
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #0066cc;
                }
                .steps {
                    background: #f0f8ff;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: left;
                }
                .steps ol {
                    margin: 10px 0;
                    padding-left: 20px;
                }
                .steps li {
                    margin: 8px 0;
                    font-size: 14px;
                }
                .refresh-info {
                    color: #666;
                    font-size: 12px;
                    margin-top: 20px;
                }
                .loading {
                    color: #0066cc;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>🔗 Conectar WhatsApp</h2>
                <div class="company"><strong>RELIANCE S.A.</strong> - Bot de Cumpleaños</div>
                
                <div class="status">
                    📱 <strong>Escanea este código QR con tu WhatsApp</strong>
                </div>
                
                <div class="qr-container">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${qrEncoded}" 
                         alt="QR Code WhatsApp" 
                         class="qr-image"
                         onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"280\\" height=\\"280\\"><rect width=\\"280\\" height=\\"280\\" fill=\\"%23f0f0f0\\"/><text x=\\"140\\" y=\\"140\\" text-anchor=\\"middle\\" fill=\\"red\\">Error QR</text></svg>'"
                    />
                </div>
                
                <div class="steps">
                    <strong>📋 Pasos para conectar:</strong>
                    <ol>
                        <li>Abre <strong>WhatsApp</strong> en tu teléfono</li>
                        <li>Ve a <strong>Menú (⋮)</strong> → <strong>Dispositivos Vinculados</strong></li>
                        <li>Toca <strong>"Vincular un dispositivo"</strong></li>
                        <li>Escanea este código QR</li>
                    </ol>
                </div>
                
                <div class="refresh-info">
                    <div class="loading">⏳ Verificando conexión cada 5 segundos...</div>
                    <small>Una vez conectado, esta página se actualizará automáticamente</small>
                </div>
                
                <script>
                    // Auto-refresh cada 5 segundos
                    setTimeout(() => {
                        console.log('Verificando conexión...');
                        window.location.reload();
                    }, 5000);
                    
                    // Mostrar tiempo transcurrido
                    let seconds = 0;
                    setInterval(() => {
                        seconds += 1;
                        const minutes = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        const timeStr = minutes > 0 ? minutes + 'm ' + secs + 's' : secs + 's';
                        document.title = 'Conectar WhatsApp (' + timeStr + ') - RELIANCE S.A.';
                    }, 1000);
                </script>
            </div>
        </body>
        </html>
        `);
    } else if (isReady) {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>WhatsApp Conectado - RELIANCE S.A.</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f0f8ff;
                }
                .success-container {
                    max-width: 500px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                }
                .success-icon {
                    font-size: 60px;
                    margin-bottom: 20px;
                }
                h2 { 
                    color: #28a745; 
                    margin-bottom: 15px;
                }
                .company {
                    color: #0066cc;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .info-box {
                    background: #d4edda;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 4px solid #28a745;
                }
                .action-buttons {
                    margin: 30px 0;
                }
                .btn {
                    display: inline-block;
                    padding: 12px 24px;
                    margin: 5px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-weight: bold;
                    transition: background-color 0.3s;
                }
                .btn-primary {
                    background: #0066cc;
                    color: white;
                }
                .btn-primary:hover {
                    background: #0052a3;
                }
                .btn-secondary {
                    background: #6c757d;
                    color: white;
                }
                .timestamp {
                    color: #666;
                    font-size: 12px;
                    margin-top: 20px;
                }
            </style>
        </head>
        <body>
            <div class="success-container">
                <div class="success-icon">✅</div>
                <h2>WhatsApp Conectado Exitosamente!</h2>
                <div class="company">RELIANCE S.A.</div>
                
                <div class="info-box">
                    <strong>🎂 Bot de Cumpleaños Activo</strong><br>
                    El sistema está listo para enviar felicitaciones automáticamente
                </div>
                
                <div class="action-buttons">
                    <a href="/status" class="btn btn-primary">📊 Ver Estado</a>
                    <a href="/" class="btn btn-secondary">🏠 Inicio</a>
                </div>
                
                <div class="timestamp">
                    <strong>Conectado:</strong> ${new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}
                </div>
            </div>
        </body>
        </html>
        `);
    } else {
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inicializando WhatsApp - RELIANCE S.A.</title>
            <meta charset="UTF-8">
            <meta http-equiv="refresh" content="3">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    text-align: center; 
                    padding: 50px;
                    background: #f8f9fa;
                }
                .loading-container {
                    max-width: 400px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .spinner {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #0066cc;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                h2 { color: #0066cc; }
                .status-info {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                    border-left: 4px solid #ffc107;
                }
            </style>
        </head>
        <body>
            <div class="loading-container">
                <h2>⏳ Inicializando WhatsApp...</h2>
                <div class="spinner"></div>
                <div class="status-info">
                    <strong>Estado:</strong> ${connectionStatus}<br>
                    <strong>Proceso:</strong> Conectando con WhatsApp Web
                </div>
                <p><small>Esta página se actualiza automáticamente cada 3 segundos</small></p>
            </div>
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
