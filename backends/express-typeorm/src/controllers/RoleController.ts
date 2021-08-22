import { getRepository } from "typeorm";
import { Request } from "express";
import { User } from "../entities/User";

type Role = {
    role: string,
    user: User,
}

export class RoleController {
    protected userRepository = getRepository(User);
    protected repository;
    protected resourceName: string;

    async unassignedUsers(request: Request) {
        const assigned = this.repository.find({
            [this.resourceName]: {
                id: request.params.id
            }
        });
        const assignedUsers = new Set((await assigned).map(role => role.user));
        return (await this.userRepository.find()).filter(user => !assignedUsers.has(user));
    }

    async all(request: Request): Promise<Role[]> {
        const resourceRoles = await this.repository.find({
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

    async save(request: Request) {
        const payload = request.params;
        await this.repository.create({
            [this.resourceName]: {
                id: request.params.id,
            },
            role: payload.role,
            user: {
                id: payload.userId
            }
        })
    }

    async update(request: Request) {
        const payload = request.body;
        const existingRole = await this.repository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.userId
            }
        });
        existingRole.role = payload.role;
        await this.repository.save(existingRole);
        return existingRole;
    }

    async delete(request: Request) {
        const payload = request.body;
        const existingRole = await this.repository.findOneOrFail({
            [this.resourceName]: {
                id: request.params.id
            },
            user: {
                id: payload.userId
            }
        });
        await this.repository.delete(existingRole.id);
    }
}