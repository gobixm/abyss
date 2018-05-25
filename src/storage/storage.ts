import { FileUtils } from './../utils/file-utils';
import { Stream, Readable } from 'stream';
import { FileIndex } from '../file-index';
import { FileStorage } from '../file-storage';
import * as path from 'path';
import { FileInfo, FileMeta } from '../model';
import * as fsPromise from 'fs/promises';
import { Log } from '../logging';
import { ArtifactIndex } from '../artifact-index';

class Storage {
    private _fileIndex: FileIndex;
    private _fileStorage: FileStorage;
    private _artifactIndex: ArtifactIndex;
    private _logger: Log;

    private constructor(logger: Log, fileIndex: FileIndex, fileStorage: FileStorage, artifactIndex: ArtifactIndex) {
        this._fileIndex = fileIndex;
        this._fileStorage = fileStorage;
        this._artifactIndex = artifactIndex;
        this._logger = logger;
    }

    async saveFile(artifactId: string, fileInfo: FileInfo, fileContent: Readable): Promise<void> {
        const meta = await this._fileIndex.save(artifactId, fileInfo);
        await this._fileStorage.save(artifactId, meta, fileContent);
    }

    async createArtifact(artifactId: string): Promise<void> {
        await this._artifactIndex.save(artifactId);
    }

    async removeArtifact(artifactId: string): Promise<void> {
        await this._artifactIndex.remove(artifactId);
        const metas = await this._fileIndex.removeArtifact(artifactId);
        for (const meta of metas) {
            await this._fileStorage.remove(artifactId, meta);
        }
    }

    async moveInto(artifactId: string, fileInfo: FileInfo, filePath: string): Promise<void> {
        const meta = await this._fileIndex.save(artifactId, fileInfo);
        await this._fileStorage.moveInto(artifactId, meta, filePath);
    }

    async removeFile(artifactId: string, localPath: string): Promise<void> {
        const meta = await this._fileIndex.remove(artifactId, localPath);
        await this._fileStorage.remove(artifactId, meta);
    }

    async enumFiles(artifactId: string): Promise<FileMeta[]> {
        return await this._fileIndex.enum(artifactId);
    }

    async enumArtifacts(pattern: string, take: number | 'all', takeFrom: string | undefined): Promise<string[]> {
        if (takeFrom === undefined) {
            return await this._artifactIndex.enumStarts(pattern, take);
        } else {
            return await this._artifactIndex.enumNext(pattern, take, takeFrom);
        }
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

        const fileIndex = await FileIndex.open(path.join(root, 'file-index'), logger);
        const artifactIndex = await ArtifactIndex.open(path.join(root, 'artifact-index'), logger);
        const fileStore = await FileStorage.open(path.join(root, 'files'), logger);

        return new Storage(logger, fileIndex, fileStore, artifactIndex);
    }

    static async create(logger: Log): Promise<Storage> {
        return await this.createAt(path.resolve('store'), logger);
    }
}

export { Storage };
export default Storage;