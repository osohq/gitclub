import { Request } from "express";
import { prisma } from "..";

export class RepoController {
    async all(request: Request) {
        // const org = await prisma.org.findUnique({ where: { id: request.params.orgId } });
        // await request.oso.authorize(request.user, "list_repos", org);
        const repoFilter = await request.oso.authorizedQuery(request.user, "read", prisma.repo);
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
            include: {
                org: true
            }
        });
        await request.oso.authorize(request.user, "read", repo);
        return repo
    }

    async save(request: Request, response) {
        const org = await prisma.org.findUnique({ where: { id: request.params.orgId } });
        await request.oso.authorize(request.user, "create_repos", org);
        const res = await prisma.repo.create({ data: { orgId: org.id, ...request.body } });
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        const repo = await prisma.repo.findFirst({
            where: {
                id: request.params.id, orgId: request.params.orgId
            },
            include: {
                org: true
            }
        });
        await request.oso.authorize(request.user, "delete", repo);
        await prisma.repo.delete({ where: { id: repo.id } });
    }
}
