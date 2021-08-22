import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "",
    controller: UserController,
    action: "all"
}, {
    method: "get",
    route: "/:id",
    controller: UserController,
    action: "one"
}, {
    method: "post",
    route: "",
    controller: UserController,
    action: "save"
}, {
    method: "delete",
    route: "/:id",
    controller: UserController,
    action: "remove"
}];

// Handles requests made to /users
export const usersRouter = Router();
addRoutes(usersRouter, Routes);

