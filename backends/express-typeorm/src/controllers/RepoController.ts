import { getRepository } from "typeorm";
import { Request } from "express";
import { Repo } from "../entities/Repo";
import { Oso } from "oso";

export class RepoController {

    private repoRepository = getRepository(Repo);

    async all(request: Request) {
        const repoFilter = await request.oso.authorizedQuery(request.user, "read", Repo);
        const repos = await this.repoRepository.find({ orgId: request.params.id, ...repoFilter });
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