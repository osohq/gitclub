import * as path from 'path';
import { Builder, Loader, Parser, Resolver } from 'typeorm-fixtures-cli/dist';
import { Connection, getRepository } from 'typeorm';

const fixturesPath = "./fixtures/"


export async function resetData(connection: Connection) {
  try {
    await connection.synchronize(true);

    const loader = new Loader();
    loader.load(path.resolve(fixturesPath));

    const resolver = new Resolver();
    const fixtures = resolver.resolve(loader.fixtureConfigs);
    const builder = new Builder(connection, new Parser());

    for (const fixture of fixtures) {
      const entity = await builder.build(fixture);
      const res = await getRepository(entity.constructor.name).save(entity);
    }
  } catch (err) {
    throw err;
  }
}