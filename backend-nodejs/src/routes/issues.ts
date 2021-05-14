import { Router } from "express";
import { IssueController } from "../controller/IssueController";
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
}];

// Handles requests made to /issues
export const issuesRouter = Router({ mergeParams: true });
addRoutes(issuesRouter, Routes);
