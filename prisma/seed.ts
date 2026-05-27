import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STUDENTS = [
  { email: "jan.novak@stuba.sk", name: "Ján Novák" },
  { email: "maria.kovacova@stuba.sk", name: "Mária Kováčová" },
  { email: "peter.horvath@stuba.sk", name: "Peter Horváth" },
  { email: "lucia.vargova@stuba.sk", name: "Lucia Vargová" },
  { email: "michal.toth@stuba.sk", name: "Michal Tóth" },
  { email: "andrea.szabova@stuba.sk", name: "Andrea Szabová" },
  { email: "tomas.balaz@stuba.sk", name: "Tomáš Baláž" },
  { email: "katarina.molnarova@stuba.sk", name: "Katarína Molnárová" },
  { email: "marek.urban@stuba.sk", name: "Marek Urban" },
  { email: "petra.kralova@stuba.sk", name: "Petra Králová" },
  { email: "richard.danko@stuba.sk", name: "Richard Danko" },
  { email: "zuzana.benkova@stuba.sk", name: "Zuzana Benková" },
];

async function main() {
  console.log(`Seeding ${STUDENTS.length} test students...`);
  for (const s of STUDENTS) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: { name: s.name, role: "student" },
      create: { email: s.email, name: s.name, role: "student" },
    });
    console.log(`  upsert ${s.email}`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
