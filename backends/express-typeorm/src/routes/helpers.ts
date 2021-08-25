import { Request, Response } from "express";
import { NotFoundError } from "oso";

export function addRoutes(router, routes) {
    // register express routes from defined application routes
    routes.forEach(route => {
        (router as any)[route.method](route.route, (req: Request, res: Response, next) => {
            const result = (new (route.controller as any))[route.action](req, res, next);
            if (result instanceof Promise) {
                result.then(result => result !== null && result !== undefined ? res.send(result) : next(new NotFoundError())).catch(next);
            } else if (result !== null && result !== undefined) {
                res.json(result);
            }
        });
    });

}