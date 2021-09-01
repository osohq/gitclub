import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entities/User";

export class SessionController {
    private userRepository = getRepository(User);

    async get(request: Request, res: Response) {
        const user = request.user;
        if (user === undefined) {
            return res.status(401).send(request.session);
        }
        return res.status(200).json(user);
    }

    async create(request: Request, res: Response) {
        const payload = request.body;
        if (payload.email === undefined) {
            return res.status(500).send("missing email")
        }

        const user = await this.userRepository.findOne({ email: payload.email });
        if (user === undefined) {
            return res.status(404).send('Not found');
        } else {
            request.session.userId = user.id;
        }
        return res.status(201).json(user)
    }

    async delete(request: Request, response: Response) {
        response.locals.userId = undefined;
        return response.status(204).json({})
    }
}