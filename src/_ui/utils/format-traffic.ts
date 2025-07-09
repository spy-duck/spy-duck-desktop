import { round } from "lodash-es";

export function formatTraffic(bytes: number, precision = 1): string {
  if (!bytes) {
    return "0";
  }
  const map = ["b", "Kb", "Mb", "Gb", "Tb", "Pb"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${round(bytes / 1024 ** i, precision)}${map[i]}`;
}
