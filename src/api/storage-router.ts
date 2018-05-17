import { FileInfo } from './../model/file-info';
import * as Router from 'koa-router';
import { abyss } from '../abyss';
import { IncomingForm } from 'formidable';
import { format } from 'util';
import * as path from 'path';

const storageRouter = new Router();

storageRouter.get('/:id', async ctx => {
    ctx.body = (await abyss.storage.enum(ctx.params.id))
        .map(meta => meta.fileInfo);
});

storageRouter.get('/:id/file/:path', async ctx => {
    const file = await abyss.storage.openRead(ctx.params.id, ctx.params.path);

    ctx.body = file;
    ctx.response.attachment(path.basename(ctx.params.path));
});

storageRouter.post('/:id', async ctx => {
    const form = new IncomingForm();
    form.uploadDir = abyss.storage.getTempPath();

    await new Promise((resolve, reject) => {
        form.parse(ctx.request.req, (err: any, fields, files) => {
            const path = files[Object.keys(files)[0]].path;
            const fileInfo: FileInfo = {
                created: new Date(fields.created as string),
                path: fields.path as string
            };

            abyss.storage.moveInto(ctx.params.id, fileInfo, path)
                .then(meta => {
                    ctx.status = 200;
                    resolve();
                })
                .catch(reject);
        });
    });
});

storageRouter.delete('/:id/file/:path', async ctx => {
    await abyss.storage.remove(ctx.params.id, ctx.params.path);
    ctx.status = 200;
});

export { storageRouter };
export default storageRouter;