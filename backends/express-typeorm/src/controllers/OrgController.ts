import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { Org } from "../entities/Org";

export class OrgController {
    private orgRepository = getRepository(Org);

    async all(request: Request) {
        const orgs = await request.oso.authorizedResources(request.user, "read", Org);
        return orgs;
    }

    async one(request: Request, response: Response) {
        const org = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read", org);
        return org
    }

    async save(request: Request, response: Response) {
        await request.oso.authorize(request.user, "create", new Org(), { checkRead: false });
        const res = await this.orgRepository.save(request.body);
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        const orgToRemove = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "delete", orgToRemove);
        await this.orgRepository.remove(orgToRemove);
    }
}