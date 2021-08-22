import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as session from "express-session";
import * as bodyParser from "body-parser";
import { usersRouter } from "./routes/users";
import { issuesRouter } from "./routes/issues";
import { reposRouter } from "./routes/repos";
import { orgsRouter } from "./routes/orgs";
import { sessionRouter } from "./routes/sessions";
import * as cors from "cors";

createConnection().then(async connection => {

    // create express app
    const app = express();
    app.use(cors({
        origin: "http://localhost:3000",
        methods: ["DELETE", "GET", "OPTIONS", "PATCH", "POST"],
        credentials: true,
        allowedHeaders: ["Accept", "Content-Type"]
    }));
    app.use(bodyParser.json());
    // Populates req.session
    app.use(session({
        resave: true,
        saveUninitialized: false,
        secret: 'keyboard cat',
        sameSite: true,
    }));
    reposRouter.use('/:repoId/issues', issuesRouter);
    orgsRouter.use('/:orgId/repos', reposRouter);
    app.use('/orgs', orgsRouter);
    app.use('/users', usersRouter);
    app.use('/session', sessionRouter);
    app.get("/org_role_choices", (req, res) => {
        res.send(["org_owner", "org_member"])
    });
    app.get("/repo_role_choices", (req, res) => {
        res.send(["repo_admin", "repo_writer", "repo_reader"])
    });


    // setup express app here
    // ...

    // start express server
    app.listen(5000, '0.0.0.0');

    console.log("Express server has started on port 5000.");

}).catch(error => console.log(error));

