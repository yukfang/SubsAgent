const Router = require('koa-router');
const router = new Router({ prefix: '/ssvmlist' });
const delayms = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.get('/:key', async (ctx) => {

    console.log(`ssvmlist exec`)
    await delayms(1000);
    const key = ctx.params.key.toUpperCase();
    const value = process.env[key];

    if (key.toUpperCase() === 'MYIP') {
        const myip = (process.env.PLATFORM === 'AZ_WEB_APP') ? ctx.request.headers['x-client-ip'] : ctx.request.ip;
        const ipInfo = await getIpAddress(myip);
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
    } else if (value) {
        console.log(value);
        const remarks = `REMARKS=${key}`;
        const vmlist = JSON.parse(value).map(v => process.env[v] || process.env[v.replaceAll(".", "_")]);
        console.log(vmlist);
        const instances = vmlist.join("\r\n");
        const data = Buffer.from(remarks + "\r\n" + instances).toString('base64');
        ctx.body = data;
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
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


module.exports = router;