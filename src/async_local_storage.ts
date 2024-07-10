import {Request, Response} from './functions';
import {NextFunction} from 'express';
import {satisfiedRequiredNodeJsVersionForLogExecutionID} from './options';
import type {AsyncLocalStorage} from 'node:async_hooks';

export interface ExecutionContext {
  executionId?: string;
  traceId?: string;
  spanId?: string;
}

let asyncLocalStorage: AsyncLocalStorage<ExecutionContext> | undefined;

export async function asyncLocalStorageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (satisfiedRequiredNodeJsVersionForLogExecutionID) {
    if (!asyncLocalStorage) {
      const asyncHooks = await import('node:async_hooks');
      asyncLocalStorage = new asyncHooks.AsyncLocalStorage();
    }

    asyncLocalStorage.run(
      {
        executionId: req.executionId,
        traceId: req.traceId,
        spanId: req.spanId,
      },
      () => {
        next();
      }
    );
  } else {
    // Skip for unsupported Node.js version.
    next();
    return;
  }
}

export function getCurrentContext(): ExecutionContext | undefined {
  if (!asyncLocalStorage) {
    return undefined;
  }
  return asyncLocalStorage.getStore();
}
