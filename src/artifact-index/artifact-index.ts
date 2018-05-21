import * as levelup from 'levelup';
import * as leveldown from 'leveldown';
import * as encodingDown from 'encoding-down';
import * as path from 'path';
import { FileUtils } from '../utils/file-utils';
import { Log } from '../logging';


class ArtifactIndex {
    private _db: any;
    private _root: string;
    private _logger: Log;

    private constructor(root: string, logger: Log) {
        this._root = root;
        this._logger = logger;
        const dbpath = path.join(this._root);

        this._db = levelup(encodingDown.default(leveldown.default(dbpath), {
        }));
    }

    async save(artifactId: string): Promise<void> {
        await this._db.put(artifactId, null);
    }

    async remove(artifactId: string): Promise<void> {
        await this._db.del(artifactId);
    }

    async close(): Promise<void> {
        await this._db.close();
    }

    async enumStarts(pattern: string, take: number | 'all'): Promise<string[]> {
        const options = {
            gte: `${pattern}`,
            lte: `${pattern}\uffff`,
            limit: take === 'all' ? -1 : take
        };
        return await this.enum(options, take);
    }

    async enumNext(pattern: string, take: number | 'all'): Promise<string[]> {
        const options = {
            gt: `${pattern}`,
            lte: `${pattern}\uffff`,
            limit: take === 'all' ? -1 : take
        };
        return await this.enum(options, take);
    }

    private async enum(options: any, take: number | 'all'): Promise<string[]> {
        const read = this._db.createKeyStream(options);

        return await new Promise<string[]>((resolve, reject) => {
            let result: string[] = [];

            read.on('data', (key: any) => {
                result.push(key);
            });
            read.on('end', () => resolve(result));
            read.on('close', () => resolve(result));
            read.on('error', reject);
        });
    }

    static async open(root: string, logger: Log) {
        logger.info({ path: root }, 'initializing artifact index');
        await FileUtils.mkdir(root);
        return new ArtifactIndex(root, logger);
    }
}

export { ArtifactIndex }
export default ArtifactIndex;