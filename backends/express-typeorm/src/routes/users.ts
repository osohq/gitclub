import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "/:id",
    controller: UserController,
    action: "one"
}, {
    method: "get",
    route: "/:id/repos",
    controller: UserController,
    action: "allRepos"
}, {
    method: "get",
    route: "/:id/issues",
    controller: UserController,
    action: "allIssues"
}];

// Handles requests made to /users
export const usersRouter = Router();
addRoutes(usersRouter, Routes);

