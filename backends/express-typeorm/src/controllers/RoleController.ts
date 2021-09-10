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
        const resource = await this.resourceRepository.findOneOrFail({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);
        const assigned = await this.roleRepository.find({
            [this.resourceName]: { id: request.params.id }
        });
        const assignedUsers: Set<number> = new Set((await assigned).map(role => role.userId));
        const authorizeFilter = await request.oso.authorizedQuery(request.user, "read", User);
        return await (await this.userRepository.find(authorizeFilter)).filter(u => !assignedUsers.has(u.id));
    }

    async all(request: Request): Promise<Role[]> {
        const resource = await this.resourceRepository.findOneOrFail({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "list_role_assignments", resource);
        const resourceRoles = await this.roleRepository.find({
            [this.resourceName]: {
                id: request.params.id
            },
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
        const resource = await this.resourceRepository.findOneOrFail({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "create_role_assignments", resource);
        const payload = request.body;
        const user = await this.userRepository.findOneOrFail({ id: payload.user_id });
        await request.oso.authorize(request.user, "read", user);
        let role = await this.roleRepository.save({
            [this.resourceName]: {
                id: request.params.id,
            },
            role: payload.role,
            user: {
                id: payload.user_id
            }
        });
        role = await this.roleRepository.preload(role);
        return response.status(201).send(role);
    }

    async update(request: Request) {
        const resource = await this.resourceRepository.findOneOrFail({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "update_role_assignments", resource);

        const payload = request.body;
        const existingRole = await this.roleRepository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.user_id
            }
        });
        existingRole.role = payload.role;
        await this.roleRepository.save(existingRole);
        return existingRole;
    }

    async delete(request: Request, response) {
        const resource = await this.resourceRepository.findOneOrFail({
            id: request.params.id
        });
        await request.oso.authorize(request.user, "delete_role_assignments", resource);

        const payload = request.body;
        const existingRole = await this.roleRepository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.user_id
            }
        });
        await this.roleRepository.delete(existingRole.id);
        return response.status(204).send(existingRole);
    }
}
