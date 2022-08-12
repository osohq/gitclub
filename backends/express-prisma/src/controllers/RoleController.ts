import { User } from "@prisma/client";
import { Request } from "express";
import { prisma } from "..";

type Role = {
    role: string,
    user: User,
}

export class RoleController {
    protected resourceName: string;
    protected className: string;

    async unassignedUsers(request: Request) {
        await request.oso.authorizeObj(request.user, "list_role_assignments", { type: this.className, id: request.params.id });
        const assigned = await prisma[`${this.resourceName}Role`].findMany({
            where: { [this.resourceName]: { id: request.params.id } }
        });
        const assignedUsers: Set<number> = new Set((await assigned).map(role => role.userId));
        const [_model, authorizeFilter, _] = await request.oso.authorizedQuery(request.user, "read", "User");
        return await (await prisma.user.findMany({ where: authorizeFilter })).filter(u => !assignedUsers.has(u.id));
    }

    async all(request: Request): Promise<Role[]> {
        await request.oso.authorizeObj(request.user, "list_role_assignments", { type: this.className, id: request.params.id });
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
        await request.oso.authorizeObj(request.user, "create_role_assignments", { type: this.className, id: request.params.id });

        const payload = request.body;
        await request.oso.authorizeObj(request.user, "read", { type: "User", id: payload.user_id });

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
        await request.oso.authorizeObj(request.user, "update_role_assignments", { type: this.className, id: request.params.id });

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
        await request.oso.authorizeObj(request.user, "delete_role_assignments", { type: this.className, id: request.params.id });

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
