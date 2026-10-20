import { canonicalJson } from "@conceptor/core";

export const reverseDerivationManifestKey = (subject: string, prefix: string): string => canonicalJson([subject, prefix]);
