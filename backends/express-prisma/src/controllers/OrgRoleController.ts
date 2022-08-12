import { RoleController } from "./RoleController";

export class OrgRoleController extends RoleController {
    protected resourceName = "org";
    protected className = "Org";
}