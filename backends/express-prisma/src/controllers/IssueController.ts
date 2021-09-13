import { Issue } from ".prisma/client";
import { Request } from "express";
import { prisma } from "..";



export class IssueController {
    async all(request: Request) {
        const repo = await prisma.repo.findUnique({ where: { id: request.params.repoId } });
        await request.oso.authorize(request.user, "list_issues", repo);
        const issueFilter = await request.oso.authorizedQuery(request.user, "read", prisma.issue);
        return await prisma.issue.findMany(
            {
                where: {
                    AND: [
                        issueFilter,
                        {
                            repoId: request.params.repoId
                        }
                    ]
                }
            }
        )
    }

    async one(request: Request) {
        const issueFilter = await request.oso.authorizedQuery(request.user, "read", prisma.issue);
        const issue = await prisma.issue.findFirst({
            where: {
                AND: [{
                    id: request.params.id,
                    repoId: request.params.repoId,
                },
                    issueFilter
                ]
            }
        });
        return issue;
    }

    async save(request: Request, response) {
        const repo = await prisma.repo.findMany({ where: { id: request.params.repoId } });
        // await request.oso.authorize(request.user, "create_issues", repo);
        const res = await prisma.issue.create({ data: request.body });
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        const issue: Issue = await prisma.issue.findFirst({
            where: {
                id: request.params.id,
                repoId: request.params.repoId,
            }
        });
        await request.oso.authorize(request.user, "delete", issue);
        await prisma.issue.delete({ where: { id: issue.id } });
    }

}
