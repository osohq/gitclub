import { getRepository } from "typeorm";
import { Request, Response } from "express";
import { Org } from "../entities/Org";

export class OrgController {
    private orgRepository = getRepository(Org);

    async all(request: Request) {
        const allOrgs = await this.orgRepository.find();
        console.log('authorize read on orgs');
        const orgs = request.authorizeList("read", allOrgs);
        return orgs;
    }

    async one(request: Request, response: Response) {
        const org = await this.orgRepository.findOne(request.params.id);
        await request.oso.authorize(request.user, "read", org);
        console.log("returning data?!?!");
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