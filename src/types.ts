// --- Management API response types ---

export interface Counter {
  id: number;
  name: string;
  site: string;
  status: string;
  type: string;
  owner_login: string;
  goals?: Goal[];
  mirrors2?: Array<{ site: string }>;
  grants?: Grant[];
  filters?: Filter[];
  operations?: Operation[];
}

export interface CountersResponse {
  counters: Counter[];
  rows: number;
}

export interface CounterResponse {
  counter: Counter;
}

export interface Goal {
  id: number;
  name: string;
  type: string;
  is_retargeting: number;
  conditions?: Array<{ type: string; url: string }>;
}

export interface GoalsResponse {
  goals: Goal[];
}

export interface Grant {
  user_login: string;
  perm: "view" | "edit" | "own";
  created_at: string;
  comment?: string;
}

export interface Filter {
  id: number;
  attr: string;
  type: string;
  value: string;
  action: string;
  status: string;
}

export interface Operation {
  id: number;
  action: string;
  attr: string;
  value: string;
  status: string;
}

export interface Segment {
  segment_id: number;
  counter_id: number;
  name: string;
  expression: string;
  created_at: string;
}

export interface Label {
  id: number;
  name: string;
}

export interface LogRequest {
  request_id: number;
  counter_id: number;
  source: string;
  date1: string;
  date2: string;
  fields: string[];
  status: string;
  size?: number;
  parts?: Array<{ part_number: number; size: number }>;
}

// --- Stat API response types ---

export interface StatResponse {
  query: StatQuery;
  data: StatRow[];
  total_rows: number;
  total_rows_rounded: boolean;
  sampled: boolean;
  sample_share: number;
  sample_size: number;
  sample_space: number;
  data_lag: number;
  totals: number[];
  min: number[];
  max: number[];
}

export interface StatQuery {
  ids: number[];
  metrics: string[];
  dimensions: string[];
  date1: string;
  date2: string;
  filters?: string;
  sort: string[];
  limit: number;
  offset: number;
}

export interface StatRow {
  dimensions: Array<{ name: string; id?: string; icon_id?: number; icon_type?: string }>;
  metrics: number[][];
}

export interface ByTimeResponse extends StatResponse {
  time_intervals: string[][];
}

// --- Error types ---

export interface ApiErrorDetail {
  error_type: string;
  message: string;
}

export interface ManagementErrorResponse {
  errors: ApiErrorDetail[];
  code: number;
  message: string;
}
