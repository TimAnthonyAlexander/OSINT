export type Target = "person" | "company";

export type PersonQuery = {
  target: "person";
  username?: string;
  email?: string;
  name?: string;
};

export type CompanyQuery = {
  target: "company";
  domain?: string;
  name?: string;
};

export type Query = PersonQuery | CompanyQuery;

export type SourceResult = {
  source: string;
  label: string;
  found: boolean;
  url?: string;
  detail?: string;
};

export type Source = {
  id: string;
  label: string;
  category: Target;
  run(query: Query): Promise<SourceResult[]>;
};
