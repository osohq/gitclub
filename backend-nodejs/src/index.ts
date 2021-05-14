import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import { usersRouter } from "./routes/users";
import { issuesRouter } from "./routes/issues";
import { reposRouter } from "./routes/repos";
import { orgsRouter } from "./routes/orgs";
import * as cors from "cors";

createConnection().then(async connection => {

    // create express app
    const app = express();
    app.use(bodyParser.json());
    app.use(cors({
        origin: "http://localhost:3000",
        methods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
        credentials: true,
        allowedHeaders: ["Accept", "Content-Type"]
    }));
    reposRouter.use('/:repoId/issues', issuesRouter);
    orgsRouter.use('/:orgId/repos', reposRouter);
    app.use('/orgs', orgsRouter);
    app.use('/users', usersRouter);
    app.get("/org_role_choices", (req, res) => {
        res.send(["org_owner", "org_member"])
    })


    // setup express app here
    // ...

    // start express server
    app.listen(5000, '0.0.0.0');

    console.log("Express server has started on port 5000.");

}).catch(error => console.log(error));

