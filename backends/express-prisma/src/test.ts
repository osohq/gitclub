import { PrismaClient } from '@prisma/client';
import { prisma } from '.';
import { createFixtures } from '../prisma/seed';


export async function resetData() {
  await createFixtures()
};