import { getRepository } from "typeorm";
import { Org } from "../entities/Org";
import { OrgRole } from "../entities/OrgRole";
import { RoleController } from "./RoleController";

export class OrgRoleController extends RoleController {
    protected roleRepository = getRepository(OrgRole);
    protected resourceRepository = getRepository(Org);
    protected resourceName = "org";
}