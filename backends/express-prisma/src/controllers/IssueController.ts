import { Issue } from ".prisma/client";
import { Request } from "express";
import { prisma } from "..";



export class IssueController {
    async all(request: Request) {
        await request.oso.authorizeObj(request.user, "list_issues", { type: "Repo", id: request.params.repoId });

        const [_model, issueFilter, _] = await request.oso.authorizedQuery(request.user, "read", "Issue");
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
        const [_model, issueFilter, _] = await request.oso.authorizedQuery(request.user, "read", "Issue");
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
        await request.oso.authorizeObj(request.user, "create_issues", { type: "Repo", id: request.params.repoId });
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
        await request.oso.authorizeObj(request.user, "delete", { type: "Issue", id: issue.id });

        await prisma.issue.delete({ where: { id: issue.id } });
    }

}
