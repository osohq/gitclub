import { Relation, Oso, ForbiddenError, NotFoundError } from "oso";
import { prisma } from ".";

export const oso = new Oso();

class Issue { model = prisma.issue }
class Org { model = prisma.org }
class OrgRole { model = prisma.orgRole }
class Repo { model = prisma.repo }
class RepoRole { model = prisma.repoRole }
class User { model = prisma.user }

function modelToClass(model) {
    switch (model) {
        case prisma.issue:
            return Issue
        case prisma.org:
            return Org
        case prisma.orgRole:
            return OrgRole
        case prisma.repo:
            return Repo
        case prisma.repoRole:
            return RepoRole
        case prisma.user:
            return User
        default:
            throw new Error(`unexpected model: ${model}`)
    }
}

const isaCheck = (name: string) => (i: any) => i !== undefined && "typename" in i && i.typename == name;

export async function initOso() {
    // set global exec/combine query functions
    oso.setDataFilteringQueryDefaults({
        combineQuery: combineQuery,
        buildQuery: buildQuery,
    });
    oso.registerClass(Issue, {
        isaCheck: isaCheck('Issue'),
        execQuery: (q) => prisma.issue.findMany({ where: q, include: { repo: true } }),
        fields: {
            id: Number,
            repo: new Relation('one', 'Repo', 'repoId', 'id')
        }
    });

    oso.registerClass(Org, {
        isaCheck: isaCheck('Org'),
        execQuery: execFromModel(prisma.org),
        fields: {
            id: Number,
            base_repo_role: String,
        }
    });

    oso.registerClass(OrgRole, {
        isaCheck: isaCheck('OrgRole'),
        execQuery: (q) => prisma.orgRole.findMany({ where: q, include: { org: true, user: true } }),
        fields: {
            id: Number,
            role: String,
            org: new Relation('one', 'Org', 'orgId', 'id'),
            user: new Relation('one', 'User', 'userId', 'id')
        }
    });

    oso.registerClass(Repo, {
        isaCheck: isaCheck('Repo'),
        execQuery: (q) => prisma.repo.findMany({ where: q, include: { org: true } }),
        fields: {
            id: Number,
            org: new Relation('one', 'Org', 'orgId', 'id'),
        }
    });

    oso.registerClass(RepoRole, {
        isaCheck: isaCheck('RepoRole'),
        execQuery: (q) => prisma.repoRole.findMany({ where: q, include: { repo: true, user: true } }),
        fields: {
            id: Number,
            role: String,
            repo: new Relation('one', 'Repo', 'repoId', 'id'),
            user: User,
        }
    });

    oso.registerClass(User, {
        isaCheck: isaCheck('User'),
        execQuery: (q) => prisma.user.findMany({ where: q, include: { repoRole: { include: { repo: true } }, orgRole: { include: { org: true } } } }),
        fields: {
            id: Number,
            repoRole: new Relation('many', 'RepoRole', 'id', 'userId'),
            orgRole: new Relation('many', 'OrgRole', 'id', 'userId')
        }
    });

    await oso.loadFiles(["src/authorization.polar"]);
}

export function addEnforcer(req, _resp, next) {
    req.oso = oso;
    function wrapFn(fn) {
        return async function (actor, action, model) {
            var cls = model;
            if (!("prototype" in model)) {
                cls = modelToClass(model)
            }
            const res = await fn.call(req.oso, actor, action, cls);
            // console.log(fn, cls, JSON.stringify(res, null, 2))
            return res
        }
    }
    req.oso.authorizedQuery = wrapFn(req.oso.authorizedQuery);
    req.oso.authorizedResources = wrapFn(req.oso.authorizedResources);
    next()
}

export function errorHandler(err: Error, req, res, next) {
    if (res.headersSent) {
        console.error("attempting to handle an error after the headers were sent. This is usually a bug.");
        return next(err)
    }
    if (err instanceof NotFoundError) {
        res.status(404).send("Not found")
    } else if (err instanceof ForbiddenError) {
        res.status(403).send("Permission denied")
    } else {
        console.error(err.stack)
        res.status(500).send('Something broke!')
    }
}

const buildQuery = (constraints: any) => {
    const constrain = (query: any, c: any) => {
        if (c.field === undefined) {
            // console.log(c);
            c.field = "id"
            c.value = c.kind == 'In' ? c.value.map(v => v.id) : c.value.id
        }

        let q;

        if (c.kind === 'Eq') q = { [c.field]: c.value }
        else if (c.kind === 'Neq') q = { NOT: { [c.field]: c.value } }
        else if (c.kind === 'In') query[c.field] = { in: c.value }
        else throw new Error(`Unknown constraint kind: ${c.kind}`);

        return { AND: [query, q] };
    };

    const q = constraints.reduce(constrain, {});
    return q;
};


const combineQuery = (a: any, b: any) => {
    return {
        OR: [a, b]
    }
};

const execFromModel = (model) => {
    return (q) => model.findMany({ where: q })
}
