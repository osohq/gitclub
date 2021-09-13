import { User } from "@prisma/client";
import { Request } from "express";
import { prisma } from "..";

type Role = {
    role: string,
    user: User,
}

export class RoleController {
    protected resourceName: string;

    async unassignedUsers(request: Request) {
        const resource = await prisma[this.resourceName].findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);
        const assigned = await prisma[`${this.resourceName}Role`].findMany({
            where: { [this.resourceName]: { id: request.params.id } }
        });
        const assignedUsers: Set<number> = new Set((await assigned).map(role => role.userId));
        const authorizeFilter = await request.oso.authorizedQuery(request.user, "read", prisma.user);
        return await (await prisma.user.findMany({ where: authorizeFilter })).filter(u => !assignedUsers.has(u.id));
    }

    async all(request: Request): Promise<Role[]> {
        const resource = await prisma[this.resourceName].findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);
        const resourceRoles = await prisma[`${this.resourceName}Role`].findMany({
            where: {
                [this.resourceName]: {
                    id: request.params.id
                },
            },
            include: {
                user: true,
            }
        });
        const roles = resourceRoles.map(resRole => {
            return {
                user: resRole.user,
                role: resRole.role
            };
        });
        return roles;
    }

    async save(request: Request, response) {
        const resource = await prisma[this.resourceName].findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "create_role_assignments", resource);
        const payload = request.body;
        const user = await prisma.user.findUnique({ where: { id: payload.user_id } });
        await request.oso.authorize(request.user, "read", user);
        let role = await prisma[`${this.resourceName}Role`].create({
            data: {
                [this.resourceName]: {
                    id: request.params.id,
                },
                role: payload.role,
                userId: payload.user_id
            }
        });
        role = await prisma[`${this.resourceName}Role`].preload(role);
        return response.status(201).send(role);
    }

    async update(request: Request) {
        const resource = await prisma[this.resourceName].findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "update_role_assignments", resource);

        const payload = request.body;
        const existingRole = await prisma[`${this.resourceName}Role`].findFirst({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.user_id
            }
        });
        existingRole.role = payload.role;
        await prisma[`${this.resourceName}Role`].save(existingRole);
        return existingRole;
    }

    async delete(request: Request, response) {
        const resource = await prisma[this.resourceName].findUnique({
            where: {
                id: request.params.id
            }
        });
        await request.oso.authorize(request.user, "delete_role_assignments", resource);

        const payload = request.body;
        const existingRole = await prisma[`${this.resourceName}Role`].findFirst({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.user_id
            }
        });
        await prisma[`${this.resourceName}Role`].delete(existingRole.id);
        return response.status(204).send(existingRole);
    }
}
