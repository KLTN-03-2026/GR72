export type SeedValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export type SeedRow = Record<string, SeedValue>;

export type TableSeeder = {
  table: string;
  rows: SeedRow[];
};
