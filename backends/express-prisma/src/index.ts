import "reflect-metadata";
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
import { resetData } from "./test";
import { Prisma, PrismaClient } from '@prisma/client'
import { NotFoundError } from "oso";



export const prisma = new PrismaClient({
    rejectOnNotFound: (e) => new NotFoundError(),
    log: ["info"]
})


async function main() {

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
    app.use(async function (req, res, next) {
        const userId: string = req.session.userId;
        if (userId) {
            try {
                req.user = await prisma.user.findFirst({
                    where: {
                        id: Number.parseInt(userId)
                    },
                    include: {
                        orgRole: { include: { org: true } },
                        repoRole: { include: { repo: true } },
                    }
                })
            } catch (err) {
                console.error(err)
            }
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
        res.send(["member", "owner"])
    });
    app.get("/repo_role_choices", (req, res) => {
        res.send(["admin", "writer", "reader"])
    });
    app.post("/_reset", async (req, res) =>
        await resetData().then(() => {
            return res.status(200).send("Data loaded")
        })
            .catch(err => {
                console.error(err);
                return res.status(500).send(err.toString())
            })
    );
    app.use(errorHandler);

    await initOso();

    // start express server
    app.listen(5000, '0.0.0.0');

    console.log("Express server has started on port 5000.");
}

main().catch(error => console.error(error));

