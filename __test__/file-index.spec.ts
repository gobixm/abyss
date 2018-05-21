import { FileInfo } from './../src/model/file-info';
import { FileIndex } from '../src/file-index';
import * as del from 'del';
import * as pino from 'pino';

let index: FileIndex;

beforeEach(async () => {
    await del('test-data');
    index = await FileIndex.open('test-data', pino({ level: 'warn' }));
});

afterEach(async () => {
    await index.close();
    await del('test-data');
});

it('save-get same field', async () => {
    let fileInfo: FileInfo = {
        created: new Date(42),
        path: 'path'
    };
    let saved = await index.save('artifact', fileInfo);
    let retrieved = await index.get('artifact', fileInfo.path);

    expect(saved.fileInfo).toEqual(fileInfo);
    expect(retrieved.fileInfo).toEqual(fileInfo);
});

it('remove record deleted', async () => {
    let fileInfo: FileInfo = {
        created: new Date(42),
        path: 'path'
    };
    let saved = await index.save('artifact', fileInfo);
    let removed = await index.remove('artifact', 'path');

    await expect(index.get('artifact', fileInfo.path)).rejects.toBeTruthy();
    expect(saved.fileInfo).toEqual(fileInfo);
    expect(removed.fileInfo).toEqual(fileInfo);
});

it('remove records deleted with artifact', async () => {
    let fileInfo1: FileInfo = {
        created: new Date(42),
        path: 'path1'
    };
    let fileInfo2: FileInfo = {
        created: new Date(42),
        path: 'path2'
    };
    let saved1 = await index.save('artifact', fileInfo1);
    let saved2 = await index.save('artifact', fileInfo2);
    let removed = await index.removeArtifact('artifact');

    await expect(index.get('artifact', fileInfo1.path)).rejects.toBeTruthy();
    await expect(index.get('artifact', fileInfo2.path)).rejects.toBeTruthy();
});

it('enum all records inside artifact', async () => {
    let fileInfo1: FileInfo = {
        created: new Date(42),
        path: 'path1'
    };
    let fileInfo2: FileInfo = {
        created: new Date(42),
        path: 'path2'
    };
    await index.save('artifact1', fileInfo1);
    await index.save('artifact1', fileInfo2);
    await index.save('artifact2', fileInfo1);

    let retrieved1 = await index.enum('artifact1');
    let retrieved2 = await index.enum('artifact2');

    expect(retrieved1.map(m => m.fileInfo)).toContainEqual(fileInfo1);
    expect(retrieved1.map(m => m.fileInfo)).toContainEqual(fileInfo2);

    expect(retrieved2.map(m => m.fileInfo)).toContainEqual(fileInfo1);
    expect(retrieved2.map(m => m.fileInfo)).not.toContainEqual(fileInfo2);
}); 