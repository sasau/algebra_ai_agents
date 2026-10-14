import { z } from "zod";

// TODO 1: replace this placeholder with the precise input contract and description,
// then set readerContractComplete to true. Do not change the shared reader itself.
// Reference: src/reference/01-reader-schema.ts. The incomplete reader never opens a file.
export const readerInputSchema = z.object({ path: z.string() }).strict();
export const readerDescription = "Incomplete student read_file tool. Complete TODO 1 before reading fixture files.";
export const readerContractComplete: boolean = false;
