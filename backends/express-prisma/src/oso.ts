import { Relation, Oso, ForbiddenError, NotFoundError } from "oso";
import { prisma } from ".";
import { prismaAdapter } from "./prisma";

export const oso = new Oso();

class Issue { model = prisma.issue }
class Org { model = prisma.org }
class OrgRole { model = prisma.orgRole }
class Repo { model = prisma.repo }
class RepoRole { model = prisma.repoRole }
class User { model = prisma.user }

const isaCheck = (name: string) => (i: any) => i !== undefined && "typename" in i && i.typename == name;

export async function initOso() {
    oso.setDataFilteringAdapter(prismaAdapter(prisma))
    oso.registerClass(Issue, {
        isaCheck: isaCheck('Issue'),
        fields: {
            id: Number,
            repo: new Relation('one', 'Repo', 'repoId', 'id'),
        }
    });

    oso.registerClass(Org, {
        isaCheck: isaCheck('Org'),
        fields: {
            id: Number,
            base_repo_role: String,
            orgRole: new Relation('many', 'OrgRole', 'id', 'orgId'),
        }
    });

    oso.registerClass(OrgRole, {
        isaCheck: isaCheck('OrgRole'),
        fields: {
            id: Number,
            role: String,
            org: new Relation('one', 'Org', 'orgId', 'id'),
            user: new Relation('one', 'User', 'userId', 'id')
        }
    });

    oso.registerClass(Repo, {
        isaCheck: isaCheck('Repo'),
        fields: {
            id: Number,
            org: new Relation('one', 'Org', 'orgId', 'id'),
            repoRole: new Relation('many', 'RepoRole', 'id', 'repoId'),
        }
    });

    oso.registerClass(RepoRole, {
        isaCheck: isaCheck('RepoRole'),
        fields: {
            id: Number,
            role: String,
            repo: new Relation('one', 'Repo', 'repoId', 'id'),
            user: new Relation('one', 'User', 'userId', 'id')
        }
    });

    oso.registerClass(User, {
        isaCheck: isaCheck('User'),
        fields: {
            id: Number,
            repoRole: new Relation('many', 'RepoRole', 'id', 'userId'),
            orgRole: new Relation('many', 'OrgRole', 'id', 'userId'),
        }
    });

    await oso.loadFiles(["src/authorization.polar"]);
}

export function addEnforcer(req, _resp, next) {
    req.oso = oso;

    req.oso.authorizeObj = async function (actor, action, { type, id }) {
        const [model, _query, includes] = await req.oso.authorizedQuery.call(req.oso, actor, action, type);
        const params = {
            where: { id },
            ...(Object.keys(includes).length == 0 ? {} : { include: includes })
        }
        const resource = await prisma[model].findUnique(params);
        return await req.oso.authorize(actor, action, resource);
    }
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
