import * as Koa from 'koa';
import * as koaCors from '@koa/cors';
import * as Http2 from 'http2';
import { abyss } from './abyss';
import { apiRouter } from './api';
import { createLogger } from './logging';

const logger = createLogger();
const port = 8090;

abyss.init(logger)
    .then(() => {
        logger.info({ port: port }, 'starting service');
        const app = new Koa();
        app.use(koaCors());
        app.use(apiRouter.routes());
        app.use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                ctx.status = err.status || 500;
                ctx.body = err.message;
                ctx.app.emit('error', err, ctx);
            }
        });

        app.on('error', (err, ctx) => {
            logger.error(err);
        });
        app.listen(port);
        logger.info({ port: port }, 'service started');
    });


