import { getRepository } from "typeorm";
import { Repo } from "../entities/Repo";
import { RepoRole } from "../entities/RepoRole";
import { RoleController } from "./RoleController";

export class RepoRoleController extends RoleController {
    protected roleRepository = getRepository(RepoRole);
    protected resourceRepository = getRepository(Repo);
    protected resourceName = "repo";
}