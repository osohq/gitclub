import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { Org } from "../entities/Org";

export class OrgController {
    private orgRepository = getRepository(Org);

    async all(request: Request) {
        const orgs = await this.orgRepository.find(request.oso.authorizedResources(request.user, "read", Org));
        return orgs;
    }

    async one(request: Request, response: Response) {
        const org = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read", org);
        return org
    }

    async save(request: Request, response: Response) {
        const org = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "update", org);
        return this.orgRepository.save(request.body);
    }

    async remove(request: Request) {
        const orgToRemove = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "delete", orgToRemove);
        await this.orgRepository.remove(orgToRemove);
    }
}