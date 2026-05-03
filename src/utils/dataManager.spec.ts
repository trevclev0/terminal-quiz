import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  defaultNullishGateProps,
  defaultNullishProgramProps,
} from "../../tests/testTypes";
import type { ProgramWithGates } from "../db/types";
import {
  decodeStringToObject,
  encodeObjectToString,
  loadPrograms,
  savePrograms,
} from "./dataManager";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const singleProgram: ProgramWithGates[] = [
  {
    id: "a963c64b-7e2a-457b-862d-94b371a6ee01",
    name: "Adventure One",
    isSelected: true,
    ...defaultNullishProgramProps,
    gates: [
      {
        id: "7700cd79-0e59-45c9-a00d-137bb53f793a",
        label: "r1",
        correctAnswer: "secret",
        question: "What has keys but no locks?",
        successMessage: "A keyboard",
        isSolved: false,
        ...defaultNullishGateProps,
        programId: "a963c64b-7e2a-457b-862d-94b371a6ee01",
        sequenceOrder: 1,
      },
    ],
  },
];

const multiplePrograms: ProgramWithGates[] = [
  ...singleProgram,
  {
    id: "0af45993-84e5-4b1d-968b-a22d2d06ccf1",
    name: "Adventure Two",
    isSelected: false,
    ...defaultNullishProgramProps,
    gates: [
      {
        id: "83cc0687-61ac-42ec-b09a-4f5a73ebdfc5",
        label: "r2",
        correctAnswer: "opensesame",
        question: "I speak without a mouth.",
        successMessage: "An echo",
        isSolved: true,
        ...defaultNullishGateProps,
        programId: "0af45993-84e5-4b1d-968b-a22d2d06ccf1",
        sequenceOrder: 2,
      },
      {
        id: "24b658a1-9fce-479e-a190-32b4b84745b1",
        label: "r3",
        correctAnswer: "alakazam",
        question: "The more you take, the more you leave behind.",
        successMessage: "Footsteps",
        isSolved: false,
        ...defaultNullishGateProps,
        programId: "0af45993-84e5-4b1d-968b-a22d2d06ccf1",
        sequenceOrder: 3,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// MSW Setup
// ---------------------------------------------------------------------------

// Define the handlers for your API
const handlers = [
  http.get("/api/programs", () => {
    return HttpResponse.json(multiplePrograms);
  }),
];

const server = setupServer(...handlers);

// Lifecycle hooks for the mock server
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// encodeObjectToString
// ---------------------------------------------------------------------------

describe("encodeObjectToString", () => {
  it("returns a non-empty string", () => {
    const result = encodeObjectToString(singleProgram);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns a space-separated string of numeric byte values", () => {
    const result = encodeObjectToString(singleProgram);
    const parts = result.split(" ");
    // Every token should be a valid base-10 integer
    parts.forEach((part) => {
      expect(Number.parseInt(part, 10)).not.toBeNaN();
    });
  });

  it("encodes an empty array without throwing", () => {
    expect(() => encodeObjectToString([])).not.toThrow();
    const result = encodeObjectToString([]);
    expect(typeof result).toBe("string");
  });

  it("produces different output for different inputs", () => {
    const resultA = encodeObjectToString(singleProgram);
    const resultB = encodeObjectToString(multiplePrograms);
    expect(resultA).not.toBe(resultB);
  });
});

// ---------------------------------------------------------------------------
// decodeStringToObject
// ---------------------------------------------------------------------------

describe("decodeStringToObject", () => {
  it("round-trips a single program back to the original value", () => {
    const encoded = encodeObjectToString(singleProgram);
    expect(decodeStringToObject(encoded)).toEqual(singleProgram);
  });

  it("round-trips multiple programs back to the original value", () => {
    const encoded = encodeObjectToString(multiplePrograms);
    expect(decodeStringToObject(encoded)).toEqual(multiplePrograms);
  });

  it("round-trips an empty array", () => {
    const encoded = encodeObjectToString([]);
    expect(decodeStringToObject(encoded)).toEqual([]);
  });

  it("preserves all Riddle fields through the encode/decode cycle", () => {
    const encoded = encodeObjectToString(multiplePrograms);
    const decoded = decodeStringToObject(encoded);

    const riddle = decoded[1].gates[0];
    expect(riddle.label).toBe("r2");
    expect(riddle.correctAnswer).toBe("opensesame");
    expect(riddle.isSolved).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// savePrograms
// ---------------------------------------------------------------------------

describe("savePrograms", () => {
  beforeEach(() => {
    vi.spyOn(window.localStorage, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  it("calls localStorage.setItem with the correct storage key", async () => {
    await savePrograms(singleProgram);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      "programs",
      expect.any(String),
    );
  });

  it("stores a value that decodes back to the original programs", async () => {
    await savePrograms(multiplePrograms);
    const stored = window.localStorage.getItem("programs");
    expect(stored).not.toBeNull();
    if (stored === null) throw new Error("stored should not be null");
    expect(decodeStringToObject(stored)).toEqual(multiplePrograms);
  });

  it("stores an empty array without throwing", async () => {
    await expect(savePrograms([])).resolves.not.toThrow();
    const stored = window.localStorage.getItem("programs");
    if (stored === null) throw new Error("stored should not be null");
    expect(decodeStringToObject(stored)).toEqual([]);
  });

  it("overwrites a previously saved value", async () => {
    await savePrograms(singleProgram);
    await savePrograms(multiplePrograms);

    // setItem should have been called twice
    expect(window.localStorage.setItem).toHaveBeenCalledTimes(2);

    const stored = window.localStorage.getItem("programs");
    // Final value should reflect the last write
    if (stored === null) throw new Error("stored should not be null");
    expect(decodeStringToObject(stored)).toEqual(multiplePrograms);
  });
});

// ---------------------------------------------------------------------------
// loadPrograms
// ---------------------------------------------------------------------------

describe("loadPrograms", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(window.localStorage, "getItem");
    vi.spyOn(window.localStorage, "removeItem");
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.localStorage.clear();
  });

  describe("when valid data exists in localStorage", () => {
    it("returns the decoded programs without fetching", async () => {
      const encoded = encodeObjectToString(multiplePrograms);
      window.localStorage.setItem("programs", encoded);

      const fetchSpy = vi.spyOn(globalThis, "fetch");
      const result = await loadPrograms();

      expect(result).toEqual(multiplePrograms);
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("when localStorage is empty", () => {
    it("fetches from /api/programs", async () => {
      server.use(
        http.get("/api/programs", () => {
          return HttpResponse.json(singleProgram);
        }),
      );

      const result = await loadPrograms();
      expect(result).toEqual(singleProgram);
    });

    it("returns the decoded programs from the fetch response", async () => {
      const result = await loadPrograms();
      expect(result).toEqual(multiplePrograms);
    });

    it("throws a descriptive error when the fetch response is not ok", async () => {
      server.use(
        http.get("/api/programs", () => {
          return new HttpResponse(null, { status: 404 });
        }),
      );

      await expect(loadPrograms()).rejects.toThrow(
        "Failed to fetch programs: 404",
      );
    });

    it("propagates network-level fetch errors", async () => {
      server.use(
        http.get("/api/programs", () => {
          return HttpResponse.error(); // Simulates a network failure (no response)
        }),
      );
      await expect(loadPrograms()).rejects.toThrow();
    });
  });

  describe("when localStorage contains corrupt data", () => {
    beforeEach(() => {
      // Store something that will pass localStorage.getItem but fail msgpack decode
      window.localStorage.setItem("programs", "this is not valid msgpack data");
    });

    it("logs a warning", async () => {
      await loadPrograms();

      expect(console.warn).toHaveBeenCalledWith(
        "Corrupt localStorage data, falling back to fetch.",
      );
    });

    it("removes the corrupt entry from localStorage", async () => {
      await loadPrograms();

      expect(window.localStorage.removeItem).toHaveBeenCalledWith("programs");
    });

    it("falls back to fetch and returns the fetched programs", async () => {
      const result = await loadPrograms();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Corrupt localStorage"),
      );
      expect(window.localStorage.removeItem).toHaveBeenCalledWith("programs");
      expect(result).toEqual(multiplePrograms);
    });

    it("throws when the fallback fetch also fails", async () => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      await expect(loadPrograms()).rejects.toThrow(
        "Failed to fetch programs: 500",
      );
    });
  });
});
