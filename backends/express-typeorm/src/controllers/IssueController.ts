import { getRepository } from "typeorm";
import { Request } from "express";
import { Issue } from "../entities/Issue";

export class IssueController {

    private issueRepository = getRepository(Issue);

    async all(request: Request) {
        return this.issueRepository.find();
    }

    async one(request: Request) {
        return this.issueRepository.findOne(request.params.id);
    }

    async save(request: Request) {
        return this.issueRepository.save(request.body);
    }

    async remove(request: Request) {
        let userToRemove = await this.issueRepository.findOne(request.params.id);
        await this.issueRepository.remove(userToRemove);
    }

}