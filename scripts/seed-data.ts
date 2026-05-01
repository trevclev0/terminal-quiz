/**
 * seed-data.ts
 *
 * Seed data for the terminal-quest database. Data is defined directly as typed
 * TypeScript arrays matching the Drizzle schema's insert types — no file system
 * dependency, no transformation layer.
 *
 * UUIDs are stable constants so that the programId foreign key on gates remains
 * consistent across repeated seed runs.
 *
 * Consumed by:
 *   - scripts/seed.ts  (writes to local D1 via better-sqlite3)
 */

import type { InferInsertModel } from "drizzle-orm";
import type { gates, programs } from "../src/db/schema";

type NewProgram = InferInsertModel<typeof programs>;
type NewGate = InferInsertModel<typeof gates>;

// ---------------------------------------------------------------------------
// Stable program IDs (fixed so gate foreign keys remain consistent)
// ---------------------------------------------------------------------------

const PROGRAM_IDS = {
  digitalPioneer: "a1b2c3d4-0001-0001-0001-000000000001",
  globalLandmark: "a1b2c3d4-0002-0002-0002-000000000002",
  juliesMothersDay: "a1b2c3d4-0003-0003-0003-000000000003",
} as const;

// ---------------------------------------------------------------------------
// Programs
// ---------------------------------------------------------------------------

export const programRows: NewProgram[] = [
  {
    id: PROGRAM_IDS.digitalPioneer,
    name: "The Digital Pioneer's Quest",
    isSelected: false,
    selectedAt: null,
    completedAt: null,
  },
  {
    id: PROGRAM_IDS.globalLandmark,
    name: "The Global Landmark Expedition",
    isSelected: false,
    selectedAt: null,
    completedAt: null,
  },
  {
    id: PROGRAM_IDS.juliesMothersDay,
    name: "Julie's Mother's Day Adventure",
    isSelected: false,
    selectedAt: null,
    completedAt: null,
  },
];

// ---------------------------------------------------------------------------
// Gates
// ---------------------------------------------------------------------------

export const gateRows: NewGate[] = [
  // The Digital Pioneer's Quest
  {
    id: "b1000001-0000-0000-0000-000000000001",
    programId: PROGRAM_IDS.digitalPioneer,
    label: "Log-001",
    question:
      "I was the world's first computer programmer, having written an algorithm for the Analytical Engine in the mid-1800s. Who am I?",
    correctAnswer: "Ada Lovelace",
    successMessage:
      "Correct! Ada Lovelace saw the potential for computers to do more than just crunch numbers, envisioning them as tools for creativity and logic.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b1000001-0000-0000-0000-000000000002",
    programId: PROGRAM_IDS.digitalPioneer,
    label: "Log-002",
    question:
      "In 1947, a physical moth was found trapped in a relay of the Harvard Mark II computer. This incident popularized what 3-letter term for a technical error?",
    correctAnswer: "Bug",
    successMessage:
      "Exactly! Grace Hopper's team literally 'debugged' the machine by removing the moth and taping it into their logbook.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b1000001-0000-0000-0000-000000000003",
    programId: PROGRAM_IDS.digitalPioneer,
    label: "Log-003",
    question:
      "I am the foundational protocol of the World Wide Web, used to transmit data between a client and a server. I usually come before a '://' in your browser.",
    correctAnswer: "HTTP",
    successMessage:
      "You've got it. Hypertext Transfer Protocol is the language of the web, allowing us to fetch the very resources you're looking at right now.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b1000001-0000-0000-0000-000000000004",
    programId: PROGRAM_IDS.digitalPioneer,
    label: "Log-004",
    question:
      "Created by Linus Torvalds in 2005, I am the most widely used version control system in the world. What is my name?",
    correctAnswer: "Git",
    successMessage:
      "Spot on. Whether you are branching, merging, or committing, Git is the backbone of modern collaborative software development.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b1000001-0000-0000-0000-000000000005",
    programId: PROGRAM_IDS.digitalPioneer,
    label: "Log-005",
    question:
      "I am a simple, logic-based test proposed in 1950 to determine if a machine can exhibit intelligent behavior indistinguishable from a human. What am I called?",
    correctAnswer: "Turing Test",
    successMessage:
      "Excellent. Alan Turing's 'Imitation Game' remains a philosophical cornerstone in the field of Artificial Intelligence.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },

  // The Global Landmark Expedition
  {
    id: "b2000002-0000-0000-0000-000000000001",
    programId: PROGRAM_IDS.globalLandmark,
    label: "Site-Alpha",
    question:
      "I am a wrought-iron lattice tower in Paris, originally built for the 1889 World's Fair. What is my name?",
    correctAnswer: "Eiffel Tower",
    successMessage:
      "Magnifique! You've found the 'Iron Lady.' Fun fact: she was originally intended to be a temporary structure, but her height made her perfect for radio transmissions!",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b2000002-0000-0000-0000-000000000002",
    programId: PROGRAM_IDS.globalLandmark,
    label: "Site-Beta",
    question:
      "I am a massive ancient wall that winds across thousands of miles to protect the northern borders of China. What am I called?",
    correctAnswer: "Great Wall of China",
    successMessage:
      "Impressive! You've conquered the longest structure ever built by humans. It is actually a collection of many walls built over several centuries.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b2000002-0000-0000-0000-000000000003",
    programId: PROGRAM_IDS.globalLandmark,
    label: "Site-Gamma",
    question:
      "I am a colossal copper statue standing in New York Harbor, holding a torch high as a symbol of freedom. Who am I?",
    correctAnswer: "Statue of Liberty",
    successMessage:
      "Excellent! A gift from France to the U.S., she has welcomed millions of people to American shores since 1886. Her official name is 'Liberty Enlightening the World.'",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b2000002-0000-0000-0000-000000000004",
    programId: PROGRAM_IDS.globalLandmark,
    label: "Site-Delta",
    question:
      "Located in Giza, Egypt, I am the oldest and largest of the three pyramids and was the tallest man-made structure for over 3,800 years. What am I?",
    correctAnswer: "Great Pyramid of Giza",
    successMessage:
      "A monumental achievement! You've solved the mystery of the last remaining wonder of the ancient world, built for the Pharaoh Khufu.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },

  // Julie's Mother's Day Adventure
  {
    id: "b3000003-0000-0000-0000-000000000001",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #1",
    question: "What phrase is said when one of us is frustrated?",
    correctAnswer: "Fatti maschi",
    successMessage:
      'Ah yes, "Strong deeds, gentle words."... perfect for a state motto, or when you\'ve been slighted.',
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000002",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #2",
    question:
      "What did Chelsea mistakenly misname for years in Nebraska until she was corrected in Utah?",
    correctAnswer: "Thinning shears",
    successMessage: "The poor dear...",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000003",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #3",
    question: "What is our one, only true regret from our entire marriage?",
    correctAnswer: "She Who Must Not Be Named",
    successMessage: "Worse than He-Who-Must-Not-Be-Named.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000004",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #4",
    question:
      "What activity helped us realize that we are two different people who just do things differently, and that is okay?",
    correctAnswer: "Brushing teeth",
    successMessage:
      "For the record, the right way is water first, then toothpaste.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000005",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #5",
    question: "What activity helped us realize that I must be cold-blooded?",
    correctAnswer: "Showering",
    successMessage:
      "I think I mostly tend to like warmer showers than you now.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000006",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #6",
    question: "What is another term we have used for attractive or appealing?",
    correctAnswer: "Boxy",
    successMessage: "Boxy is the new sexy.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000007",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #7",
    question: "What nickname did I think would be awesome for a son?",
    correctAnswer: "OJ",
    successMessage:
      "Yeah, probably best to wait another generation or two before bringing that one into the mix.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000008",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #8",
    question:
      "What did we think was a bit odd that Kevin and Kristin Newman said they would never do?",
    correctAnswer: "Share drinks",
    successMessage:
      "I'm glad that what is mine is your and what's yours is mine.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000009",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #9",
    question:
      "Around age 2, what would Gideon say that we perfectly understood, but then again, never really did?",
    correctAnswer: "Soda doesn't mind",
    successMessage: "That might be the first thing I ask when I get to heaven.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000010",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #10",
    question: "What unappealing food were you glad to choose in the end?",
    correctAnswer: "Salmon",
    successMessage:
      "Liverpostej is actually not so bad. Kind of like refried beans.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000011",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #11",
    question:
      "What band name were you surprised, perhaps appalled to learn of?",
    correctAnswer: "Moldy Peaches",
    successMessage: "Never would have guessed that we both like moldy peaches.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000012",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #12",
    question:
      "What was initially perceived as a concern for disaster which quickly was an impressive feat, accomplished by Trevor?",
    correctAnswer: "Mexican pizza",
    successMessage: "Luckily, I learned that one from my Mother.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000013",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #13",
    question:
      "What was said as a jestful invitation to call calm any anxiousness towards endowment?",
    correctAnswer: "Goat",
    successMessage: "No comment.",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
  {
    id: "b3000003-0000-0000-0000-000000000014",
    programId: PROGRAM_IDS.juliesMothersDay,
    label: "Question #14",
    question: "______, isn't it about...time?",
    correctAnswer: "Family",
    successMessage:
      "To find what you seek, look beyond the blanked word... Good luck and Happy Mother's Day!",
    isSolved: false,
    solvedAt: null,
    attemptCount: 0,
    acceptanceThreshold: 0.875,
    guidanceEnabled: false,
    guidancePrompt: null,
    guidanceThreshold: 2,
  },
];
