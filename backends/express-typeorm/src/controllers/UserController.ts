import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";
import { Repo } from "../entities/Repo";
import { NotFoundError } from "oso";
import { Issue } from "../entities/Issue";

export class UserController {
    private userRepository = getRepository(User);
    private repoRepository = getRepository(Repo);

    async one(request: Request) {
        const user = await this.userRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read_profile", user);
        return user;
    }

    async allRepos(request: Request) {
        const user = await this.userRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read_profile", user);
        return await request.oso.authorizedResources(user, "read", Repo);
    }

    async allIssues(request: Request) {
        const user = await this.userRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read_profile", user);
        return await request.oso.authorizedResources(user, "read", Issue);
    }
}
