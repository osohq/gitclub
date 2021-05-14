import { Router } from "express";
import { RepoController } from "../controller/RepoController";
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
}];

// Handles requests made to /org/:orgId//repos
export const reposRouter = Router({ mergeParams: true });
addRoutes(reposRouter, Routes);
