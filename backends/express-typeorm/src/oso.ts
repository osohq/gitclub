import { Enforcer, Policy, NotFoundError, ForbiddenError } from "oso";
import { Issue } from "./entities/Issue";
import { Org } from "./entities/Org";
import { Repo } from "./entities/Repo";
import { User } from "./entities/User";

export const policy = new Policy();

export async function initOso() {
    policy.registerClass(Org);
    policy.registerClass(Repo);
    policy.registerClass(Issue);
    policy.registerClass(User);
    await policy.loadFile("src/authorization.polar");
    // await policy.enableRoles();
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