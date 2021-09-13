-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Org" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "baseRepoRole" TEXT NOT NULL,
    "billingAddress" TEXT NOT NULL,
    "typename" TEXT NOT NULL DEFAULT 'Org'
);
INSERT INTO "new_Org" ("baseRepoRole", "billingAddress", "id", "name") SELECT "baseRepoRole", "billingAddress", "id", "name" FROM "Org";
DROP TABLE "Org";
ALTER TABLE "new_Org" RENAME TO "Org";
CREATE TABLE "new_Repo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "orgId" INTEGER,
    "typename" TEXT NOT NULL DEFAULT 'Repo',
    CONSTRAINT "Repo_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Repo" ("id", "name", "orgId") SELECT "id", "name", "orgId" FROM "Repo";
DROP TABLE "Repo";
ALTER TABLE "new_Repo" RENAME TO "Repo";
CREATE TABLE "new_Issue" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "repoId" INTEGER,
    "typename" TEXT NOT NULL DEFAULT 'Issue',
    CONSTRAINT "Issue_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_Issue" ("id", "repoId", "title") SELECT "id", "repoId", "title" FROM "Issue";
DROP TABLE "Issue";
ALTER TABLE "new_Issue" RENAME TO "Issue";
CREATE TABLE "new_OrgRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "orgId" INTEGER,
    "userId" INTEGER,
    "typename" TEXT NOT NULL DEFAULT 'OrgRole',
    CONSTRAINT "OrgRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "OrgRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_OrgRole" ("id", "orgId", "role", "userId") SELECT "id", "orgId", "role", "userId" FROM "OrgRole";
DROP TABLE "OrgRole";
ALTER TABLE "new_OrgRole" RENAME TO "OrgRole";
CREATE TABLE "new_RepoRole" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "role" TEXT NOT NULL,
    "repoId" INTEGER,
    "userId" INTEGER,
    "typename" TEXT NOT NULL DEFAULT 'RepoRole',
    CONSTRAINT "RepoRole_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "Repo" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "RepoRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_RepoRole" ("id", "repoId", "role", "userId") SELECT "id", "repoId", "role", "userId" FROM "RepoRole";
DROP TABLE "RepoRole";
ALTER TABLE "new_RepoRole" RENAME TO "RepoRole";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "typename" TEXT NOT NULL DEFAULT 'User'
);
INSERT INTO "new_User" ("email", "id") SELECT "email", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
