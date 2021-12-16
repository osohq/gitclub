const express = require("express");
const bodyParser = require("body-parser");
const { Oso } = require("oso");

const app = express();
app.use(bodyParser.json());

let oso = new Oso();
oso.loadFiles(["main.polar"]);

let roles = [];

// app.post("/update_policy", async (req, res) => {
//   oso = new Oso();
//   oso.loadString(req.body.policy);
//   oso
// });

app.post("/roles", (req, res) => {
  console.log("Got role", req.body);
  roles.push(req.body);

  console.log("ROLES: ", roles);
  res.send("ok");
});

app.delete("/roles", (req, res) => {
  console.log("Deleting role", req.body);
  const currentIndex = roles.findIndex(
    (role) =>
      role.actor_type === req.body.actor_type &&
      role.actor_id === req.body.actor_id &&
      role.resource_type === req.body.resource_type &&
      role.resource_id === req.body.resource_id
  );
  console.log("Found current role index", currentIndex);
  if (currentIndex >= 0) roles.splice(currentIndex, 1);

  console.log("ROLES: ", roles);
  res.send("ok");
});

app.get(
  "/has_role/:actorType/:actorId/:roleName/:resourceType/:resourceId",
  (req, res) => {
    const index = roles.findIndex(
      (role) =>
        role.actor_type === req.params.actorType &&
        role.actor_id === req.params.actorId &&
        role.resource_type === req.params.resourceType &&
        role.resource_id === req.params.resourceId
    );
    const result = index >= 0;
    res.send(result);
  }
);

app.listen(5002, () => {
  console.log("Listening on port 5002");
});
