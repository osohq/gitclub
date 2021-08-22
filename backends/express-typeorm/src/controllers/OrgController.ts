import { getRepository } from "typeorm";
import { Request } from "express";
import { Org } from "../entities/Org";


export class OrgController {
    private orgRepository = getRepository(Org);

    async all(request: Request) {
        return this.orgRepository.find();
    }

    async one(request: Request) {
        return this.orgRepository.findOne(request.params.id);
    }

    async save(request: Request) {
        return this.orgRepository.save(request.body);
    }

    async remove(request: Request) {
        let orgToRemove = await this.orgRepository.findOne(request.params.id);
        await this.orgRepository.remove(orgToRemove);
    }
}