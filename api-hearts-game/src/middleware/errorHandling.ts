import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
    console.error(err);
    res.status(500).json({ message: err.message });
}

export const AsyncWrapper = (fn: Function) =>
    (req: Request, res: Response, next: NextFunction): Promise<any> =>
        Promise
            .resolve(fn(req, res, next))
            .catch(next);
