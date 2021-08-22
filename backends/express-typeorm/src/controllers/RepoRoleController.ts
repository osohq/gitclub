import { getRepository } from "typeorm";
import { RepoRole } from "../entities/RepoRole";
import { RoleController } from "./RoleController";

export class RepoRoleController extends RoleController {
    protected repository = getRepository(RepoRole);
    protected resourceName = "repo";
}