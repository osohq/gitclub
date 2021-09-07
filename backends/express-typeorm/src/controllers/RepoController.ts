import { getRepository } from "typeorm";
import { Request } from "express";
import { Repo } from "../entities/Repo";

export class RepoController {

    private repoRepository = getRepository(Repo);

    async all(request: Request) {
        const repoFilter = await request.oso.authorizedQuery(request.user, "read", Repo);
        const repos = await this.repoRepository.find({ orgId: request.params.id, ...repoFilter });
        return repos;
    }

    async one(request: Request) {
        const repo = await this.repoRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read", repo);
        return repo
    }

    async save(request: Request) {
        const repo = await this.repoRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "update", repo);
        return this.repoRepository.save(repo, { reload: true, ...request.body });
    }

    async remove(request: Request) {
        const repoToRemove = await this.repoRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "delete", repoToRemove);
        await this.repoRepository.remove(repoToRemove);
    }

}