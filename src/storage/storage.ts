import { FileUtils } from './../utils/file-utils';
import { Stream, Readable } from 'stream';
import { FileIndex } from '../file-index';
import { FileStorage } from '../file-storage';
import * as path from 'path';
import { FileInfo, FileMeta } from '../model';
import * as fsPromise from 'fs/promises';
import { Log } from '../logging';

class Storage {
    private _fileIndex: FileIndex;
    private _fileStorage: FileStorage;
    private _logger: Log;

    private constructor(logger: Log, fileIndex: FileIndex, fileStorage: FileStorage) {
        this._fileIndex = fileIndex;
        this._fileStorage = fileStorage;
        this._logger = logger;
    }

    async save(artifactId: string, fileInfo: FileInfo, fileContent: Readable): Promise<void> {
        const meta = await this._fileIndex.save(artifactId, fileInfo);
        await this._fileStorage.save(artifactId, meta, fileContent);
    }

    async moveInto(artifactId: string, fileInfo: FileInfo, filePath: string): Promise<void> {
        const meta = await this._fileIndex.save(artifactId, fileInfo);
        await this._fileStorage.moveInto(artifactId, meta, filePath);
    }

    async remove(artifactId: string, localPath: string): Promise<void> {
        const meta = await this._fileIndex.remove(artifactId, localPath);
        await this._fileStorage.remove(artifactId, meta);
    }

    async enum(artifactId: string): Promise<FileMeta[]> {
        return await this._fileIndex.enum(artifactId);
    }

    async openRead(artifactId: string, localPath: string): Promise<Stream> {
        const meta = await this._fileIndex.get(artifactId, localPath);
        return await this._fileStorage.openRead(artifactId, meta);
    }

    getTempPath(): string {
        return this._fileStorage.getTempDir();
    }

    static async createAt(root: string, logger: Log): Promise<Storage> {
        logger.info({ path: root }, 'initializing storage');
        await FileUtils.mkdir(root);

        const indexStore = await FileIndex.open(path.join(root, 'index'), logger);
        const fileStore = await FileStorage.open(path.join(root, 'files'), logger);

        return new Storage(logger, indexStore, fileStore);
    }

    static async create(logger: Log): Promise<Storage> {
        return await this.createAt(path.resolve('store'), logger);
    }
}

export { Storage };
export default Storage;