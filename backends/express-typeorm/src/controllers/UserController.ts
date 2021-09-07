import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { User } from "../entities/User";

export class UserController {
    private userRepository = getRepository(User);

    async one(request: Request) {
        const user = await this.userRepository.findOne(request.params.id);
        // TODO: update this to actual read action logic?
        await request.oso.authorize(request.user, "read_profile", user, { readAction: "read_profile" });
        return user;
    }
}