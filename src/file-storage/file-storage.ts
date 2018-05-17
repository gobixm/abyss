import { Log } from './../logging/index';
import * as fsPromise from 'fs/promises';
import * as fs from 'fs';
import * as del from 'del';
import * as path from 'path';
import { Stream } from 'stream';
import { FileMeta } from '../model';
import { FileUtils } from '../utils/file-utils';

class FileStorage {
    private _tempPath: string;
    private _root: string;
    private _logger: Log;

    private constructor(root: string, tempPath: string, logger: Log) {
        this._root = root;
        this._tempPath = tempPath;
        this._logger = logger;
    }

    async save(artifactId: string, fileMeta: FileMeta, content: Stream): Promise<void> {
        const filePath = this._getInternalPath(artifactId, fileMeta);

        let destStream: fs.WriteStream = undefined;
        try {
            destStream = fs.createWriteStream(filePath);
        }
        catch (e) {
            this._logger.error(e, 'failed to save file', filePath);
        }

        try {
            content.pipe(destStream);
            content.on('end', () => destStream.end());
            await new Promise((resolve, reject) => {
                destStream.on('end', resolve);
                destStream.on('error', reject);
            });
            this._logger.debug(fileMeta, `file saved at ${filePath}`);
        }
        catch (e) {
            this._logger.error(e, 'failed to create file');
            throw new Error(`failed to create file ${filePath}`);
        }
    }

    async moveInto(artifactId: string, fileMeta: FileMeta, sourcePath: string): Promise<void> {
        const filePath = this._getInternalPath(artifactId, fileMeta);

        try {
            await fsPromise.rename(sourcePath, filePath);
            this._logger.debug(fileMeta, `file saved at ${filePath}`);
        }
        catch (e) {
            this._logger.error(e, 'failed to create file');
            throw new Error(`failed to create file ${filePath}`);
        }
    }

    async remove(artifactId: string, fileMeta: FileMeta) {
        const filePath = this._getInternalPath(artifactId, fileMeta);
        try {
            await del(filePath);
            this._logger.debug(`file ${filePath} deleted`);
        }
        catch (e) {
            this._logger.error(e, 'failed to delete file');
            throw new Error(`failed to delete file ${filePath}`);
        }
    }

    async openRead(artifactId: string, fileMeta: FileMeta): Promise<Stream> {
        const filePath = this._getInternalPath(artifactId, fileMeta);
        try {
            return fs.createReadStream(filePath);
        }
        catch (e) {
            this._logger.error(e, 'failed to get file content');
            throw new Error(`failed to get file content ${filePath}`);
        }
    }

    getTempDir(): string {
        return path.join(this._root, 'tmp');
    }

    private _getInternalPath(artifactId: string, fileMeta: FileMeta): string {
        return path.join(this._root, `${artifactId}_${fileMeta.internalPath}`);
    }

    public static async open(root: string, logger: Log): Promise<FileStorage> {
        logger.info({ path: root }, 'initializing file storage');
        await FileUtils.mkdir(root);
        const tempPath = path.join(root, 'tmp');
        await del(`${tempPath}\**`);
        await FileUtils.mkdir(tempPath);
        return new FileStorage(root, tempPath, logger);
    }
}
export { FileStorage };
export default FileStorage;