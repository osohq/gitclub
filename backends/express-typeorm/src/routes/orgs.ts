import { Router } from "express";
import { OrgController } from "../controllers/OrgController";
import { OrgRoleController } from "../controllers/OrgRoleController";
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
    controller: OrgRoleController,
    action: "unassignedUsers"
}, {
    method: "get",
    route: "/:id/role_assignments",
    controller: OrgRoleController,
    action: "all"
}, {
    method: "post",
    route: "/:id/role_assignments",
    controller: OrgRoleController,
    action: "save"
}, {
    method: "patch",
    route: "/:id/role_assignments",
    controller: OrgRoleController,
    action: "update"
}, {
    method: "delete",
    route: "/:id/role_assignments",
    controller: OrgRoleController,
    action: "delete"
}];

// Handles requests made to /orgs
export const orgsRouter = Router();
addRoutes(orgsRouter, Routes);

