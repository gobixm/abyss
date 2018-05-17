import { Storage } from './storage';
import { Log } from './logging';

class Abyss {
    private _logger: Log;
    private _storage: Storage;
    private _initialized: boolean = false;

    async init(logger: Log): Promise<void> {
        this._logger = logger;

        this._logger.info('initializing abyss')
        this._storage = await Storage.create(logger);
        this._initialized = true;
    }

    get storage() {
        return this._storage;
    }
}

const abyss = new Abyss();

export { abyss };
export default abyss;