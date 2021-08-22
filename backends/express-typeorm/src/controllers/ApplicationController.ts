import { Request } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/User";


export class ApplicationController {
    protected userRepository = getRepository(User);

    async currentUser(request: Request): Promise<User | null> {
        const userId = request.session.userId;
        if (userId) {
            return await this.userRepository.findOne(userId);
        }
    }
}