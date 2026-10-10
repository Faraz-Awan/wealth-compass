import { FormValues, CalculationResult, BreakdownItem } from "@/components/wealth-compass/calculator";

export const MAX_PROJECTION = 100_000_000_000_000; // 100 Trillion

export function calculateRetirementSavings(values: FormValues): CalculationResult {
  const {
    currentAge,
    retirementAge,
    currentSavings,
    annualContribution,
    returnRate,
    increaseType,
    increaseValue,
  } = values;
  const yearsToRetire = retirementAge - currentAge;
  const rate = returnRate / 100;

  let futureValue = currentSavings;
  let totalAnnualContributions = 0;
  let currentContribution = annualContribution;
  const breakdown: BreakdownItem[] = [];

  // FV of initial savings
  let fvOfCurrentSavings = currentSavings * Math.pow(1 + rate, yearsToRetire);
  if (fvOfCurrentSavings > MAX_PROJECTION) fvOfCurrentSavings = MAX_PROJECTION;
  
  breakdown.push({
    name: "Initial Savings",
    value: fvOfCurrentSavings,
    percentage: 0, // will calculate at the end
    age: currentAge,
    contribution: currentSavings
  });
  futureValue = fvOfCurrentSavings;

  let yearEndFutureValue = currentSavings;

  for (let i = 1; i <= yearsToRetire; i++) {
    const futureValueWithContribution = yearEndFutureValue + currentContribution;
    if (futureValueWithContribution > MAX_PROJECTION * 2) { // Allow some headroom before capping
      yearEndFutureValue = MAX_PROJECTION * 2;
    } else {
      yearEndFutureValue = futureValueWithContribution * (1 + rate);
    }
    
    let fvOfThisContribution = currentContribution * Math.pow(1 + rate, yearsToRetire - i + 1);
    if (fvOfThisContribution > MAX_PROJECTION) fvOfThisContribution = MAX_PROJECTION;

    breakdown.push({
      name: `Year ${i}`,
      value: fvOfThisContribution,
      percentage: 0, // will calculate at the end
      age: currentAge + i,
      contribution: currentContribution,
    });

    totalAnnualContributions += currentContribution;
    
    if (increaseType === 'percent') {
      currentContribution *= (1 + (increaseValue / 100));
    } else {
      currentContribution += increaseValue;
    }
  }

  const totalProjectedValue = yearEndFutureValue > MAX_PROJECTION ? MAX_PROJECTION : yearEndFutureValue;

  // Now calculate percentages
  if (totalProjectedValue < MAX_PROJECTION) {
    breakdown.forEach(item => {
      item.percentage = (item.value / totalProjectedValue) * 100;
    });
  }
  
  const totalContributions = currentSavings + totalAnnualContributions;
  const totalInterest = totalProjectedValue - totalContributions;

  return {
    totalProjectedValue,
    totalContributions,
    totalInterest,
    breakdown,
  };
}
