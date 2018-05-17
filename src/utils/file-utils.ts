import * as fsPromise from 'fs/promises';

export class FileUtils {
    static async mkdir(path: string) {
        try {
            const stat = await fsPromise.stat(path);
        }
        catch (e) {
            if (e.code === 'ENOENT') {
                await fsPromise.mkdir(path);
                return;
            }
            throw e;
        }
    }
}