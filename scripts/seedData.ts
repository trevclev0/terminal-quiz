import { sql } from "drizzle-orm";
import { gates, programs } from "../src/shared/schema";
import { deleteWhereSql, insertSql, upsertConflict } from "./seedGenerator";

// Real seed data — checked into git, typed against src/shared/schema.ts.
// 10 programs total. Idempotent (ON CONFLICT DO UPDATE), scoped to
// system-seeded rows only (author_id IS NULL) so it never touches
// user-authored programs or their players' session progress.

const PROGRAM_IDS = {
  digitalPioneer: "a1b2c3d4-0001-0001-0001-000000000001",
  globalLandmark: "a1b2c3d4-0002-0002-0002-000000000002",
  cosmicVoyager: "c1c2c3c4-0003-0000-0000-000000000003",
  ancientPantheon: "c1c2c3c4-0004-0000-0000-000000000004",
  harmonicCode: "c1c2c3c4-0005-0000-0000-000000000005",
  creaturesOfTheWild: "c1c2c3c4-0006-0000-0000-000000000006",
  culinaryCrossroads: "c1c2c3c4-0007-0000-0000-000000000007",
  worldAtlasChallenge: "c1c2c3c4-0008-0000-0000-000000000008",
  numberCrunchersGauntlet: "c1c2c3c4-0009-0000-0000-000000000009",
  talesFromTheBookshelf: "c1c2c3c4-000a-0000-0000-00000000000a",
} as const;

const programRows: (typeof programs.$inferInsert)[] = [
  { id: PROGRAM_IDS.digitalPioneer, name: "The Digital Pioneer's Quest" },
  {
    id: PROGRAM_IDS.globalLandmark,
    name: "The Global Landmark Expedition",
  },
  { id: PROGRAM_IDS.cosmicVoyager, name: "The Cosmic Voyager's Journey" },
  {
    id: PROGRAM_IDS.ancientPantheon,
    name: "Legends of the Ancient Pantheon",
  },
  { id: PROGRAM_IDS.harmonicCode, name: "The Harmonic Code" },
  { id: PROGRAM_IDS.creaturesOfTheWild, name: "Creatures of the Wild" },
  {
    id: PROGRAM_IDS.culinaryCrossroads,
    name: "The Culinary Crossroads",
  },
  {
    id: PROGRAM_IDS.worldAtlasChallenge,
    name: "The World Atlas Challenge",
  },
  {
    id: PROGRAM_IDS.numberCrunchersGauntlet,
    name: "The Number Cruncher's Gauntlet",
  },
  {
    id: PROGRAM_IDS.talesFromTheBookshelf,
    name: "Tales from the Bookshelf",
  },
];

const gateRows: (typeof gates.$inferInsert)[] = [
  // The Digital Pioneer's Quest — computing history
  {
    id: "b1000001-0000-0000-0000-000000000001",
    programId: PROGRAM_IDS.digitalPioneer,
    sequenceOrder: 1,
    label: "Log-001",
    question:
      "I was the world's first computer programmer, having written " +
      "an algorithm for the Analytical Engine in the mid-1800s. Who " +
      "am I?",
    correctAnswer: "Ada Lovelace",
    successMessage:
      "Correct! Ada Lovelace saw the potential for computers to do " +
      "more than just crunch numbers, envisioning them as tools for " +
      "creativity and logic.",
  },
  {
    id: "b1000001-0000-0000-0000-000000000002",
    programId: PROGRAM_IDS.digitalPioneer,
    sequenceOrder: 2,
    label: "Log-002",
    question:
      "In 1947, a physical moth was found trapped in a relay of the " +
      "Harvard Mark II computer. This incident popularized what " +
      "3-letter term for a technical error?",
    correctAnswer: "Bug",
    successMessage:
      "Exactly! Grace Hopper's team literally 'debugged' the machine " +
      "by removing the moth and taping it into their logbook.",
  },
  {
    id: "b1000001-0000-0000-0000-000000000003",
    programId: PROGRAM_IDS.digitalPioneer,
    sequenceOrder: 3,
    label: "Log-003",
    question:
      "I am the foundational protocol of the World Wide Web, used to " +
      "transmit data between a client and a server. I usually come " +
      "before a '://' in your browser.",
    correctAnswer: "HTTP",
    successMessage:
      "You've got it. Hypertext Transfer Protocol is the language of " +
      "the web, allowing us to fetch the very resources you're " +
      "looking at right now.",
  },
  {
    id: "b1000001-0000-0000-0000-000000000004",
    programId: PROGRAM_IDS.digitalPioneer,
    sequenceOrder: 4,
    label: "Log-004",
    question:
      "Created by Linus Torvalds in 2005, I am the most widely used " +
      "version control system in the world. What is my name?",
    correctAnswer: "Git",
    successMessage:
      "Spot on. Whether you are branching, merging, or committing, " +
      "Git is the backbone of modern collaborative software " +
      "development.",
  },
  {
    id: "b1000001-0000-0000-0000-000000000005",
    programId: PROGRAM_IDS.digitalPioneer,
    sequenceOrder: 5,
    label: "Log-005",
    question:
      "I am a simple, logic-based test proposed in 1950 to determine " +
      "if a machine can exhibit intelligent behavior indistinguishable " +
      "from a human. What am I called?",
    correctAnswer: "Turing Test",
    successMessage:
      "Excellent. Alan Turing's 'Imitation Game' remains a " +
      "philosophical cornerstone in the field of Artificial " +
      "Intelligence.",
  },

  // The Global Landmark Expedition — world landmarks
  {
    id: "b2000002-0000-0000-0000-000000000001",
    programId: PROGRAM_IDS.globalLandmark,
    sequenceOrder: 1,
    label: "Site-Alpha",
    question:
      "I am a wrought-iron lattice tower in Paris, originally built " +
      "for the 1889 World's Fair. What is my name?",
    correctAnswer: "Eiffel Tower",
    successMessage:
      "Magnifique! You've found the 'Iron Lady.' Fun fact: she was " +
      "originally intended to be a temporary structure, but her " +
      "height made her perfect for radio transmissions!",
  },
  {
    id: "b2000002-0000-0000-0000-000000000002",
    programId: PROGRAM_IDS.globalLandmark,
    sequenceOrder: 2,
    label: "Site-Beta",
    question:
      "I am a massive ancient wall that winds across thousands of " +
      "miles to protect the northern borders of China. What am I " +
      "called?",
    correctAnswer: "Great Wall of China",
    successMessage:
      "Impressive! You've conquered the longest structure ever built " +
      "by humans. It is actually a collection of many walls built " +
      "over several centuries.",
  },
  {
    id: "b2000002-0000-0000-0000-000000000003",
    programId: PROGRAM_IDS.globalLandmark,
    sequenceOrder: 3,
    label: "Site-Gamma",
    question:
      "I am a colossal copper statue standing in New York Harbor, " +
      "holding a torch high as a symbol of freedom. Who am I?",
    correctAnswer: "Statue of Liberty",
    successMessage:
      "Excellent! A gift from France to the U.S., she has welcomed " +
      "millions of people to American shores since 1886. Her " +
      "official name is 'Liberty Enlightening the World.'",
  },
  {
    id: "b2000002-0000-0000-0000-000000000004",
    programId: PROGRAM_IDS.globalLandmark,
    sequenceOrder: 4,
    label: "Site-Delta",
    question:
      "Located in Giza, Egypt, I am the oldest and largest of the " +
      "three pyramids and was the tallest man-made structure for " +
      "over 3,800 years. What am I?",
    correctAnswer: "Great Pyramid of Giza",
    successMessage:
      "A monumental achievement! You've solved the mystery of the " +
      "last remaining wonder of the ancient world, built for the " +
      "Pharaoh Khufu.",
  },

  // The Cosmic Voyager's Journey — space
  {
    id: "c1c2c3c4-0003-0000-0000-000000000001",
    programId: PROGRAM_IDS.cosmicVoyager,
    sequenceOrder: 1,
    label: "Orbit-01",
    question:
      "I am the largest planet in our solar system, famous for a " +
      "giant red spot that is actually a storm. Which planet am I?",
    correctAnswer: "Jupiter",
    successMessage:
      "Correct! Jupiter's Great Red Spot has been raging for " +
      "hundreds of years.",
  },
  {
    id: "c1c2c3c4-0003-0000-0000-000000000002",
    programId: PROGRAM_IDS.cosmicVoyager,
    sequenceOrder: 2,
    label: "Orbit-02",
    question:
      "I am the closest planet to the Sun, yet not the hottest. " +
      "Named after the messenger god. Who am I?",
    correctAnswer: "Mercury",
    successMessage: "Right — Mercury races around the Sun in just 88 days.",
  },
  {
    id: "c1c2c3c4-0003-0000-0000-000000000003",
    programId: PROGRAM_IDS.cosmicVoyager,
    sequenceOrder: 3,
    label: "Orbit-03",
    question:
      "Earth's natural satellite, and the only place beyond our " +
      "planet humans have walked. What am I?",
    correctAnswer: "Moon",
    successMessage: "Exactly! The Moon is about 238,855 miles away.",
  },

  // Legends of the Ancient Pantheon — mythology
  {
    id: "c1c2c3c4-0004-0000-0000-000000000001",
    programId: PROGRAM_IDS.ancientPantheon,
    sequenceOrder: 1,
    label: "Myth-01",
    question:
      "I am the king of the Greek gods, ruler of Mount Olympus, and " +
      "thrower of lightning bolts. Who am I?",
    correctAnswer: "Zeus",
    successMessage: "Correct! Zeus, the thunder-wielding ruler of the gods.",
  },
  {
    id: "c1c2c3c4-0004-0000-0000-000000000002",
    programId: PROGRAM_IDS.ancientPantheon,
    sequenceOrder: 2,
    label: "Myth-02",
    question:
      "I am the Greek goddess of wisdom, war strategy, and patron of " +
      "Athens, born from Zeus's head. Who am I?",
    correctAnswer: "Athena",
    successMessage: "Right! Athena gave her name to the city of Athens.",
  },
  {
    id: "c1c2c3c4-0004-0000-0000-000000000003",
    programId: PROGRAM_IDS.ancientPantheon,
    sequenceOrder: 3,
    label: "Myth-03",
    question:
      "I am the three-headed guard dog who watches the gates of the " +
      "Underworld. What am I?",
    correctAnswer: "Cerberus",
    successMessage:
      "Exactly! Cerberus made sure no soul left Hades without " + "permission.",
  },

  // The Harmonic Code — music
  {
    id: "c1c2c3c4-0005-0000-0000-000000000001",
    programId: PROGRAM_IDS.harmonicCode,
    sequenceOrder: 1,
    label: "Note-01",
    question:
      "I am a musical instrument with 88 keys — 52 white and 36 " +
      "black. What am I?",
    correctAnswer: "Piano",
    successMessage: "Correct! The piano's 88 keys span over seven octaves.",
  },
  {
    id: "c1c2c3c4-0005-0000-0000-000000000002",
    programId: PROGRAM_IDS.harmonicCode,
    sequenceOrder: 2,
    label: "Note-02",
    question:
      "I am the Italian word for 'loud', written as two f's when " +
      "doubled. What musical term am I?",
    correctAnswer: "Forte",
    successMessage: "Right! Forte, and fortissimo (ff) means very loud.",
  },
  {
    id: "c1c2c3c4-0005-0000-0000-000000000003",
    programId: PROGRAM_IDS.harmonicCode,
    sequenceOrder: 3,
    label: "Note-03",
    question:
      "I am the symbol at the start of a staff that tells you which " +
      "notes live on which lines. What am I called?",
    correctAnswer: "Clef",
    successMessage: "Exactly! The treble clef is the most familiar one.",
  },

  // Creatures of the Wild — animals
  {
    id: "c1c2c3c4-0006-0000-0000-000000000001",
    programId: PROGRAM_IDS.creaturesOfTheWild,
    sequenceOrder: 1,
    label: "Habitat-01",
    question:
      "I am the largest animal ever to have lived, bigger than any " +
      "dinosaur, and I live in the ocean. What am I?",
    correctAnswer: "Blue whale",
    successMessage: "Correct! A blue whale can weigh as much as 30 elephants.",
  },
  {
    id: "c1c2c3c4-0006-0000-0000-000000000002",
    programId: PROGRAM_IDS.creaturesOfTheWild,
    sequenceOrder: 2,
    label: "Habitat-02",
    question:
      "I am the fastest land animal, able to sprint from 0 to 60 mph " +
      "in about three seconds. Who am I?",
    correctAnswer: "Cheetah",
    successMessage: "Right! Cheetahs use their speed to chase down prey.",
  },
  {
    id: "c1c2c3c4-0006-0000-0000-000000000003",
    programId: PROGRAM_IDS.creaturesOfTheWild,
    sequenceOrder: 3,
    label: "Habitat-03",
    question:
      "I am the tallest animal in the world, with a neck that lets " +
      "me reach leaves high in trees. What am I?",
    correctAnswer: "Giraffe",
    successMessage: "Exactly! A giraffe's neck alone can be six feet long.",
  },

  // The Culinary Crossroads — food
  {
    id: "c1c2c3c4-0007-0000-0000-000000000001",
    programId: PROGRAM_IDS.culinaryCrossroads,
    sequenceOrder: 1,
    label: "Dish-01",
    question:
      "I am a breakfast food made from beaten eggs, cooked in a pan, " +
      "and often folded with cheese or vegetables. What am I?",
    correctAnswer: "Omelet",
    successMessage:
      "Correct! Omelets are a breakfast classic in many cultures.",
  },
  {
    id: "c1c2c3c4-0007-0000-0000-000000000002",
    programId: PROGRAM_IDS.culinaryCrossroads,
    sequenceOrder: 2,
    label: "Dish-02",
    question:
      "I am a frozen dessert, traditionally made from cream and " +
      "sugar, and served in a cone or bowl. What am I?",
    correctAnswer: "Ice cream",
    successMessage: "Right! Ice cream has been enjoyed for centuries.",
  },
  {
    id: "c1c2c3c4-0007-0000-0000-000000000003",
    programId: PROGRAM_IDS.culinaryCrossroads,
    sequenceOrder: 3,
    label: "Dish-03",
    question:
      "I am a round, flat piece of dough topped with tomato sauce " +
      "and cheese, baked in a hot oven. What am I?",
    correctAnswer: "Pizza",
    successMessage: "Exactly! Pizza originated in Naples, Italy.",
  },

  // The World Atlas Challenge — geography
  {
    id: "c1c2c3c4-0008-0000-0000-000000000001",
    programId: PROGRAM_IDS.worldAtlasChallenge,
    sequenceOrder: 1,
    label: "Atlas-01",
    question:
      "I am the legendary river of Egypt, flowing north past the " +
      "Great Pyramids. What river am I?",
    correctAnswer: "Nile",
    successMessage: "Correct! The Nile is roughly 4,100 miles long.",
  },
  {
    id: "c1c2c3c4-0008-0000-0000-000000000002",
    programId: PROGRAM_IDS.worldAtlasChallenge,
    sequenceOrder: 2,
    label: "Atlas-02",
    question:
      "I am the largest desert on Earth, covering much of northern " +
      "Africa. What desert am I?",
    correctAnswer: "Sahara",
    successMessage: "Right! The Sahara is about the size of the United States.",
  },
  {
    id: "c1c2c3c4-0008-0000-0000-000000000003",
    programId: PROGRAM_IDS.worldAtlasChallenge,
    sequenceOrder: 3,
    label: "Atlas-03",
    question:
      "I am the highest mountain on Earth, standing 29,032 feet in " +
      "the Himalayas. What am I?",
    correctAnswer: "Mount Everest",
    successMessage:
      "Exactly! Everest's peak is the closest point to outer space " +
      "on Earth's surface.",
  },

  // The Number Cruncher's Gauntlet — mathematics
  {
    id: "c1c2c3c4-0009-0000-0000-000000000001",
    programId: PROGRAM_IDS.numberCrunchersGauntlet,
    sequenceOrder: 1,
    label: "Prime-01",
    question: "I am the only even prime number. What number am I?",
    correctAnswer: "Two",
    successMessage:
      "Correct! Every other even number is divisible by 2, so only " +
      "2 is both even and prime.",
  },
  {
    id: "c1c2c3c4-0009-0000-0000-000000000002",
    programId: PROGRAM_IDS.numberCrunchersGauntlet,
    sequenceOrder: 2,
    label: "Prime-02",
    question:
      "I am the number of sides on a triangle and the number of " +
      "corners too. What number am I?",
    correctAnswer: "Three",
    successMessage:
      "Right! A triangle has exactly three sides and three vertices.",
  },
  {
    id: "c1c2c3c4-0009-0000-0000-000000000003",
    programId: PROGRAM_IDS.numberCrunchersGauntlet,
    sequenceOrder: 3,
    label: "Prime-03",
    question:
      "I am the mathematical constant that equals roughly 3.14159, " +
      "used to find the area of a circle. What am I?",
    correctAnswer: "Pi",
    successMessage:
      "Exactly! Pi is an irrational number that never ends or " + "repeats.",
  },

  // Tales from the Bookshelf — literature
  {
    id: "c1c2c3c4-000a-0000-0000-000000000001",
    programId: PROGRAM_IDS.talesFromTheBookshelf,
    sequenceOrder: 1,
    label: "Chapter-01",
    question:
      "I am the famous detective of 221B Baker Street, known for my " +
      "deerstalker hat and logical deductions. Who am I?",
    correctAnswer: "Sherlock Holmes",
    successMessage:
      "Correct! Sherlock Holmes first appeared in 'A Study in " + "Scarlet'.",
  },
  {
    id: "c1c2c3c4-000a-0000-0000-000000000002",
    programId: PROGRAM_IDS.talesFromTheBookshelf,
    sequenceOrder: 2,
    label: "Chapter-02",
    question:
      "I am the young wizard with a lightning-bolt scar who attends " +
      "Hogwarts School of Witchcraft and Wizardry. Who am I?",
    correctAnswer: "Harry Potter",
    successMessage: "Right! Harry's story begins on Privet Drive.",
  },
  {
    id: "c1c2c3c4-000a-0000-0000-000000000003",
    programId: PROGRAM_IDS.talesFromTheBookshelf,
    sequenceOrder: 3,
    label: "Chapter-03",
    question:
      "I am a classic children's book about a spider who saves a " +
      "pig's life with her web. What is my title?",
    correctAnswer: "Charlotte's Web",
    successMessage: "Exactly! Charlotte's Web, by E.B. White.",
  },
];

/** Compiles the full real seed as one SQL script (statements joined by `\n`). */
export function generateSeedSql(): string {
  const seedProgramIds = Object.values(PROGRAM_IDS);

  // Scoped cleanup: retires system-seeded programs (author_id IS NULL)
  // that are no longer part of the seed set. Never touches
  // user-authored programs (author_id set) — upsert below never
  // deletes anything either, so this is the only destructive
  // statement, and it's bounded to rows this script owns.
  //
  // NOTE: the E2E fixture program (scripts/seedE2eData.ts) also has
  // author_id IS NULL, so running `seed:local`/`seed:preview`/`seed:prod`
  // will remove it if present — harmless, since `bun run test:e2e`
  // always re-seeds it via `seed:e2e:local` immediately before running
  // Playwright. Don't rely on the E2E program surviving a real reseed.
  const idList = sql.join(
    seedProgramIds.map((id) => sql.param(id, programs.id)),
    sql.raw(", "),
  );
  const cleanup = deleteWhereSql(
    programs,
    sql`${programs.authorId} is null and ${programs.id} not in (${idList})`,
  );

  const statements = [
    cleanup,
    insertSql(programs, programRows, upsertConflict(programs, programRows)),
    insertSql(gates, gateRows, upsertConflict(gates, gateRows)),
  ];

  return statements.join("\n");
}
