import * as levelup from 'levelup';
import * as leveldown from 'leveldown';
import * as encodingDown from 'encoding-down';
import * as path from 'path';
import { FileInfo, FileMeta } from '../model';
import { FileUtils } from '../utils/file-utils';
import { Log } from '../logging';

class FileIndex {
    private _db: any;
    private _root: string;
    private _logger: Log;

    private constructor(root: string, logger: Log) {
        this._root = root;
        this._logger = logger;
        const dbpath = path.join(this._root);

        this._db = levelup(encodingDown.default(leveldown.default(dbpath), {
            valueEncoding: 'json'
        }));
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
        this._translateMeta(meta);
        return meta;
    }

    async removeArtifact(artifactId: string): Promise<FileMeta[]> {
        const result = await this.enum(artifactId);
        const batch = result.map(meta => ({ type: 'del', key: this._buildKey(artifactId, meta.fileInfo.path) }));

        await this._db.batch(batch);
        return result;
    }

    async enum(artifactId: string): Promise<FileMeta[]> {
        const options = {
            gte: `${artifactId}:`,
            lt: `${artifactId};`
        };
        const read = this._db.createReadStream(options);

        return await new Promise<FileMeta[]>((resolve, reject) => {
            let result: FileMeta[] = [];

            read.on('data', (pair: any) => {
                let meta = pair.value;
                this._translateMeta(meta);
                result.push(meta);
            });
            read.on('end', () => resolve(result));
            read.on('close', () => resolve(result));
            read.on('error', reject);
        });
    }

    async get(artifactId: string, localPath: string): Promise<FileMeta | undefined> {
        const key = this._buildKey(artifactId, localPath);
        let meta = await this._get(key);
        this._translateMeta(meta);
        return meta;
    }

    async close(): Promise<void> {
        await this._db.close();
    }

    private async _get(key: string): Promise<FileMeta | undefined> {
        try {
            return await this._db.get(key);
        }
        catch (e) {
            throw e;
        }
    }

    private async _put(key: string, meta: FileMeta): Promise<void> {
        await this._db.put(key, meta);
    }

    private _translateMeta(meta: FileMeta) {
        if (!meta) {
            return;
        }
        meta.fileInfo.created = new Date(meta.fileInfo.created);
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