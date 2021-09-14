import { Router } from "express";
import { SessionController } from "../controllers/SessionController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "",
    controller: SessionController,
    action: "get"
}, {
    method: "post",
    route: "",
    controller: SessionController,
    action: "create"
}, {
    method: "delete",
    route: "",
    controller: SessionController,
    action: "delete"
}];

// Handles requests made to /sessions
export const sessionRouter = Router();

sessionRouter.get('', function (req, res, next) {
    return new SessionController().get(req, res)
})

sessionRouter.post('', function (req, res, next) {
    return new SessionController().create(req, res)
})

sessionRouter.delete('', function (req, res, next) {
    return new SessionController().delete(req, res)
})