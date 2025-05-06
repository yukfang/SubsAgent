const Router = require('koa-router');
const router = new Router({ prefix: '/ssvmlist' });

router.get('/:key', async (ctx) => {
    const key = ctx.params.key.toUpperCase();
    const value = process.env[key];

    if (key.toUpperCase() === 'MYIP') {
        const myip = (process.env.PLATFORM === 'AZ_WEB_APP') ? ctx.request.headers['x-client-ip'] : ctx.request.ip;
        const ipInfo = await require('../koaApp').getIpAddress(myip);
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

module.exports = router;