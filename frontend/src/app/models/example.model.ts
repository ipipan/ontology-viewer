export interface Argument {
  id: string;
  text: string;
  type: string;
  order?: number;
}

export interface Connective {
  id: string;
  text: string;
  order?: number;
}

export type OrderedElement =
  | { kind: 'arg1'; data: Argument }
  | { kind: 'arg2'; data: Argument }
  | { kind: 'connective'; data: Connective };

export interface Example {
  id: string;
  text: string;
  language: string;
  relation: string;
  symmetric: boolean | null;
  corpus: string;
  ontology_types: string[];
  provenance: string;
  notation?: string;
  arg1: Argument[];
  arg2: Argument[];
  connective: Connective[];
}

export interface Corpus {
  name: string;
  language: string;
  file: string;
  count: number;
}

export interface PaginatedResponse {
  total: number;
  page: number;
  page_size: number;
  results: Example[];
}

export interface ConnectiveData {
  label: string;
  count: number;
}

export interface FilterParams {
  corpus?: string[];
  language?: string;
  connective?: string;
  relation?: string;
  symmetric?: boolean;
  q?: string;
  page?: number;
  page_size?: number;
  sort?: string;
}