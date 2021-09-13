import { Request, Response } from "express";
import { prisma } from "..";

export class SessionController {
    async get(request: Request, res: Response) {
        const user = request.user;
        if (user === undefined) {
            // TODO: Shouldn't this return 401?
            return res.status(200).send({});
        }
        return res.status(200).json(user);
    }

    async create(request: Request, res: Response) {
        const payload = request.body;
        if (payload.email === undefined) {
            return res.status(500).send("missing email")
        }

        const user = await prisma.user.findFirst({ where: { email: payload.email } });
        if (user === undefined) {
            return res.status(404).send('Not found');
        } else {
            request.session.userId = user.id;
            request.user = user;
        }
        return res.status(201).json(user)
    }

    async delete(request: Request, response: Response) {
        request.session = {};
        return response.status(204).json({})
    }
}