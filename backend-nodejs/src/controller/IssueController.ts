import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Issue } from "../entity/Issue";

export class IssueController {

    private issueRepository = getRepository(Issue);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.issueRepository.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.issueRepository.findOne(request.params.id);
    }

    async save(request: Request, response: Response, next: NextFunction) {
        return this.issueRepository.save(request.body);
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        let userToRemove = await this.issueRepository.findOne(request.params.id);
        await this.issueRepository.remove(userToRemove);
    }

}