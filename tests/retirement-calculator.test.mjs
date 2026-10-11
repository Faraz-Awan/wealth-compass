import assert from "node:assert/strict";
import { test } from "node:test";
import {
  calculateRetirementSavings,
  projectionInTodaysDollars,
  realAnnualReturn,
  MAX_PROJECTION,
} from "../src/lib/retirement-calculator.ts";
import { calculatorSchema } from "../src/lib/calculator-schema.ts";

const defaults = {
  currentAge: 30, retirementAge: 65, currentSavings: 50000,
  annualContribution: 10000, returnRate: 7, increaseType: "percent",
  increaseValue: 0, inflationRate: 3, contributionTiming: "start",
};
function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-9 * Math.max(1, Math.abs(expected)), `${actual} differs from ${expected}`);
}

test("default projection matches the annuity-due closed form", () => {
  const years = 35;
  const factor = 1.07 ** years;
  const expected = 50000 * factor + 10000 * 1.07 * (factor - 1) / 0.07;
  const result = calculateRetirementSavings(defaults);
  close(result.totalProjectedValue, expected);
  close(result.totalContributions, 400000);
  close(result.breakdown.reduce((sum, item) => sum + item.value, 0), expected);
  close(result.breakdown.reduce((sum, item) => sum + item.percentage, 0), 100);
});

test("start and end deposits differ by one year of growth", () => {
  const inputs = { ...defaults, retirementAge: 31, currentSavings: 100, annualContribution: 50, returnRate: 10 };
  close(calculateRetirementSavings(inputs).totalProjectedValue, 165);
  close(calculateRetirementSavings({ ...inputs, contributionTiming: "end" }).totalProjectedValue, 160);
});

test("contribution increases work independently of investment growth", () => {
  const inputs = { ...defaults, retirementAge: 33, currentSavings: 0, annualContribution: 100, returnRate: 0, increaseValue: 10 };
  close(calculateRetirementSavings(inputs).totalProjectedValue, 331);
  close(calculateRetirementSavings({ ...inputs, increaseType: "amount" }).totalProjectedValue, 330);
});

test("real return uses compounded inflation rather than subtraction", () => {
  close(realAnnualReturn(7, 3), 3.883495145631);
  close(realAnnualReturn(3, 3), 0);
  assert.ok(realAnnualReturn(0, 3) < 0);
});

test("today's dollars discount balances at each year and terminal components at retirement", () => {
  const inputs = { ...defaults, retirementAge: 32, currentSavings: 100, annualContribution: 0, returnRate: 10, inflationRate: 10 };
  const nominal = calculateRetirementSavings(inputs);
  const real = projectionInTodaysDollars(nominal, inputs);
  close(nominal.totalProjectedValue, 121);
  close(real.totalProjectedValue, 100);
  real.balances.forEach(item => close(item.value, 100));
  close(real.breakdown[0].value, 100);
  close(real.totalInterest, 0);
});

for (const timing of ["start", "end"]) {
  test(`real contributions respect ${timing}-of-year deposit timing`, () => {
    const inputs = { ...defaults, retirementAge: 32, currentSavings: 100, annualContribution: 100, returnRate: 10, inflationRate: 10, contributionTiming: timing };
    const result = projectionInTodaysDollars(calculateRetirementSavings(inputs), inputs);
    const expectedDeposits = timing === "start" ? 100 + 100 + 100 / 1.1 : 100 + 100 / 1.1 + 100 / 1.21;
    close(result.totalContributions, expectedDeposits);
    close(result.totalProjectedValue, expectedDeposits);
    close(result.totalInterest, 0);
    close(result.breakdown.reduce((sum, item) => sum + item.value, 0), result.totalProjectedValue);
  });
}

test("zero inflation preserves every nominal value", () => {
  const inputs = { ...defaults, inflationRate: 0 };
  const nominal = calculateRetirementSavings(inputs);
  assert.deepEqual(projectionInTodaysDollars(nominal, inputs), nominal);
});

test("zero savings and contributions produce zero shares rather than NaN", () => {
  const result = calculateRetirementSavings({ ...defaults, currentSavings: 0, annualContribution: 0 });
  assert.equal(result.totalProjectedValue, 0);
  assert.ok(result.breakdown.every(item => item.percentage === 0));
});

test("negative returns and lost purchasing power are valid outcomes", () => {
  const inputs = { ...defaults, retirementAge: 31, currentSavings: 100, annualContribution: 0, returnRate: -10, inflationRate: 0 };
  assert.ok(calculatorSchema.safeParse(inputs).success);
  const result = calculateRetirementSavings(inputs);
  close(result.totalProjectedValue, 90);
  close(result.totalInterest, -10);
});

test("scenario rates order outcomes without changing contributions", () => {
  const results = [5, 7, 9].map(returnRate => calculateRetirementSavings({ ...defaults, returnRate }));
  assert.ok(results[0].totalProjectedValue < results[1].totalProjectedValue);
  assert.ok(results[1].totalProjectedValue < results[2].totalProjectedValue);
  assert.ok(results.every(result => result.totalContributions === 400000));
});

test("large valid projections stay finite and are capped only after inflation conversion", () => {
  const inputs = { ...defaults, currentAge: 18, retirementAge: 100, currentSavings: 100000000, annualContribution: 1000000, increaseValue: 50, returnRate: 20, inflationRate: 20 };
  assert.ok(calculatorSchema.safeParse(inputs).success);
  const nominal = calculateRetirementSavings(inputs);
  assert.ok(Number.isFinite(nominal.totalProjectedValue));
  assert.ok(nominal.isCapped);
  const real = projectionInTodaysDollars(nominal, inputs);
  close(real.totalProjectedValue, nominal.totalProjectedValue / 1.2 ** 82);
  assert.equal(real.isCapped, real.totalProjectedValue >= MAX_PROJECTION);
});

test("validation rejects fractional ages, invalid horizons, nonfinite rates, and invalid inflation", () => {
  for (const invalid of [
    { currentAge: 30.5 }, { retirementAge: 30 }, { returnRate: NaN },
    { returnRate: Infinity }, { returnRate: -100 }, { inflationRate: -1 },
    { inflationRate: 21 }, { increaseValue: 51 }, { contributionTiming: "monthly" },
  ]) assert.equal(calculatorSchema.safeParse({ ...defaults, ...invalid }).success, false);
});
