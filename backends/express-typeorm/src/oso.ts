import { Enforcer, Policy, NotFoundError, ForbiddenError } from "oso";
import { Field, Relationship } from "oso/dist/src/dataFiltering";
import { getRepository } from "typeorm";
import { Issue } from "./entities/Issue";
import { Org } from "./entities/Org";
import { OrgRole } from "./entities/OrgRole";
import { Repo } from "./entities/Repo";
import { RepoRole } from "./entities/RepoRole";
import { User } from "./entities/User";

export const policy = new Policy();

export async function initOso() {
    // set global exec/combine query functions
    policy.configureDataFiltering({
        execQuery: execQuery,
        combineQuery: combineQuery,
    });
    function makeMap(obj) {
        return new Map(Object.entries(obj));
    }
    const issueType = new Map();
    issueType.set('id', Number);
    issueType.set('repo', new Relationship('parent', 'Repo', 'repository_id', 'id'));
    policy.registerClass(Issue, {
        types: issueType,
        buildQuery: fromRepo(getRepository(Issue), 'issue'),
    });

    const orgType = new Map();
    orgType.set('id', Number);
    orgType.set('base_repo_role', String);
    orgType.set('orgRoles', new Relationship('parent', 'OrgRole', 'id', 'orgId'));
    policy.registerClass(Org, {
        types: orgType,
        buildQuery: fromRepo(getRepository(Org), 'org'),
    });

    const orgRoleFields = {
        id: Number,
        role: String,
        org: Org,
        user: User
    }
    policy.registerClass(OrgRole, {
        types: makeMap(orgRoleFields),
        buildQuery: fromRepo(getRepository(OrgRole), 'org_role'),
        execQuery: (q) => q.leftJoinAndSelect("org_role.org", "org").leftJoinAndSelect("org_role.user", "user").getMany()
    });

    const repoFiles = {
        id: Number,
        org: new Relationship('parent', 'Org', 'orgId', 'id'),
        issues: new Relationship('children', 'Issue', 'id', 'repository_id'),
        repoRoles: new Relationship('parent', 'RepoRole', 'id', 'repoId')
    };
    policy.registerClass(Repo, {
        types: makeMap(repoFiles),
        buildQuery: fromRepo(getRepository(Repo), 'repo'),
    });

    const repoRoleFields = {
        id: Number,
        role: String,
        repo: Repo,
        user: User,
    };
    policy.registerClass(RepoRole, {
        types: makeMap(repoRoleFields),
        buildQuery: fromRepo(getRepository(RepoRole), 'repo_role'),
        execQuery: (q) => q.leftJoinAndSelect("repo_role.repo", "repo").leftJoinAndSelect("repo_role.user", "user").getMany()

    });

    const userFields = {
        id: Number,
        repoRoles: new Relationship('children', 'RepoRole', 'id', 'userId'),
        orgRoles: new Relationship('children', 'OrgRole', 'id', 'userId')
    };
    policy.registerClass(User, {
        types: makeMap(userFields),
        buildQuery: fromRepo(getRepository(User), 'user'),
    });



    await policy.loadFile("src/authorization.polar");
}


export function addEnforcer(req, resp, next) {
    const enforcer = new Enforcer(policy);
    req.oso = enforcer;
    req.authorizeList = async (action, resourceList: Org[]) => {
        const result = []
        for (const resource of resourceList) {
            const allowed = await policy.isAllowed(req.user, action, resource);
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
    if (err instanceof NotFoundError) {
        res.status(404).send("Not found")
    } else if (err instanceof ForbiddenError) {
        res.status(403).send("Permission denied")
    } else {
        console.error(err.stack)
        res.status(500).send('Something broke!')
    }
}

var i = 0;
const gensym = (tag?: any) => `_${tag}_${i++}`;


const fromRepo = (repo: any, name: string) => {
    const constrain = (query: any, c: any) => {
        if (c.field === undefined) {
            c.field = "id"
            c.value = c.kind == 'In' ? c.value.map(v => v.id) : c.value.id
        }

        const sym = gensym(c.field);
        const varName = `${name}.${c.field}`
        var clause,
            rhs,
            param: any = {};

        if (c.value instanceof Field) {
            rhs = `${name}.${c.value.field}`;
        } else {
            rhs = c.kind == 'In' ? `(:...${sym})` : `:${sym}`;
            param[sym] = c.value;
        }

        if (c.kind === 'Eq') clause = `${varName} = ${rhs}`;
        else if (c.kind === 'Neq') clause = `${varName} <> ${rhs}`;
        else if (c.kind === 'In') clause = `${varName} IN ${rhs}`;
        else throw new Error(`Unknown constraint kind: ${c.kind}`);

        return query.andWhere(clause, param);
    };

    return (constraints: any) =>
        constraints.reduce(constrain, repo.createQueryBuilder(name)).printSql();
};

const execQuery = (q: any) => {
    return q.printSql().getMany();
}
const combineQuery = (a: any, b: any) => {
    // this is kind of bad but typeorm doesn't give you a lot of tools
    // for working with queries :(
    const whereClause = (sql: string) => /WHERE (.*)$/.exec(sql)![1];
    a = a.orWhere(whereClause(b.getQuery()), b.getParameters());
    return a.where(`(${whereClause(a.getQuery())})`, a.getParameters());
};

