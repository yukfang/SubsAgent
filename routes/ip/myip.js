
const proxying = require('../../utils/http/proxying');
const Router = require('koa-router');
const router = new Router({ prefix: '/ip' });
router.get('/:key', async (ctx) => {
    const key = ctx.params.key;
    console.log(`detect ip ${key}`)
    let ip_addr = '';
    if (key.toUpperCase() === 'MY') {
        ip_addr = (process.env.PLATFORM === 'AZ_WEB_APP') ? ctx.request.headers['x-client-ip'] : ctx.request.ip;
    } else if(isValidIpAddress(key)) {
        ip_addr = key;
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
        return
    }

    const ipInfo = await getIpAddress(ip_addr);
    const debugInfo = {
        request: (process.env.DEBUG_FLAG === 'true') ? ctx.request.headers : null,
    };
    const respData = {
        ipInfo: ipInfo        
    };
    if (process.env.DEBUG_FLAG === 'true') {
        respData.debugInfo = debugInfo;
    }
    ctx.body = JSON.stringify(respData, null, 2);
});




async function getIpAddress(ip_addr) {
    const endpoint      = `https://qifu-api.baidubce.com/ip/geo/v1/district?ip=${ip_addr}`;
    const method        = 'GET';
    let param       = { };
    let body        = null;
    const header    = {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh-HK;q=0.7,zh;q=0.6',
        'Connection': 'keep-alive',
        'DNT': '1',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
        'sec-ch-ua': '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
    }
    const response = (await proxying(method, endpoint, header, param, body, true));
    // console.log(response.data)

    if(response.status == 200 ) {
        const data = JSON.parse(response.data);
        return data;

    } else {
        console.log(`Get IpInfo ${ip_addr} Error !!!`)
        return null;
    }
}




function isValidIpAddress(ip) {
    // IPv4 regex pattern
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 regex pattern
    const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}





module.exports = router;