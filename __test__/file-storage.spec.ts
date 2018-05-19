import { FileMeta } from './../src/model/file-meta';
import { FileInfo } from './../src/model/file-info';
import { FileStorage } from '../src/file-storage';
import * as fsPromise from 'fs/promises';
import * as fs from 'fs';
import * as del from 'del';
import * as pino from 'pino';
import * as path from 'path';
import { Readable } from 'stream';

let store: FileStorage;

beforeEach(async () => {
    await del('test-data');
    store = await FileStorage.open('test-data', pino({ level: 'warn' }));
});

afterEach(async () => {
    await del('test-data');
});

async function saveFile(artifact: string, content: string): Promise<FileMeta> {
    let fileInfo: FileInfo = {
        created: new Date(42),
        path: 'path'
    };
    let fileMeta: FileMeta = {
        fileInfo: fileInfo,
        internalPath: 'internal-path'
    }

    const tempPath = await fsPromise.mkdtemp('test-data/test');
    const sourceFilePath = path.join(tempPath, 'test');
    await fsPromise.writeFile(sourceFilePath, content);
    await store.moveInto('artifact', fileMeta, sourceFilePath);
    return fileMeta;
}

it('moveInto file moved from source', async () => {
    let fileInfo: FileInfo = {
        created: new Date(42),
        path: 'path'
    };
    let fileMeta: FileMeta = {
        fileInfo: fileInfo,
        internalPath: 'internal-path'
    }

    const tempPath = await fsPromise.mkdtemp('test-data/test');
    const sourceFilePath = path.join(tempPath, 'test');
    await fsPromise.writeFile(sourceFilePath, 'test data');

    await store.moveInto('artifact', fileMeta, sourceFilePath);

    const stream = await store.openRead('artifact', fileMeta);
    stream.setEncoding('utf8');

    await new Promise((resolve, reject) => {
        stream.on('data', data => expect(data).toEqual('test data'));
        stream.on('end', resolve);
    })

    await expect(fsPromise.access(sourceFilePath)).rejects.toBeTruthy();
});

it('save file persisted', async () => {
    let fileInfo: FileInfo = {
        created: new Date(42),
        path: 'path'
    };
    let fileMeta: FileMeta = {
        fileInfo: fileInfo,
        internalPath: 'internal-path'
    }

    const tempPath = await fsPromise.mkdtemp('test-data/test');
    const sourceFilePath = path.join(tempPath, 'test');
    await fsPromise.writeFile(sourceFilePath, 'test data');
    const sourceStream = fs.createReadStream(sourceFilePath);

    await store.save('artifact', fileMeta, sourceStream);

    const stream = await store.openRead('artifact', fileMeta);
    stream.setEncoding('utf8');

    await new Promise((resolve, reject) => {
        stream.on('data', data => expect(data).toEqual('test data'));
        stream.on('end', resolve);
    })
});

it('remove file deleted', async () => {
    const artifact = 'artifact';
    const meta = await saveFile(artifact, 'test data');

    await store.remove(artifact, meta);

    await expect(store.openRead(artifact, meta)).rejects.toBeTruthy();
});