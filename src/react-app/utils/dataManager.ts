import { decode, encode } from "@msgpack/msgpack";
import type { ProgramWithGates } from "@shared/types";
import type { AppType } from "@worker/index";
import { hc } from "hono/client";

const client = hc<AppType>("/");

const PROGRAM_DATA_KEY = "programs";

/**
 * Load the programs from local storage or from a HTTP request
 *
 * @returns {Promise<ProgramWithGates[]>} A promise that resolves to an array of programs.
 */
export const loadPrograms = async (): Promise<ProgramWithGates[]> => {
  const raw = window.localStorage.getItem(PROGRAM_DATA_KEY);
  if (raw) {
    try {
      return decodeStringToObject(raw);
    } catch {
      console.warn("Corrupt localStorage data, falling back to fetch.");
      window.localStorage.removeItem(PROGRAM_DATA_KEY);
    }
  }
  const rsp = await client.api.programs.$get();
  if (!rsp.ok) throw new Error(`Failed to fetch programs: ${rsp.status}`);

  const data = await rsp.json();

  return data.map((p) => ({
    ...p,
    selectedAt: p.selectedAt ? new Date(p.selectedAt) : null,
    completedAt: p.completedAt ? new Date(p.completedAt) : null,
    createdAt: new Date(p.createdAt),
    gates: (p.gates ?? []).map((g) => ({
      ...g,
      solvedAt: g.solvedAt ? new Date(g.solvedAt) : null,
      createdAt: new Date(g.createdAt),
    })),
  }));
};

/**
 * Saves the given array of programs to local storage after encoding them.
 *
 * @param programs The programs to be saved
 */
export const savePrograms = async (
  programs: ProgramWithGates[],
): Promise<void> => {
  const programData = encodeObjectToString(programs);
  window.localStorage.setItem(PROGRAM_DATA_KEY, programData);
};

/**
 * Encodes a JavaScript object using MessagePack and converts the result to a string.
 *
 * @param programs The JavaScript object to encode
 * @returns The encoded string representation of the object.
 */
export const encodeObjectToString = (programs: ProgramWithGates[]): string => {
  const encodedArray = encode(programs) as Uint8Array;
  const encodedString = Array.from(encodedArray)
    .map((byte) => byte.toString())
    .join(" ");

  return encodedString;
};

/**
 * Decodes a string representation of an object back into the original JavaScript object.
 *
 * @param encStr The encoded string representation of the object
 * @returns The decoded JavaScript object.
 */
export const decodeStringToObject = (encStr: string): ProgramWithGates[] => {
  const byteArray = encStr.split(" ").map((byte) => Number.parseInt(byte, 10));
  const uInt8Array = Uint8Array.from(byteArray);
  const decodedObject = decode(uInt8Array) as ProgramWithGates[];

  return decodedObject;
};
