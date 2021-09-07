import { Oso } from "oso";
import { getRepository, In, Not } from "typeorm";
import { Issue } from "./entities/Issue";
import { Org } from "./entities/Org";
import { OrgRole } from "./entities/OrgRole";
import { Repo } from "./entities/Repo";
import { RepoRole } from "./entities/RepoRole";
import { User } from "./entities/User";


class ForbiddenError implements Error {
    name: string;
    message: string;
    stack?: string;
}

export class NotFoundError implements Error {
    name: string;
    message: string;
    stack?: string;
}

export const oso = new Oso();

export async function initOso() {
    oso.registerClass(Org);
    oso.registerClass(Repo);
    oso.registerClass(Issue);
    oso.registerClass(User);
    await oso.loadFile("src/authorization.polar");
}



export function addEnforcer(req, resp, next) {
    req.oso = oso;

    // stand-ins for actual enforcement + data filtering APIs
    req.oso.authorize = async (actor, action, resource) => {
        const allowedRead = await oso.isAllowed(actor, "read", resource);
        if (!allowedRead) {
            throw new NotFoundError();
        }
        const allowed = await oso.isAllowed(actor, action, resource);
        if (!allowed) {
            throw new ForbiddenError();
        }
    }
    req.oso.authorizedQuery = async (actor, action, cls) => {
        const r = getRepository(cls);
        const allResources = await r.find();
        const result = []
        for (const resource of allResources) {
            const allowed = await oso.isAllowed(actor, action, resource);
            if (allowed) {
                result.push(resource);
            }
        }
        return {
            id: In(result.map(res => res.id))
        };
    }
    req.oso.authorizedResources = async (actor, action, cls) => {
        const r = getRepository(cls);
        const allResources = await r.find();
        const result = []
        for (const resource of allResources) {
            const allowed = await oso.isAllowed(actor, action, resource);
            if (allowed) {
                result.push(resource);
            }
        }
        return result
    }
    next()
}

export function errorHandler(err: Error, req, res, next) {
    console.log("in error handler");
    if (res.headersSent) {
        console.log("too late");
        return next(err)
    }
    if (err instanceof ForbiddenError) {
        res.status(404).send("Not found")
    } else if (err instanceof ForbiddenError) {
        res.status(403).send("Permission denied")
    } else {
        console.error(err)
        console.error(err.stack)
        res.status(500).send('Something broke!')
    }
}

const buildQuery = (constraints: any) => {
    const constrain = (query: any, c: any) => {
        if (c.field === undefined) {
            c.field = "id"
            c.value = c.kind == 'In' ? c.value.map(v => v.id) : c.value.id
        }

        if (c.kind === 'Eq') query[c.field] = c.value
        else if (c.kind === 'Neq') query[c.field] = Not(c.value)
        else if (c.kind === 'In') query[c.field] = In(c.value)
        else throw new Error(`Unknown constraint kind: ${c.kind}`);

        return query;
    };

    return constraints.reduce(constrain, {})
};


const combineQuery = (a: any, b: any) => {
    return [a, b]
};

const execFromRepo = (repo) => {
    return (q) => getRepository(repo).find(q)
}
