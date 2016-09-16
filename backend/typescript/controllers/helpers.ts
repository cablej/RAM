import {logger} from '../logger';
import {Response, Request} from 'express';
import {ErrorResponse, SearchResult, HrefValue} from '../../../commons/api';
import * as _ from 'lodash';
import * as mu from 'mu2';
import MappedError = ExpressValidator.MappedError;

export const REGULAR_CHARS = '^([A-Za-z0-9 +&\'\*\-]+)?$';

mu.root = __dirname + '/../../views';

export function sendHtml<T>(res: Response, view: string) {
    'use strict';
    return (doc: T): T => {
        if (doc) {
            res.status(200);
            res.setHeader('Content-Type', 'text/html');
            mu.clearCache(view);
            let stream = mu.compileAndRender(view, doc);
            stream.pipe(res);
        }
        return doc;
    };
}

export function sendResource<T>(res: Response) {
    'use strict';
    return (doc: T): T => {
        if (doc) {
            res.status(200);
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(doc, null, 4));
        }
        return doc;
    };
}

export function sendList<T extends HrefValue<U>|U, U>(res: Response) {
    'use strict';
    return async(results: Promise<T>[]): Promise<T[]> => {
        const resolvedResults = await Promise.all<T>(results);
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resolvedResults, null, 4));
        return resolvedResults;
    };
}

export function sendSearchResult<T extends HrefValue<U>, U>(res: Response) {
    'use strict';
    return async(results: SearchResult<Promise<T>>): Promise<SearchResult<T>> => {
        const resolvedResults = new SearchResult<T>(
            results.page,
            results.totalCount,
            results.pageSize,
            await Promise.all<T>(results.list)
        );
        res.status(200);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(resolvedResults, null, 4));
        return resolvedResults;
    };
}

export function validateReqSchema<T>(req: Request, schema: Object): Promise<Request> {
    'use strict';
    return new Promise<Request>((resolve, reject) => {
        req.check(schema);
        const errors = req.validationErrors(false);
        if (errors) {
            const errorArray = errors as Array<MappedError>;
            const errorMsgs = errorArray.map((e) => e.msg);
            reject(errorMsgs);
        } else {
            resolve(req);
        }
    });
}

type ValidationError = {
    errors: { [index: string]: ValidationError };
    message: string;
}

// todo move this to message bundle
const errorMessages: {[key: string]: string} = {
    '401': 'Not logged in.',
    '403': 'Can\'t access the requested resource.',
    '404': 'Can\'t find the requested resource.',
    '500': 'Internal Server Error.'
};

/* tslint:disable:max-func-body-length */
export function sendError<T>(res: Response) {
    'use strict';
    return (error: string | Error | ValidationError | string[]) => {
        logger.error(error.toString());
        if (error instanceof Error) {
            logger.error((error as Error).stack);
        }
        switch (error.constructor.name) {
            case 'Array':
                res.status(400);
                res.json(new ErrorResponse(error as string[]));
                break;
            case 'String':
                res.status(500);
                res.json(new ErrorResponse(error as string));
                break;
            case 'MongooseError':
                res.status(400);
                res.json(new ErrorResponse(
                    _.values<string>(_.mapValues((error as ValidationError).errors, (v) => v.message))
                ));
                break;
            case 'Error':
                logger.error((error as Error).stack);
                let message = (error as Error).message;
                if (!message) {
                    res.status(500);
                    res.json(new ErrorResponse(errorMessages['500']));
                } else {
                    let status: number;
                    let actualMessage: string;
                    if (message.indexOf(':') !== -1) {
                        status = parseInt(message.split(':')[0]);
                        actualMessage = message.split(':')[1];
                    } else {
                        status = parseInt(message);
                        if (isNaN(status)) {
                            status = 500;
                            actualMessage = message;
                        } else {
                            actualMessage = errorMessages[message];
                        }
                    }
                    res.status(status);
                    res.json(new ErrorResponse(actualMessage));
                }
                break;
            default:
                res.status(500);
                res.json(new ErrorResponse(error.toString()));
                break;
        }
    };
}

export function sendNotFoundError<T>(res: Response) {
    'use strict';
    return (doc: T): T => {
        if (!doc) {
            res.status(404);
            res.json(new ErrorResponse(errorMessages['404']));
        }
        return doc;
    };
}