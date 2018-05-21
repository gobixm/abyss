import { ArtifactIndex } from '../src/artifact-index';
import * as del from 'del';
import * as pino from 'pino';

let index: ArtifactIndex;

beforeEach(async () => {
    await del('test-data');
    index = await ArtifactIndex.open('test-data', pino({ level: 'warn' }));
});

afterEach(async () => {
    await index.close();
    await del('test-data');
});

it('enumStarts return sorted', async () => {
    await index.save('c');
    await index.save('b');
    await index.save('a');

    let result = await index.enumStarts('', 'all');

    expect(result).toEqual(['a', 'b', 'c']);
});

it('enumStarts pattern', async () => {
    await index.save('a');
    await index.save('aa1');
    await index.save('aa2');
    await index.save('b');

    let result = await index.enumStarts('aa1', 'all');

    expect(result).toEqual(['aa1']);
});

it('enumStarts limit', async () => {
    await index.save('aa');
    await index.save('ab');
    await index.save('ac');

    let result = await index.enumStarts('a', 2);

    expect(result).toEqual(['aa', 'ab']);
});

it('enumNext pattern tail', async () => {
    await index.save('aa');
    await index.save('ab');
    await index.save('ac');
    await index.save('aca');
    await index.save('acb');
    await index.save('b');

    let result = await index.enumNext('ac', 'all');

    expect(result).toEqual(['aca', 'acb']);
});