import { getRepository } from "typeorm";
import { Request } from "express";
import { Issue } from "../entities/Issue";
import { Repo } from "../entities/Repo";

export class IssueController {

    private repoRepository = getRepository(Repo);
    private issueRepository = getRepository(Issue);

    async all(request: Request) {
        const repo = await this.repoRepository.findOneOrFail({ id: request.params.repoId });
        await request.oso.authorize(request.user, "list_issues", repo);
        const issueFilter = await request.oso.authorizedQuery(request.user, "read", Issue);
        return await this.issueRepository.createQueryBuilder()
            .where({ repoId: request.params.repoId })
            .andWhere(issueFilter)
            .getMany();
    }

    async one(request: Request) {
        const issue = await this.issueRepository.findOneOrFail({
            id: request.params.id,
            repoId: request.params.repoId,
        });

        await request.oso.authorize(request.user, "read", issue);
        return issue;
    }

    async save(request: Request, response) {
        const repo = await this.repoRepository.findOneOrFail({ id: request.params.repoId });
        await request.oso.authorize(request.user, "create_issues", repo);
        const issue = {
            ...request.body,
            creator: request.user,
            repo
        };
        const res = await this.issueRepository.save(issue);
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        const issue = await this.issueRepository.findOneOrFail({
            id: request.params.id,
            repoId: request.params.repoId,
        });
        await request.oso.authorize(request.user, "delete", issue);
        await this.issueRepository.remove(issue);
    }

    async close(request: Request, response) {
        const issue = await this.issueRepository.findOneOrFail({
            id: request.params.id,
            repoId: request.params.repoId,
        });
        await request.oso.authorize(request.user, "close", issue);
        await this.issueRepository.update(issue.id, { closed: true });
        return issue;
    }

}
