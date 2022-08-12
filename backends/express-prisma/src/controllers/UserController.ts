import { Request } from "express";
import { prisma } from "..";

export class UserController {
    async one(request: Request) {
        const user = await prisma.user.findUnique({ where: { id: request.params.id } });
        await request.oso.authorizeObj(request.user, "read_profile", user);
        return user;
    }

    async allRepos(request: Request) {
        const user = await prisma.user.findUnique({ where: { id: request.params.id } });
        await request.oso.authorizeObj(request.user, "read_profile", user);
        return await request.oso.authorizedResources(user, "read", "Repo");
    }
}
