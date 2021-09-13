import { Request, Response } from "express";
import { prisma } from "..";

export class OrgController {
    async all(request: Request) {
        const orgs = await request.oso.authorizedResources(request.user, "read", prisma.org);
        return orgs;
    }

    async one(request: Request, response: Response) {
        const org = await prisma.org.findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "read", org);
        return org
    }

    async save(request: Request, response: Response) {
        // await request.oso.authorize(request.user, "create", new Org(), { checkRead: false });
        const org = await prisma.org.create({ data: request.body });
        await prisma.orgRole.create({ data: { orgId: org.id, userId: request.user.id, role: "owner" } });
        return response.status(201).send(org);
    }

    async remove(request: Request) {
        const orgToRemove = await prisma.org.findUnique({ where: { id: request.params.id } });
        // await request.oso.authorize(request.user, "delete", orgToRemove);
        await prisma.org.delete({ where: { id: orgToRemove.id } });
    }
}
