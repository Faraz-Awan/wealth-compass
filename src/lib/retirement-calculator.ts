export const MAX_PROJECTION = 100_000_000_000_000;

export const RETURN_SCENARIOS = [
  { label: "Lower", rate: 5 },
  { label: "Middle", rate: 7 },
  { label: "Higher", rate: 9 },
] as const;

export type CalculationInputs = {
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  annualContribution: number;
  returnRate: number;
  increaseType: "percent" | "amount";
  increaseValue: number;
  inflationRate: number;
  contributionTiming: "start" | "end";
};

export type BreakdownItem = {
  name: string;
  value: number;
  percentage: number;
  age: number;
  contribution: number;
  depositYear: number;
};

export type CalculationResult = {
  totalProjectedValue: number;
  totalContributions: number;
  totalInterest: number;
  breakdown: BreakdownItem[];
  balances: { age: number; year: number; value: number }[];
  isCapped: boolean;
};

export function calculateRetirementSavings(values: CalculationInputs): CalculationResult {
  const years = values.retirementAge - values.currentAge;
  const growth = 1 + values.returnRate / 100;
  let balance = values.currentSavings;
  let contribution = values.annualContribution;
  let totalContributions = values.currentSavings;

  const breakdown: BreakdownItem[] = [{
    name: "Initial Savings",
    value: values.currentSavings * growth ** years,
    percentage: 0,
    age: values.currentAge,
    contribution: values.currentSavings,
    depositYear: 0,
  }];
  const balances = [{ age: values.currentAge, year: 0, value: balance }];

  for (let year = 1; year <= years; year++) {
    const atStart = values.contributionTiming === "start";
    balance = atStart ? (balance + contribution) * growth : balance * growth + contribution;
    const depositYear = atStart ? year - 1 : year;
    breakdown.push({
      name: `Year ${year}`,
      value: contribution * growth ** (years - depositYear),
      percentage: 0,
      age: values.currentAge + depositYear,
      contribution,
      depositYear,
    });
    balances.push({ age: values.currentAge + year, year, value: balance });
    totalContributions += contribution;
    contribution = values.increaseType === "percent"
      ? contribution * (1 + values.increaseValue / 100)
      : contribution + values.increaseValue;
  }

  // Keep raw values for inflation conversion. The UI applies the display cap.
  // The form's bounds ensure calculations remain finite.
  for (const item of breakdown) {
    item.percentage = balance > 0 ? item.value / balance * 100 : 0;
  }
  return {
    totalProjectedValue: balance,
    totalContributions,
    totalInterest: balance - totalContributions,
    breakdown,
    balances,
    isCapped: balance >= MAX_PROJECTION,
  };
}

export function realAnnualReturn(returnRate: number, inflationRate: number): number {
  return ((1 + returnRate / 100) / (1 + inflationRate / 100) - 1) * 100;
}

export function projectionInTodaysDollars(
  projection: CalculationResult,
  inputs: CalculationInputs,
): CalculationResult {
  const inflation = 1 + inputs.inflationRate / 100;
  const horizon = inputs.retirementAge - inputs.currentAge;
  const terminalDeflator = inflation ** horizon;
  const breakdown = projection.breakdown.map(item => ({
    ...item,
    value: item.value / terminalDeflator,
    // Discount deposits when paid so the contribution and growth totals are consistent.
    contribution: item.contribution / inflation ** item.depositYear,
  }));
  const totalProjectedValue = projection.totalProjectedValue / terminalDeflator;
  const totalContributions = breakdown.reduce((sum, item) => sum + item.contribution, 0);
  return {
    totalProjectedValue,
    totalContributions,
    totalInterest: totalProjectedValue - totalContributions,
    breakdown,
    balances: projection.balances.map(item => ({ ...item, value: item.value / inflation ** item.year })),
    isCapped: totalProjectedValue >= MAX_PROJECTION,
  };
}
