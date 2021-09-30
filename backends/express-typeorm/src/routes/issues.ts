import { Router } from "express";
import { IssueController } from "../controllers/IssueController";
import { addRoutes } from "./helpers";


const Routes = [{
    method: "get",
    route: "",
    controller: IssueController,
    action: "all"
}, {
    method: "get",
    route: "/:id",
    controller: IssueController,
    action: "one"
}, {
    method: "post",
    route: "",
    controller: IssueController,
    action: "save"
}, {
    method: "delete",
    route: "/:id",
    controller: IssueController,
    action: "remove"
}, {
    method: "put",
    route: "/:id/close",
    controller: IssueController,
    action: "close"
}];

// Handles requests made to /issues
export const issuesRouter = Router({ mergeParams: true });
addRoutes(issuesRouter, Routes);
