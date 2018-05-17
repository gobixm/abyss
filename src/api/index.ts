import * as Router from 'koa-router';
import { storageRouter } from './storage-router';

const apiRouter = new Router();

apiRouter.use('/api/storage', storageRouter.routes(), storageRouter.allowedMethods());

export { apiRouter };
export default apiRouter;