const Router = require('koa-router');
const router = new Router({ prefix: '/vmlist' });

router.get('/:key', async (ctx) => {
    const key = ctx.params.key.toUpperCase();
    const value = process.env[key];

    if (value) {
        const remarks = `REMARKS=${key}`;
        const vmlist = JSON.parse(value).map(i => process.env[i] || process.env[i.replaceAll(".", "_")]);
        const instances = vmlist.join("\r\n");
        const data = Buffer.from(remarks + "\r\n" + instances).toString('base64');
        ctx.body = data;
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
});

module.exports = router;