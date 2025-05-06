const Router = require('koa-router');
const crypto = require('crypto');
const { DateTime } = require('luxon');

const router = new Router({ prefix: '/ecomm/pacsun' });
require('dotenv').config(); 

const encryptKey = process.env.PACSUN_ENCRYPT_KEY; // 32 bytes key for AES-256-CBC


router.get('/:key', async (ctx) => {
    const key = ctx.params.key.toUpperCase();
    if(key === "TOKENS") {
        let data = {
            app_id: process.env.PACSUN_APP_ID,
            app_key: process.env.PACSUN_APP_KEY,
            access_token: process.env.PACSUN_ACCESS_TOKEN,
            refresh_token:process.env.PACSUN_REFRESH_TOKEN,
            app_secret: process.env.PACSUN_APP_SECRET,
            ts: DateTime.now()
        }

        console.log(encryptKey)
        const encryptedText = encryptText(JSON.stringify(data), encryptKey);
        ctx.body = encryptedText
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
});

function encryptText(rawText, encryptKey) {
    // Create a cipher using the key and AES-256-CBC algorithm
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptKey), Buffer.from(encryptKey.slice(0, 16))); // IV (Initialization Vector) derived from key

    // Encrypt the raw text
    let encrypted = cipher.update(rawText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
}

function decryptText(encryptedText, encryptKey) {
    // Extract the IV (Initialization Vector) from the key
    const iv = Buffer.from(encryptKey.slice(0, 16)); // 16 bytes IV, same as encryption

    // Create a decipher using the key and AES-256-CBC algorithm
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(encryptKey), iv);

    // Decrypt the encrypted base64 string
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = router;