import * as levelup from 'levelup';
import * as leveldown from 'leveldown';
import * as crypto from 'crypto';
import * as fsPromise from 'fs/promises';
import * as path from 'path';
import { FileInfo, FileMeta } from '../model';
import { FileUtils } from '../utils/file-utils';
import { json } from 'body-parser';
import { Log } from '../logging';

class FileIndex {
    _db: any;
    private _root: string;
    private _logger: Log;

    private constructor(root: string, logger: Log) {
        this._root = root;
        this._logger = logger;
        const dbpath = path.join(this._root);

        const ld: any = leveldown.default(dbpath);

        this._db = levelup(ld);
    }

    private _buildKey(artifactId: string, localPath: string): string {
        return `${artifactId}:${path.normalize(localPath)}`;
    }

    async save(artifactId: string, fileInfo: FileInfo): Promise<FileMeta> {
        const key = this._buildKey(artifactId, fileInfo.path);
        const meta = {
            fileInfo: fileInfo,
            internalPath: this._createInternalPath(fileInfo.path)
        };

        await this._put(key, meta);
        return meta;
    }

    async remove(artifactId: string, localPath: string): Promise<FileMeta> {
        const key = this._buildKey(artifactId, localPath);
        const meta = await this._get(key);
        await this._db.del(key);
        return meta;
    }

    async enum(artifactId: string): Promise<FileMeta[]> {
        const options = {
            gte: `${artifactId}:`,
            lt: `${artifactId}:ff`
        };
        const read = this._db.createReadStream();

        return await new Promise<FileMeta[]>((resolve, reject) => {
            let result: FileMeta[] = [];

            read.on('data', (pair: any) => result.push(JSON.parse(pair.value)))
            read.on('end', () => resolve(result));
            read.on('close', () => resolve(result));
            read.on('error', reject);
        });
    }

    async get(artifactId: string, localPath: string): Promise<FileMeta | undefined> {
        const key = this._buildKey(artifactId, localPath);
        return await this._get(key);
    }

    private async _get(key: string): Promise<FileMeta | undefined> {
        try {
            const buffer = await this._db.get(key);
            return JSON.parse(buffer.toString()) as FileMeta;
        }
        catch (e) {
            return undefined;
        }
    }

    private async _put(key: string, meta: FileMeta): Promise<void> {
        const buffer = Buffer.from(JSON.stringify(meta));
        await this._db.put(key, buffer);
    }

    private _createInternalPath(localPath: string): string {
        return Buffer.from(localPath).toString('base64');
    }

    static async open(root: string, logger: Log) {
        logger.info({ path: root }, 'initializing file index');
        await FileUtils.mkdir(root);
        return new FileIndex(root, logger);
    }
}

export { FileIndex };
export default FileIndex;