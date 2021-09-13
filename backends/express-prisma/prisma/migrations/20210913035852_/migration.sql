/*
 Warnings:
 
 - You are about to drop the column `baseRepoRole` on the `Org` table. All the data in the column will be lost.
 - You are about to drop the column `billingAddress` on the `Org` table. All the data in the column will be lost.
 - Added the required column `base_repo_role` to the `Org` table without a default value. This is not possible if the table is not empty.
 - Added the required column `billing_address` to the `Org` table without a default value. This is not possible if the table is not empty.
 
 */
-- RedefineTables
PRAGMA foreign_keys = OFF;

CREATE TABLE "new_Org" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "base_repo_role" TEXT NOT NULL,
  "billing_address" TEXT NOT NULL,
  "typename" TEXT NOT NULL DEFAULT 'Org'
);

INSERT INTO
  "new_Org" (
    "id",
    "name",
    "base_repo_role",
    "billing_address",
    "typename"
  )
SELECT
  "id",
  "name",
  "baseRepoRole",
  "billingAddress",
  "typename"
FROM
  "Org";

DROP TABLE "Org";

ALTER TABLE
  "new_Org" RENAME TO "Org";

PRAGMA foreign_key_check;

PRAGMA foreign_keys = ON;