const express = require("express");
const bodyParser = require("body-parser");
const { Oso, defaultEqualityFn } = require("oso");
const knexfile = require("./knexfile");

const knex = require("knex")(knexfile.development);

const ROLES_TO_CREATE = 1000000;
const BATCH_SIZE = 100;
// const FORCE_USER_ID = "4";
const FORCE_USER_ID = undefined;

function createFakeRole() {
  return {
    actor_type: "User",
    actor_id: FORCE_USER_ID || Math.random().toString(),
    resource_type: Math.random() > 0.5 ? "Repo" : "Org",
    resource_id: Math.random().toString(),
    name: Math.random() > 0.5 ? "member" : "owner",
  };
}

async function generate() {
  const roles = new Array(ROLES_TO_CREATE).fill(null).map(createFakeRole);
  for (let i = 0; i < ROLES_TO_CREATE; i += BATCH_SIZE) {
    const slice = roles.slice(i, i + BATCH_SIZE);
    await knex("roles").insert(slice);
    console.log("Inserted", i + BATCH_SIZE, "rows");
  }
  knex.destroy();
}

generate();
