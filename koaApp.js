const Koa           = require('koa');
const bodyParser    = require('koa-bodyparser');
const Router        = require('koa-router');
const koaApp        = new Koa();
const router        = new Router();
koaApp.use(bodyParser())
koaApp.use(router.routes()).use(router.allowedMethods())
require('dotenv').config(); 

// logger
koaApp.use(async (ctx, next) => {
  await next();
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time
koaApp.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start; 
  ctx.set('X-Response-Time', `${ms}ms`);
});
 
// response
koaApp.use(async (ctx, next) => {
    if (ctx.path === '/data') {

    } else {
        ctx.body = 'Request :' + ctx.path;
    }
    next();
})


router.get('/:key', async (ctx) => {
    console.log('GET /:key')
    console.log(process.env)
    const key = ctx.params.key.toUpperCase(); 
    const value = process.env[key];



    if (value) {
        const remarks = `REMARKS=${key}`
        const vmlist = JSON.parse(value).map(i => process.env[i] || process.env[i.replaceAll(".", "_")])
        const instances = vmlist.join("\r\n")
        
        const data = Buffer.from(remarks + "\r\n" + instances) //.toString('base64');
        // const data = Buffer.from(remarks + "\r\n" + instances).toString('base64');
        ctx.body = data

    } else {
        ctx.status = 401;
        ctx.body = { error: `Prohibited: ${key}` };
    }
});


async function init() {
}

module.exports = {
  koaApp,
  init,
};
