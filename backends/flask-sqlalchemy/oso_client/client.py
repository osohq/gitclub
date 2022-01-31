import json
import requests


def default_to_type_and_id(obj):
    if obj == None:
        return ("null", "null")
    return (obj.__class__.__name__, obj.id)


def to_params(role_or_relation, from_type, from_id, name, to_type, to_id):
    from_name = "resource" if role_or_relation == "role" else "from"
    to_name = "actor" if role_or_relation == "role" else "to"
    return {
        from_name + "_id": str(from_id),
        from_name + "_type": from_type,
        role_or_relation: name,
        to_name + "_id": str(to_id),
        to_name + "_type": to_type,
    }


class OsoClient:
    def __init__(
        self, to_type_and_id=default_to_type_and_id, service_url="http://localhost:8080"
    ):
        self.to_type_and_id = to_type_and_id
        self.service_url = service_url

    def _handle_result(self, result):
        if not result.ok:
            raise Exception(
                f"Got unexpected error from Oso Service: {result.status_code}\n{result.text}"
            )
        try:
            return result.json()
        except json.decoder.JSONDecodeError:
            return result.text

    def authorize(self, actor, action, resource):
        actor_type, actor_id = self.to_type_and_id(actor)
        resource_type, resource_id = self.to_type_and_id(resource)
        result = requests.post(
            f"{self.service_url}/authorize",
            json={
                "actor_type": actor_type,
                "actor_id": str(actor_id),
                "action": action,
                "resource_type": resource_type,
                "resource_id": str(resource_id),
            },
        )
        allowed = self._handle_result(result)["allowed"]
        print("AUTHORIZING", actor, action, resource, "ALLOWED?", allowed)
        return allowed

    def list(self, actor, action, resource_type):
        actor_type, actor_id = self.to_type_and_id(actor)
        result = requests.post(
            f"{self.service_url}/list",
            json={
                "actor_type": actor_type,
                "actor_id": str(actor_id),
                "action": action,
                "resource_type": resource_type,
            },
        )
        results = self._handle_result(result)["results"]
        print("AUTHORIZING", actor, action, resource_type, "RESULTS:", results)
        return results

    def _add_role_or_relation(self, role_or_relation, from_, name, to):
        from_type, from_id = self.to_type_and_id(from_)
        to_type, to_id = self.to_type_and_id(to)
        params = to_params(role_or_relation, from_type, from_id, name, to_type, to_id)
        result = requests.post(f"{self.service_url}/{role_or_relation}s", json=params)
        return self._handle_result(result)

    def _delete_role_or_relation(self, role_or_relation, from_, name, to):
        from_type, from_id = self.to_type_and_id(from_)
        to_type, to_id = self.to_type_and_id(to)
        params = to_params(role_or_relation, from_type, from_id, name, to_type, to_id)
        result = requests.delete(f"{self.service_url}/{role_or_relation}s", json=params)
        return self._handle_result(result)

    def add_role(self, resource, role_name, actor):
        return self._add_role_or_relation("role", resource, role_name, actor)

    def add_relation(self, subject, name, object):
        return self._add_role_or_relation("relation", subject, name, object)

    def delete_role(self, resource, role_name, actor):
        return self._delete_role_or_relation("role", resource, role_name, actor)

    def delete_relation(self, subject, name, object):
        return self._delete_role_or_relation("relation", subject, name, object)

    def get_roles(self, resource=None, role=None, actor=None):
        params = {}
        if actor:
            actor_type, actor_id = self.to_type_and_id(actor)
            params["actor_type"] = actor_type
            params["actor_id"] = actor_id
        if resource:
            resource_type, resource_id = self.to_type_and_id(resource)
            params["resource_type"] = resource_type
            params["resource_id"] = resource_id
        if role:
            params["role"] = role
        result = requests.get(f"{self.service_url}/roles", params=params)
        return self._handle_result(result)
