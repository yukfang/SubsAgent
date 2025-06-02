const Router = require('koa-router');
const crypto = require('crypto');
const axios = require('axios');

const { DateTime } = require('luxon');
const {LocalDisk} = require('../storage/localdisk');

const router = new Router({ prefix: '/ecomm/pacsun' });
require('dotenv').config(); 

const encryptKey = process.env.PACSUN_ENCRYPT_KEY; // 32 bytes key for AES-256-CBC


router.get('/:key', async (ctx) => {
    const key = ctx.params.key.toUpperCase();
    if(key === "TOKENS") {
        await handleTokenRequest(ctx);
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
});

async function handleTokenRequest(ctx) {
        let data = {}
        let cache = LocalDisk.readFileSync('ecomm/pacsun', 'tokens.json');

        /** If there is no cache */
        if(!cache) {
            console.log('no cache')
            let newToken = await refreshToken()
            newToken.refresh_token = "*****"
            console.log('newToken', newToken)
            LocalDisk.writeFileSync('ecomm/pacsun', 'tokens.json', JSON.stringify(newToken, null, 2));
            data = {
                access_token: newToken.access_token,
                app_secret: process.env.PACSUN_APP_SECRET,
                app_key: process.env.PACSUN_APP_KEY,
            }
        } else {
            let cacheData = JSON.parse(cache.toString());
            console.log(DateTime.now().toSeconds() - cacheData.access_token_expire_in)
            if(!cacheData.access_token_expire_in || DateTime.now().toSeconds() + 3600 * 5 > cacheData.access_token_expire_in ) {
                console.log('cache expired')
                let newToken = await refreshToken()
                newToken.refresh_token = "*****"
                LocalDisk.writeFileSync('ecomm/pacsun', 'tokens.json', JSON.stringify(newToken, null, 2));
                data = {
                    access_token: newToken.access_token,
                    app_secret: process.env.PACSUN_APP_SECRET,
                    app_key: process.env.PACSUN_APP_KEY,
                }
            } else {
                data = {
                    access_token: cacheData.access_token,
                    app_secret: process.env.PACSUN_APP_SECRET,
                    app_key: process.env.PACSUN_APP_KEY,
                }
            }
        }
        const encryptedText = encryptText(JSON.stringify(data), encryptKey);
        ctx.body = encryptedText

 
        // LocalDisk.writeFileSync('pacsun', 'tokens.json', JSON.stringify(data, null, 2));
        // const encryptedText = encryptText(JSON.stringify(data), encryptKey);
        // ctx.body = encryptedText
}

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


/**   
 * HMAC sign
 * @private
 * @param {Object} requestOption
 * @returns {string}
 */
function _sign(requestOption, app_secret) {
    const excludeKeys = ["access_token", "sign"];
    let signString = "";
    const params = requestOption.params || {};
    const sortedParams = Object.keys(params)
        .filter((key) => !excludeKeys.includes(key))
        .sort()
        .map((key) => ({ key, value: params[key] }));
    //step2: Concatenate all the parameters in the format {key}{value}:  
    const paramString = sortedParams
        .map(({ key, value }) => `${key}${value}`)
        .join("");

    signString += paramString;

    // Join Path
    const pathname = new URL(requestOption.url || '').pathname;
    signString = `${pathname}${paramString}`;

    // Join Body
    if (
        requestOption.headers?.["content-type"] !== "multipart/form-data" &&
        typeof requestOption.data === 'object' &&
        requestOption.data !== null &&
        Object.keys(requestOption.data).length
    ) {
        const body = JSON.stringify(requestOption.data);
        signString += body;
    }

    //Construct the string to sign:
    signString = `${app_secret}${signString}${app_secret}`;
    // console.log('String to sign: ', signString)

    //Sign the string:
    const hmac = crypto.createHmac("sha256", app_secret);
    hmac.update(signString);
    const sign = hmac.digest("hex");
    return sign;
}




const shopCipher = "TTP_e7dvWAAAAADH4lAkMOmcn2V71tvda6fy"
const baseUrl = "https://open-api.tiktokglobalshop.com"
async function testApiToken(access_token, app_key, app_secret) {
    try {
        const path = '/authorization/202309/shops';
        const config = {
            method: 'GET',
            url: `${baseUrl}${path}`,
            headers: {'x-tts-access-token': access_token, 'Content-Type': 'application/json'},
            params: {
                app_key: app_key,
                timestamp: Math.floor(Date.now() / 1000)
            }
        }
        config.params.sign = _sign(config, app_secret);

        console.log(config)

        const response = await axios(config);
        if (response.status === 200 && response.data.code === 0 ) {
            return true
        } else {
            throw new Error(`Error fetching shops: ${response.data.msg}`);
        }
    } catch (error) {
        console.log(`Error Testing Api Token: ${error.message}`);
        return false;
    }
}

async function refreshToken() {
    const baseUrl = "https://auth.tiktok-shops.com"
    const path = `/api/v2/token/refresh`
    const method = "GET"
    const url = `${baseUrl}${path}`
    const headers = {'Content-Type': 'application/json'}
    const params = {
        app_key: process.env.PACSUN_APP_KEY,
        app_secret: process.env.PACSUN_APP_SECRET,
        refresh_token: process.env.PACSUN_REFRESH_TOKEN,
        grant_type: 'refresh_token'
    }

    const reqConfig = {
        method,
        url,
        headers,
        params,
        maxRedirects: 1
    };

    try {
        console.log(`Token Refresh Request : ${JSON.stringify(reqConfig)}`)
        const response = await axios(reqConfig);

        if (response.status === 200 && response.data.code === 0 ) {
            return response.data.data;
        } else {
            console.log(`Token Refresh Failed`)
            console.log(response.data)
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

module.exports = router;
