import "reflect-metadata";
import { createConnection, getRepository } from "typeorm";
import * as express from "express";
import * as session from "cookie-session";
import * as bodyParser from "body-parser";
import { usersRouter } from "./routes/users";
import { issuesRouter } from "./routes/issues";
import { reposRouter } from "./routes/repos";
import { orgsRouter } from "./routes/orgs";
import { sessionRouter } from "./routes/sessions";
import * as cors from "cors";
import { addEnforcer, errorHandler, initOso } from "./oso";
import { User } from "./entities/User";
import { OrgRole } from "./entities/OrgRole";

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

    // set current user on the request
    const userRepository = getRepository(User);
    app.use(async function (req, res, next) {
        const userId = req.session.userId;
        if (userId) {
            req.user = await userRepository.findOne(userId, {
                relations: ["repoRoles", "orgRoles"]
            });
        }
        next()
    });
    app.use(addEnforcer);
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

