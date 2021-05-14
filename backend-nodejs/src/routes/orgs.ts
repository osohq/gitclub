import { Router } from "express";
import { OrgController } from "../controller/OrgController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "",
    controller: OrgController,
    action: "all"
}, {
    method: "get",
    route: "/:id",
    controller: OrgController,
    action: "one"
}, {
    method: "post",
    route: "",
    controller: OrgController,
    action: "save"
}, {
    method: "delete",
    route: "/:id",
    controller: OrgController,
    action: "remove"
}, {
    method: "get",
    route: "/:id/unassigned_users",
    controller: OrgController,
    action: "allUnassignedUsers"
}, {
    method: "get",
    route: "/:id/role_assignments",
    controller: OrgController,
    action: "allOrgRoles"
}, {
    method: "post",
    route: "/:id/role_assignments",
    controller: OrgController,
    action: "saveOrgRole"
}, {
    method: "patch",
    route: "/:id/role_assignments",
    controller: OrgController,
    action: "updateOrgRole"
}, {
    method: "delete",
    route: "/:id/role_assignments",
    controller: OrgController,
    action: "deleteOrgRole"
}];

// Handles requests made to /orgs
export const orgsRouter = Router();
addRoutes(orgsRouter, Routes);

