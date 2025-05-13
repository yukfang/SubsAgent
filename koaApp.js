const Koa           = require('koa');
const bodyParser    = require('koa-bodyparser');
const ssvmlistRouter = require('./routes/vpn/ssvmlist');
const ipRouter       = require('./routes/ip/myip');
const ecommRouter    = require('./routes/ecomm/pacsun');
const delayms = (ms) => new Promise(resolve => setTimeout(resolve, ms));
require('dotenv').config(); 

const koaApp            = new Koa();
koaApp.use(bodyParser())


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
    await next();
})

// routes
koaApp.use(ssvmlistRouter.routes()).use(ssvmlistRouter.allowedMethods())
koaApp.use(ecommRouter.routes()).use(ecommRouter.allowedMethods())
koaApp.use(ipRouter.routes()).use(ipRouter.allowedMethods())






async function init() {
}

module.exports = {
  koaApp,
  init,
};
