const express = require("express");
const bodyParser = require("body-parser");
const { Oso, defaultEqualityFn } = require("oso");

const app = express();
app.use(bodyParser.json());

class Base {
  constructor(type, id) {
    this.type = type;
    this.id = id;
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
oso.registerConstant({ roles, relations }, "Data");
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

app.post("/roles", (req, res) => {
  console.log("Got role", req.body);
  const actor = new Base(req.body.actor_type, req.body.actor_id);
  const resource = new Base(req.body.resource_type, req.body.resource_id);
  roles.push({ actor, resource, name: req.body.name });

  console.log("ROLES: ", roles);
  res.send("ok");
});

app.delete("/roles", (req, res) => {
  console.log("Deleting role", req.body);
  const actor = new Base(req.body.actor_type, req.body.actor_id);
  const resource = new Base(req.body.resource_type, req.body.resource_id);
  const currentIndex = relations.findIndex(
    (role) => equals(role.actor, actor) && equals(role.resource, resource)
  );
  console.log("Found current role index", currentIndex);
  if (currentIndex >= 0) roles.splice(currentIndex, 1);

  console.log("ROLES: ", roles);
  res.send("ok");
});

app.post("/relations", (req, res) => {
  console.log("Got relation", req.body);
  const subject = new Base(req.body.subject_type, req.body.subject_id);
  const object = new Base(req.body.object_type, req.body.object_id);
  relations.push({ subject, object, predicate: req.body.predicate });

  console.log("RELATIONS: ", relations);
  res.send("ok");
});

app.delete("/relations", (req, res) => {
  console.log("Deleting relation", req.body);
  const subject = new Base(req.body.subject_type, req.body.subject_id);
  const object = new Base(req.body.object_type, req.body.object_id);
  const currentIndex = relations.findIndex(
    (role) => equals(role.subject, subject) && equals(role.object, object)
  );
  console.log("Found current relation index", currentIndex);
  if (currentIndex >= 0) relations.splice(currentIndex, 1);

  console.log("RELATIONS: ", relations);
  res.send("ok");
});

app.get(
  "/has_role/:actorType/:actorId/:roleName/:resourceType/:resourceId",
  async (req, res) => {
    const actor = new Base(req.params.actorType, parseInt(req.params.actorId));
    const resource = new Base(
      req.params.resourceType,
      parseInt(req.params.resourceId)
    );
    const role = req.params.roleName;
    const result = await oso.queryRuleOnce("has_role", actor, role, resource);
    console.log("QUERYING FOR ROLE", req.params, result);
    res.send(result);
  }
);

app.listen(5002, () => {
  console.log("Listening on port 5002");
});
