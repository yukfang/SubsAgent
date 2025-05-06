const Router = require('koa-router');
const router = new Router({ prefix: '/ecomm/pacsun' });
const { DateTime } = require('luxon');

router.get('/:key', async (ctx) => {
    const key = ctx.params.key.toUpperCase();
    if(key === "TOKENS") {
        const app_id = process.env.PACSUN_APP_ID;
        const app_key = process.env.PACSUN_APP_KEY; 
        const app_refresh_token = process.env.PACSUN_REFRESH_TOKEN;

        ctx.body = {
            app_id: app_id,
            app_key: app_key,
            app_refresh_token: app_refresh_token,
            ts: DateTime.now()
        }
    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
});

module.exports = router;