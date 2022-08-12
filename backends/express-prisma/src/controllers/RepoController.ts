import { Request } from "express";
import { prisma } from "..";

export class RepoController {
    async all(request: Request) {
        // const org = await prisma.org.findUnique({ where: { id: request.params.orgId } });
        // await request.oso.authorize(request.user, "list_repos", org);
        const [_model, repoFilter, _] = await request.oso.authorizedQuery(request.user, "read", "Repo");
        console.log(JSON.stringify(repoFilter, null, 2))
        return prisma.repo.findMany({
            where: {
                AND: [repoFilter, {
                    orgId: request.params.orgId
                }]
            }
        });
    }

    async one(request: Request) {
        const repo = await prisma.repo.findFirst({
            where: {
                id: request.params.id, orgId: request.params.orgId
            },
        });
        await request.oso.authorizeObj(request.user, "read", { type: "Repo", id: repo.id });
        return repo
    }

    async save(request: Request, response) {
        await request.oso.authorizeObj(request.user, "create_repos", { type: "Org", id: request.params.orgId });
        const res = await prisma.repo.create({ data: { orgId: request.params.orgId, ...request.body } });
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        await request.oso.authorize(request.user, "delete", { type: "Repo", id: request.params.id });
        await prisma.repo.delete({ where: { id: request.params.id } });
    }
}
