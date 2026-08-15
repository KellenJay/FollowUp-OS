export type HHHBucket = "Helpful" | "Honest" | "Harmless";

export type Dimension = {
  id: string;
  name: string;
  hhh: HHHBucket;
  question: string;
  low?: string;
  medium?: string;
  high?: string;
};

export type TestCaseLabel = "BAD" | "AVERAGE" | "GOOD";

export type TestCase = {
  label: TestCaseLabel;
  score: number;
  input_type?: string;
  input_description?: string;
  ground_truth?: string;
  evals?: Record<string, string>;
  candidate_input: unknown;
  candidate_output: unknown;
};

export type DecisionPointConfig = {
  product_name: string;
  product_description: string;
  app_model: string;
  grader_model: string;
  decision_point: string;
  dimensions: Dimension[];
  test_cases: TestCase[];
};

export type GradeResult = {
  dimensionScores: Record<string, number>;
  totalScore: number;
  reasoning: string;
};
