const express = require("express");
const bodyParser = require("body-parser");
const { Oso, defaultEqualityFn } = require("oso");
const knexfile = require("./knexfile");

const knex = require("knex")(knexfile.development);
const app = express();
app.use(bodyParser.json());

class Base {
  constructor(type, id) {
    this.type = type;
    this.id = id.toString();
  }

  static from(row, field_name) {
    return new Base(row[field_name + "_type"], row[field_name + "_id"]);
  }

  toString() {
    return `${this.type}:${this.id}`;
  }
}

let roles = [];
let relations = [];

let oso = new Oso({
  equalityFn: equals,
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "User",
  name: "User",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Org",
  name: "Org",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Repo",
  name: "Repo",
});
const Data = {
  roles,
  relations,
  getRoles: async (actor) => {
    const rows = await knex("roles").where({
      actor_id: actor.id,
      actor_type: actor.type,
    });
    return rows.map((row) => ({
      name: row.name,
      actor: Base.from(row, "actor"),
      resource: Base.from(row, "resource"),
    }));
  },
  getRelations: async (object) => {
    const rows = await knex("relations").where({
      object_id: object.id,
      object_type: object.type,
    });
    return rows.map((row) => ({
      predicate: row.predicate,
      subject: Base.from(row, "subject"),
      object: Base.from(row, "object"),
    }));
  },
};
oso.registerConstant(Data, "Data");
oso.loadFiles(["main.polar"]);

// app.post("/update_policy", async (req, res) => {
//   oso = new Oso();
//   oso.loadString(req.body.policy);
//   oso
// });

function equals(obj1, obj2) {
  if (
    typeof obj1 === "object" &&
    typeof obj2 === "object" &&
    "type" in obj1 &&
    "type" in obj2
  )
    return obj1.type === obj2.type && obj1.id === obj2.id;
  return defaultEqualityFn(obj1, obj2);
}

app.post("/roles", async (req, res) => {
  console.log(
    `Creating role:`,
    Base.from(req.body, "actor").toString(),
    req.body.name,
    Base.from(req.body, "resource").toString()
  );
  // TODO: This isn't safe at all
  await knex("roles").insert(req.body);
  res.send("ok");
});

app.delete("/roles", async (req, res) => {
  console.log(
    `Deleting role:`,
    Base.from(req.body, "actor").toString(),
    Base.from(req.body, "resource").toString()
  );
  const count = await knex("roles")
    .where({
      actor_type: req.body.actor_type,
      actor_id: req.body.actor_id,
      resource_type: req.body.resource_type,
      resource_id: req.body.resource_id,
    })
    .delete();
  console.log(`Deleted ${count} roles`);
  res.send("ok");
});

app.post("/relations", async (req, res) => {
  console.log(
    `Creating role:`,
    Base.from(req.body, "subject").toString(),
    req.body.predicate,
    Base.from(req.body, "object").toString()
  );
  // TODO: This isn't safe at all
  await knex("relations").insert(req.body);
  res.send("ok");
});

app.delete("/relations", async (req, res) => {
  console.log(
    `Deleting role:`,
    Base.from(req.body, "subject").toString(),
    Base.from(req.body, "object").toString()
  );
  const count = await knex("roles")
    .where({
      subject_type: req.body.subject_type,
      subject_id: req.body.subject_id,
      object_type: req.body.object_type,
      object_id: req.body.object_id,
    })
    .delete();
  console.log(`Deleted ${count} relations`);
  res.send("ok");
});

app.get(
  "/has_role/:actorType/:actorId/:roleName/:resourceType/:resourceId",
  async (req, res) => {
    const actor = new Base(req.params.actorType, req.params.actorId);
    const resource = new Base(req.params.resourceType, req.params.resourceId);
    const role = req.params.roleName;
    const result = await oso.queryRuleOnce("has_role", actor, role, resource);
    console.log("Querying role", actor.toString(), role, resource.toString());
    console.log("Got result:", result);
    res.send(result);
  }
);

app.listen(5002, () => {
  console.log("Listening on port 5002");
});
