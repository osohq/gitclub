import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Repo } from "../entities/Repo";
import { RepoRole } from "../entities/RepoRole";

export class RepoController {

    private repoRepository = getRepository(Repo);
    private repoRoleRepository = getRepository(RepoRole);

    async all(request: Request) {
        return this.repoRepository.find({
            org: {
                id: request.params.orgId
            }
        });
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