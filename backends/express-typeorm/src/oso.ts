
import { Relation, Oso, ForbiddenError, NotFoundError } from "oso";
import { getRepository, In, Not } from "typeorm";
import { Issue } from "./entities/Issue";
import { Org } from "./entities/Org";
import { OrgRole } from "./entities/OrgRole";
import { Repo } from "./entities/Repo";
import { RepoRole } from "./entities/RepoRole";
import { User } from "./entities/User";

export const oso = new Oso();

export async function initOso() {
    // set global exec/combine query functions
    oso.setDataFilteringQueryDefaults({
        combineQuery: combineQuery,
        buildQuery: buildQuery,
    });
    function makeMap(obj) {
        return new Map(Object.entries(obj));
    }
    oso.registerClass(Issue, {
        execQuery: execFromRepo(Issue),
        types: {
          id: Number,
          repo: new Relation('one', 'Repo', 'repoId', 'id')
        }
    });

    oso.registerClass(Org, {
        execQuery: execFromRepo(Org),
        types: {
          id: Number,
          base_repo_role: String,
          orgRoles: new Relation('many', 'OrgRole', 'id', 'orgId')
        }
    });

    oso.registerClass(OrgRole, {
        execQuery: execFromRepo(OrgRole),
        types: {
          id: Number,
          role: String,
          org: new Relation('one', 'Org', 'orgId', 'id'),
          user: new Relation('one', 'User', 'userId', 'id')
      }
    });

    oso.registerClass(Repo, {
        execQuery: execFromRepo(Repo),
        types: {
          id: Number,
          org: new Relation('one', 'Org', 'orgId', 'id'),
          issues: new Relation('many', 'Issue', 'id', 'repoId'),
          repoRoles: new Relation('many', 'RepoRole', 'id', 'repoId')
      }
    });

    oso.registerClass(RepoRole, {
        execQuery: execFromRepo(RepoRole),
        types: {
          id: Number,
          role: String,
          repo: new Relation('one', 'Repo', 'repoId', 'id'),
          user: User,
        }
    });

    oso.registerClass(User, {
        execQuery: execFromRepo(User),
        types: {
          id: Number,
          repoRoles: new Relation('many', 'RepoRole', 'id', 'userId'),
          orgRoles: new Relation('many', 'OrgRole', 'id', 'userId')
        }
    });

    await oso.loadFile("src/authorization.polar");
}


export function addEnforcer(req, _resp, next) {
    req.oso = oso;
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
            c.field = "id"
            c.value = c.kind == 'In' ? c.value.map(v => v.id) : c.value.id
        }

        if (c.kind === 'Eq') query[c.field] = c.value
        else if (c.kind === 'Neq') query[c.field] = Not(c.value)
        else if (c.kind === 'In') query[c.field] = In(c.value)
        else throw new Error(`Unknown constraint kind: ${c.kind}`);

        return query;
    };

    if (constraints.length == 0) return { id: Not(null) }; // FIXME(gw) hack to work with TypeORM query builder
    return constraints.reduce(constrain, {})
};


const combineQuery = (a: any, b: any) => {
    const listify = (x: any) => x instanceof Array ? x : [x];
    return listify(a).concat(listify(b));
};

const execFromRepo = (repo) => {
    return (q) => getRepository(repo).find({where: q})
}
