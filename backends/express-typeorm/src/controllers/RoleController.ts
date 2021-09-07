import { getRepository, In, Not } from "typeorm";
import { Request } from "express";
import { User } from "../entities/User";

type Role = {
    role: string,
    user: User,
}

export class RoleController {
    protected userRepository = getRepository(User);
    protected roleRepository;
    protected resourceRepository;
    protected resourceName: string;

    async unassignedUsers(request: Request) {
        const resource = await this.resourceRepository.find({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);
        const assigned = await this.roleRepository.find({
            [this.resourceName]: {
                id: request.params.id
            }
        });
        const assignedUsers: Set<number> = new Set((await assigned).map(role => role.user.id));
        const authorizeFilter = await request.oso.authorizedQuery(request.user, "read", User);
        return await this.userRepository.find({ id: Not(In(Array.from(assignedUsers.values()))), ...authorizeFilter });
    }

    async all(request: Request): Promise<Role[]> {
        const resource = await this.resourceRepository.find({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);

        const userFilter = await request.oso.authorizedQuery(request.user, "read", User);
        const resourceRoles = await this.resourceRepository.find({
            [this.resourceName]: {
                id: request.params.id
            },
            user: userFilter
        });
        const roles = resourceRoles.map(resRole => {
            return {
                user: resRole.user,
                role: resRole.role
            };
        });
        return roles;
    }

    async save(request: Request) {
        const resource = await this.resourceRepository.find({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "create_role_assignments", resource);
        const userFilter = await request.oso.authorizedQuery(request.user, "read", User);

        const payload = request.params;
        await this.roleRepository.create({
            [this.resourceName]: {
                id: request.params.id,
            },
            role: payload.role,
            user: {
                id: payload.userId,
                ...userFilter
            }
        })
    }

    async update(request: Request) {
        const resource = await this.resourceRepository.find({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "update_role_assignments", resource);
        const userFilter = await request.oso.authorizedQuery(request.user, "read", User);

        const payload = request.body;
        const existingRole = await this.roleRepository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.userId,
                ...userFilter
            }
        });
        existingRole.role = payload.role;
        await this.roleRepository.save(existingRole);
        return existingRole;
    }

    async delete(request: Request) {
        const resource = await this.resourceRepository.find({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "delete_role_assignments", resource);
        const userFilter = await request.oso.authorizedQuery(request.user, "read", User);

        const payload = request.body;
        const existingRole = await this.roleRepository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.userId,
                ...userFilter
            }
        });
        await this.roleRepository.delete(existingRole.id);
    }
}