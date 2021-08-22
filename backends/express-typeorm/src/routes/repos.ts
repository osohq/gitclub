import { Router } from "express";
import { RepoController } from "../controllers/RepoController";
import { RepoRoleController } from "../controllers/RepoRoleController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "",
    controller: RepoController,
    action: "all"
}, {
    method: "get",
    route: "/:id",
    controller: RepoController,
    action: "one"
}, {
    method: "post",
    route: "",
    controller: RepoController,
    action: "save"
}, {
    method: "delete",
    route: "/:id",
    controller: RepoController,
    action: "remove"
}, {
    method: "get",
    route: "/:id/unassigned_users",
    controller: RepoRoleController,
    action: "unassignedUsers"
}, {
    method: "get",
    route: "/:id/role_assignments",
    controller: RepoRoleController,
    action: "all"
}, {
    method: "post",
    route: "/:id/role_assignments",
    controller: RepoRoleController,
    action: "save"
}, {
    method: "patch",
    route: "/:id/role_assignments",
    controller: RepoRoleController,
    action: "update"
}, {
    method: "delete",
    route: "/:id/role_assignments",
    controller: RepoRoleController,
    action: "delete"
}];

// Handles requests made to /org/:orgId//repos
export const reposRouter = Router({ mergeParams: true });
addRoutes(reposRouter, Routes);
