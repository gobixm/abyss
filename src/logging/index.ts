import * as pino from 'pino';

export type Log = pino.Logger;

export function createLogger(): Log {
    return pino({
        level: 'trace',
        prettyPrint: true,
        timestamp: pino.stdTimeFunctions.slowTime,
    })
}