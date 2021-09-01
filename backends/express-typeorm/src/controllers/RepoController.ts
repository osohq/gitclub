import { getRepository } from "typeorm";
import { Request } from "express";
import { Repo } from "../entities/Repo";

export class RepoController {

    private repoRepository = getRepository(Repo);

    async all(request: Request) {
        const repoFilter = await request.oso.authorizedResources(request.user, "read", Repo);
        const repos = await repoFilter.andWhere('repo.org.id = :orgId', { orgId: request.params.id }).getMany();
        return repos;
    }

    async one(request: Request) {
        return this.repoRepository.findOne(request.params.id);
    }

    async save(request: Request) {
        return this.repoRepository.save(request.body);
    }

    async remove(request: Request) {
        let userToRemove = await this.repoRepository.findOne(request.params.id);
        await this.repoRepository.remove(userToRemove);
    }

}