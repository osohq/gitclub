import { getRepository } from "typeorm";
import { Request } from "express";
import { Issue } from "../entities/Issue";

export class IssueController {

    private issueRepository = getRepository(Issue);

    async all(request: Request) {
        const issueFilter = await request.oso.authorizedQuery(request.user, "read", Issue);
        return await this.issueRepository.find({ orgId: request.params.id, repoId: request.params.repoId, ...issueFilter });
    }

    async one(request: Request) {
        const issue = await this.issueRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read", issue);
        return this.issueRepository.findOne(request.params.id);
    }

    async save(request: Request) {
        const issue = await this.issueRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "update", issue);
        return this.issueRepository.save(issue, request.body);
    }

    async remove(request: Request) {
        const issue = await this.issueRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "delete", issue);
        await this.issueRepository.remove(issue);
    }

}