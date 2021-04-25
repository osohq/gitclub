import { camelizeKeys, obj, snakeifyKeys } from '../helpers';

type Class<T extends {} = {}> = new (...args: any[]) => T;

const ROOT = 'http://localhost:5000';

const defaultOpts: RequestInit = {
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  credentials: 'include',
};

const jsonify = (x: obj) => JSON.stringify(snakeifyKeys(x));

async function req(path: string, expected: number, opts?: RequestInit) {
  const res = await fetch(ROOT + path, { ...opts, ...defaultOpts });
  if (res.status === expected) {
    if (expected !== 204) return res.json();
  } else throw new Error(res.statusText);
}

export const get = (path: string) => req(path, 200);

const patch = (path: string, body: obj) =>
  req(path, 200, { method: 'PATCH', body: jsonify(body) });

const post = (path: string, body: obj) =>
  req(path, 201, { method: 'POST', body: jsonify(body) });

export const del = (path: string, body: obj) =>
  req(path, 204, { method: 'DELETE', body: jsonify(body) });

export async function index<T>(path: string, cls: Class<T>) {
  const data = (await get(path)) as obj[];
  return data.map((d) => new cls(camelizeKeys(d)));
}

export async function show<T>(path: string, cls: Class<T>) {
  const data = (await get(path)) as obj;
  return new cls(camelizeKeys(data));
}

export async function create<T>(path: string, body: obj, cls: Class<T>) {
  const data = (await post(path, body)) as obj;
  return new cls(camelizeKeys(data));
}

export async function update<T>(path: string, body: obj, cls: Class<T>) {
  const data = (await patch(path, body)) as obj;
  return new cls(camelizeKeys(data));
}
