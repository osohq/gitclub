import { Brackets, getRepository } from "typeorm";
import { Request } from "express";
import { Repo } from "../entities/Repo";
import { RepoRole } from "../entities/RepoRole";
import { Org } from "../entities/Org";

export class RepoController {
    private orgRepository = getRepository(Org);
    private repoRepository = getRepository(Repo);
    private roleRepository = getRepository(RepoRole);

    async all(request: Request) {
        const org = await this.orgRepository.findOneOrFail({ id: request.params.orgId });
        await request.oso.authorize(request.user, "list_repos", org);
        const repoFilter = await request.oso.authorizedQuery(request.user, "read", Repo);
        const query = this.repoRepository.createQueryBuilder()
                          .where({ orgId: request.params.orgId })
                          .andWhere(repoFilter);
        return await query.getMany();
    }

    async one(request: Request) {
        const repo = await this.repoRepository.findOneOrFail({
            id: request.params.id, orgId: request.params.orgId
        });
        await request.oso.authorize(request.user, "read", repo);
        return repo
    }

    async save(request: Request, response) {
        const org = await this.orgRepository.findOneOrFail({ id: request.params.orgId });
        await request.oso.authorize(request.user, "create_repos", org);
        const res = await this.repoRepository.save({ org: org, ...request.body });
        await this.roleRepository.save({ repo: res, user: request.user, role: org.base_repo_role });
        return response.status(201).send(res);
    }

    async remove(request: Request) {
        const repo = await this.repoRepository.findOneOrFail({
            id: request.params.id, orgId: request.params.orgId
        });
        await request.oso.authorize(request.user, "delete", repo);
        await this.repoRepository.remove(repo);
    }
}
