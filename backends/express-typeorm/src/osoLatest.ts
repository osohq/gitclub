// Uncomment and import when using Oso on main.

// import { Relationship, Oso, ForbiddenError, NotFoundError } from "oso";
// import { getRepository, In, Not } from "typeorm";
// import { Issue } from "./entities/Issue";
// import { Org } from "./entities/Org";
// import { OrgRole } from "./entities/OrgRole";
// import { Repo } from "./entities/Repo";
// import { RepoRole } from "./entities/RepoRole";
// import { User } from "./entities/User";

// export const oso = new Oso();

// export async function initOso() {
//     // set global exec/combine query functions
//     oso.configureDataFiltering({
//         combineQuery: combineQuery,
//         buildQuery: buildQuery,
//     });
//     function makeMap(obj) {
//         return new Map(Object.entries(obj));
//     }
//     const issueType = new Map();
//     issueType.set('id', Number);
//     issueType.set('repo', new Relationship('parent', 'Repo', 'repoId', 'id'));
//     oso.registerClass(Issue, {
//         types: issueType,
//         execQuery: execFromRepo(Issue),
//     });

//     const orgType = new Map();
//     orgType.set('id', Number);
//     orgType.set('base_repo_role', String);
//     orgType.set('orgRoles', new Relationship('chlidren', 'OrgRole', 'id', 'orgId'));
//     oso.registerClass(Org, {
//         types: orgType,
//         execQuery: execFromRepo(Org),
//     });

//     const orgRoleFields = {
//         id: Number,
//         role: String,
//         org: Org,
//         user: User
//     }
//     oso.registerClass(OrgRole, {
//         types: makeMap(orgRoleFields),
//         execQuery: execFromRepo(OrgRole),
//     });

//     const repoFiles = {
//         id: Number,
//         org: new Relationship('parent', 'Org', 'orgId', 'id'),
//         issues: new Relationship('children', 'Issue', 'id', 'repoId'),
//         repoRoles: new Relationship('parent', 'RepoRole', 'id', 'repoId')
//     };
//     oso.registerClass(Repo, {
//         types: makeMap(repoFiles),
//         execQuery: execFromRepo(Repo),
//     });

//     const repoRoleFields = {
//         id: Number,
//         role: String,
//         repo: Repo,
//         user: User,
//     };
//     oso.registerClass(RepoRole, {
//         types: makeMap(repoRoleFields),
//         execQuery: execFromRepo(RepoRole),
//     });

//     const userFields = {
//         id: Number,
//         repoRoles: new Relationship('children', 'RepoRole', 'id', 'userId'),
//         orgRoles: new Relationship('children', 'OrgRole', 'id', 'userId')
//     };
//     oso.registerClass(User, {
//         types: makeMap(userFields),
//         execQuery: execFromRepo(User),
//     });

//     await oso.loadFile("src/authorization.polar");
// }


// export function addEnforcer(req, _resp, next) {
//     req.oso = oso;
//     next()
// }

// export function errorHandler(err: Error, req, res, next) {
//     console.log("in error handler");
//     if (res.headersSent) {
//         console.log("too late");
//         return next(err)
//     }
//     if (err instanceof NotFoundError) {
//         res.status(404).send("Not found")
//     } else if (err instanceof ForbiddenError) {
//         res.status(403).send("Permission denied")
//     } else {
//         console.error(err.stack)
//         res.status(500).send('Something broke!')
//     }
// }

// const buildQuery = (constraints: any) => {
//     const constrain = (query: any, c: any) => {
//         if (c.field === undefined) {
//             c.field = "id"
//             c.value = c.kind == 'In' ? c.value.map(v => v.id) : c.value.id
//         }

//         if (c.kind === 'Eq') query[c.field] = c.value
//         else if (c.kind === 'Neq') query[c.field] = Not(c.value)
//         else if (c.kind === 'In') query[c.field] = In(c.value)
//         else throw new Error(`Unknown constraint kind: ${c.kind}`);

//         return query;
//     };

//     return constraints.reduce(constrain, {})
// };


// const combineQuery = (a: any, b: any) => {
//     return [a, b]
// };

// const execFromRepo = (repo) => {
//     return (q) => getRepository(repo).find(q)
// }
