import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { Org } from "../entities/Org";
import { OrgRole } from "../entities/OrgRole";

export class OrgController {
    private orgRepository = getRepository(Org);
    private roleRepository = getRepository(OrgRole);

    async all(request: Request) {
        const orgs = await request.oso.authorizedResources(request.user, "read", Org);
        return orgs;
    }

    async one(request: Request, response: Response) {
        const org = await this.orgRepository.findOneOrFail(request.params.id);
        await request.oso.authorize(request.user, "read", org);
        return org
    }

    async save(request: Request, response: Response) {
        await request.oso.authorize(request.user, "create", new Org(), { checkRead: false });
        const org = await this.orgRepository.save(request.body) as unknown as Org; // oy vey
        await this.roleRepository.save({ org: org, user: request.user, role: "owner"});
        return response.status(201).send(org);
    }

    async remove(request: Request) {
        const orgToRemove = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "delete", orgToRemove);
        await this.orgRepository.remove(orgToRemove);
    }
}
