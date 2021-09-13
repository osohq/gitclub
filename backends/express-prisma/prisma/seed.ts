import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()


export async function createFixtures() {
    // The transaction runs synchronously so deleteUsers must run last.
    await prisma.$transaction([
        prisma.orgRole.deleteMany(),
        prisma.repoRole.deleteMany(),
        prisma.issue.deleteMany(),
        prisma.repo.deleteMany(),
        prisma.org.deleteMany(),
        prisma.user.deleteMany(),
    ])


    const john = await prisma.user.create({ data: { id: 1, email: "john@beatles.com" } })
    const paul = await prisma.user.create({ data: { id: 2, email: "paul@beatles.com" } })
    const ringo = await prisma.user.create({ data: { id: 3, email: "ringo@beatles.com" } })
    const mike = await prisma.user.create({ data: { id: 4, email: "mike@monsters.com" } })
    const sully = await prisma.user.create({ data: { id: 5, email: "sully@monsters.com" } })
    const randall = await prisma.user.create({ data: { id: 6, email: "randall@monsters.com" } })
    const admin = await prisma.user.create({ data: { id: 7, email: "admin@admin.com" } })

    const beatles = await prisma.org.create({
        data: {
            id: 1,
            name: "The Beatles",
            billing_address: "64 Penny Ln Liverpool, UK",
            base_repo_role: "reader",
        }
    })
    const monsters = await prisma.org.create({
        data: {
            id: 2,
            name: "Monsters Inc.",
            billing_address: "123 Scarers Rd Monstropolis, USA",
            base_repo_role: "reader",
        }
    })


    const abbey_road = await prisma.repo.create({
        data: {
            id: 1,
            name: "Abbey Road", orgId: beatles.id
        }
    })
    const paperwork = await prisma.repo.create({
        data: {
            id: 2,
            name: "Paperwork", orgId: monsters.id
        }
    })
    const laughter = await prisma.repo.create({
        data: {
            id: 3,
            name: "laughter", orgId: monsters.id
        }
    })

    const too_much_critical_acclaim = await prisma.issue.create({
        data: { title: "Too much critical acclaim", repoId: abbey_road.id }
    })

    async function addRepoRole(user, repo, roleName) {
        await prisma.repoRole.create({
            data: {
                repoId: repo.id,
                userId: user.id,
                role: roleName
            }
        })
    }

    async function addOrgRole(user, org, roleName) {
        await prisma.orgRole.create({
            data: {
                orgId: org.id,
                userId: user.id,
                role: roleName
            }
        })
    }

    // await addRepoRole(john, abbey_road, "reader")
    // await addRepoRole(paul, abbey_road, "reader")
    // await addRepoRole(ringo, abbey_road, "writer")
    // await addRepoRole(mike, paperwork, "reader")
    // await addRepoRole(sully, paperwork, "reader")


    await addOrgRole(john, beatles, "owner")
    await addOrgRole(paul, beatles, "member")
    await addOrgRole(ringo, beatles, "member")
    await addOrgRole(mike, monsters, "owner")
    await addOrgRole(sully, monsters, "member")
    await addOrgRole(randall, monsters, "member")

}

createFixtures()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })