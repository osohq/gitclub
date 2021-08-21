import { getRepository } from "typeorm";
import { NextFunction, Request, Response } from "express";
import { Org } from "../entity/Org";
import { OrgRole } from "../entity/OrgRole";
import { User } from "../entity/User";

export class OrgController {
    private userRepository = getRepository(User);
    private orgRepository = getRepository(Org);
    private orgRoleRepository = getRepository(OrgRole);

    async all(request: Request, response: Response, next: NextFunction) {
        return this.orgRepository.find();
    }

    async one(request: Request, response: Response, next: NextFunction) {
        return this.orgRepository.findOne(request.params.id);
    }

    async save(request: Request, response: Response, next: NextFunction) {
        return this.orgRepository.save(request.body);
    }

    async remove(request: Request, response: Response, next: NextFunction) {
        let orgToRemove = await this.orgRepository.findOne(request.params.id);
        await this.orgRepository.remove(orgToRemove);
    }

    async allUnassignedUsers(request: Request, response: Response, next: NextFunction) {
        return this.userRepository.find();
    }

    async allOrgRoles(request: Request, response: Response, next: NextFunction) {
        let roles = await this.orgRoleRepository.find({
            org: {
                id: request.params.orgId
            },
        });
        console.log(roles);
        return roles.map(role => {
            return {
                user: role.user,
                role: role.role,
            }
        });
    }

    async saveOrgRole(request: Request, response: Response, next: NextFunction) {

    }

    async updateOrgRole(request: Request, response: Response, next: NextFunction) {

    }

    async deleteOrgRole(request: Request, response: Response, next: NextFunction) {

    }
}