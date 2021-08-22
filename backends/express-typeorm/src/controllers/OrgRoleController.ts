import { getRepository } from "typeorm";
import { OrgRole } from "../entities/OrgRole";
import { RoleController } from "./RoleController";

export class OrgRoleController extends RoleController {
    protected repository = getRepository(OrgRole);
    protected resourceName = "org";
}