import { FileInfo } from './../model/file-info';
import * as Router from 'koa-router';
import { abyss } from '../abyss';
import { IncomingForm } from 'formidable';
import { format } from 'util';
import * as path from 'path';

const storageRouter = new Router();

storageRouter.get('/:id', async ctx => {
    ctx.body = (await abyss.storage.enumFiles(ctx.params.id))
        .map(meta => meta.fileInfo);
});

storageRouter.get('/', async ctx => {
    const pattern = ctx.query.pattern ? ctx.query.pattern : '';
    const take = ctx.query.take ? Number.parseInt(ctx.query.take) : 'all';
    ctx.body = await abyss.storage.enumArtifacts(pattern, take);
});

storageRouter.get('/:id/file/:path', async ctx => {
    const file = await abyss.storage.openRead(ctx.params.id, ctx.params.path);

    ctx.body = file;
    ctx.response.attachment(path.basename(ctx.params.path));
});

storageRouter.post('/:id', async ctx => {
    await abyss.storage.createArtifact(ctx.params.id);
    ctx.status = 200;
});

storageRouter.post('/:id/file', async ctx => {
    const form = new IncomingForm();
    form.uploadDir = abyss.storage.getTempPath();

    await new Promise((resolve, reject) => {
        form.parse(ctx.request.req, (err: any, fields, files) => {
            const key = Object.keys(files)[0];
            const file = files[key];
            if (!file) {
                reject(new Error('file required'));
                return;
            }
            const path = file.path;
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
    await abyss.storage.removeFile(ctx.params.id, ctx.params.path);
    ctx.status = 200;
});

storageRouter.delete('/:id', async ctx => {
    await abyss.storage.removeArtifact(ctx.params.id);
    ctx.status = 200;
});

export { storageRouter };
export default storageRouter;