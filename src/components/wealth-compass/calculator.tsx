"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { AreaChart, Calculator as CalculatorIcon, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ContributionChart } from "./contribution-chart";
import { formatCurrency } from "@/lib/utils";
import { calculatorSchema, type FormValues } from "@/lib/calculator-schema";
import {
  calculateRetirementSavings,
  projectionInTodaysDollars,
  realAnnualReturn,
  RETURN_SCENARIOS,
  MAX_PROJECTION,
  type CalculationResult,
} from "@/lib/retirement-calculator";

type NumericField = "currentAge" | "retirementAge" | "currentSavings" | "annualContribution" | "returnRate" | "inflationRate" | "increaseValue";

function NumberField({ form, name, label, step = "any", onChange }: {
  form: UseFormReturn<FormValues>;
  name: NumericField;
  label: string;
  step?: string;
  onChange?: () => void;
}) {
  return (
    <FormField control={form.control} name={name} render={({ field }) => (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl><Input type="number" step={step} required {...field} onChange={event => { field.onChange(event); onChange?.(); }} /></FormControl>
        <FormMessage />
      </FormItem>
    )} />
  );
}

function projectedAmount(projection: CalculationResult) {
  return projection.isCapped ? `Over ${formatCurrency(MAX_PROJECTION)}` : formatCurrency(projection.totalProjectedValue);
}

export function Calculator() {
  const [advanced, setAdvanced] = useState(false);
  const [customReturn, setCustomReturn] = useState(false);
  const [todayDollars, setTodayDollars] = useState(false);
  const [snapshot, setSnapshot] = useState<{ inputs: FormValues; projection: CalculationResult } | null>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(calculatorSchema),
    shouldUnregister: false,
    defaultValues: {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      annualContribution: 10000,
      returnRate: 7,
      inflationRate: 3,
      increaseType: "percent",
      increaseValue: 0,
      contributionTiming: "start",
    },
  });
  const currentInputs = form.watch();
  const currentValidation = calculatorSchema.safeParse(currentInputs);
  const inputsChanged = snapshot && (!currentValidation.success || JSON.stringify(currentValidation.data) !== JSON.stringify(snapshot.inputs));
  const result = snapshot && (todayDollars
    ? projectionInTodaysDollars(snapshot.projection, snapshot.inputs)
    : snapshot.projection);

  function onSubmit(inputs: FormValues) {
    setSnapshot({ inputs, projection: calculateRetirementSavings(inputs) });
  }

  return (
    <div className="grid w-full items-start gap-8 lg:grid-cols-5">
      <Card className="shadow-lg lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalculatorIcon className="h-6 w-6" />Your financial details</CardTitle>
          <CardDescription>Start with a few assumptions and explore what changes.</CardDescription>
        </CardHeader>
        <CardContent>
          <div role="group" aria-label="Calculator mode" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {[false, true].map(isAdvanced => (
              <Button key={String(isAdvanced)} type="button" variant={advanced === isAdvanced ? "default" : "ghost"}
                className={advanced === isAdvanced ? "shadow-sm" : "text-muted-foreground"}
                aria-pressed={advanced === isAdvanced} onClick={() => setAdvanced(isAdvanced)}>
                {isAdvanced ? "Advanced" : "Basic"}
              </Button>
            ))}
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, () => setAdvanced(true))} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <NumberField form={form} name="currentAge" label="Current age" step="1" />
                <NumberField form={form} name="retirementAge" label="Retirement age" step="1" />
              </div>
              <NumberField form={form} name="currentSavings" label="Current savings ($)" />
              <NumberField form={form} name="annualContribution" label="Annual contribution ($)" />

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium">Assumed annual return</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RETURN_SCENARIOS.map(scenario => (
                    <Button key={scenario.rate} type="button"
                      variant={!customReturn && Number(currentInputs.returnRate) === scenario.rate ? "default" : "outline"}
                      aria-pressed={!customReturn && Number(currentInputs.returnRate) === scenario.rate}
                      onClick={() => {
                        setCustomReturn(false);
                        form.setValue("returnRate", scenario.rate, { shouldDirty: true, shouldValidate: true });
                      }} className="h-auto min-w-0 flex-col gap-1 py-2">
                      <span>{scenario.rate}%</span><span className="text-xs font-normal">{scenario.label}</span>
                    </Button>
                  ))}
                  <Button type="button" variant={customReturn ? "default" : "outline"} aria-pressed={customReturn}
                    onClick={() => setCustomReturn(true)} className="h-auto py-2">Custom</Button>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Example annualized returns before inflation, not predictions for your investments.
                </p>
                {(advanced || customReturn) && (
                  <NumberField form={form} name="returnRate" label="Annual return (%)" step="0.1" onChange={() => setCustomReturn(true)} />
                )}
              </fieldset>

              <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="today-dollars">Show in today’s dollars</Label>
                  <Switch id="today-dollars" checked={todayDollars} onCheckedChange={setTodayDollars} />
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {todayDollars ? "Adjusts results for purchasing power" : "Results use future dollars"} with an inflation assumption of {currentInputs.inflationRate}% per year.
                  {!advanced && " Change this in advanced mode."}
                </p>
              </div>

              {advanced && (
                <div className="space-y-5 rounded-lg border p-4">
                  <NumberField form={form} name="inflationRate" label="Annual inflation (%)" step="0.1" />
                  <FormField control={form.control} name="increaseType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribution increase each year</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="percent">By percentage</option><option value="amount">By dollar amount</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <NumberField form={form} name="increaseValue" label={currentInputs.increaseType === "percent" ? "Annual increase (%)" : "Annual increase ($)"} />
                  <FormField control={form.control} name="contributionTiming" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contribution timing</FormLabel>
                      <FormControl>
                        <select {...field} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value="start">Start of each year</option><option value="end">End of each year</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}
              <p className="text-xs leading-relaxed text-muted-foreground">
                Contributions at the {currentInputs.contributionTiming} of each year.
                {Number(currentInputs.increaseValue) === 0 ? " No annual increase." : ` Contributions increase by ${currentInputs.increaseType === "amount" ? "$" : ""}${currentInputs.increaseValue}${currentInputs.increaseType === "percent" ? "%" : ""} each year.`}
                {!advanced && Number(currentInputs.increaseValue) > 0 && " Your advanced settings still apply."}
              </p>
              <Button type="submit" size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Calculate my future</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6 lg:col-span-3" aria-live="polite">
        {!snapshot && (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border border-dashed bg-card p-6 text-center">
            <AreaChart className="h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Explore your future savings</h2>
            <p className="text-muted-foreground">Calculate to see how your savings and contributions could grow.</p>
          </div>
        )}
        {snapshot && result && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="h-6 w-6" />Your retirement projection</CardTitle>
              <CardDescription>At age {snapshot.inputs.retirementAge}, under a {snapshot.inputs.returnRate}% annual return assumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {inputsChanged && <p role="status" className="rounded-lg border bg-muted p-3 text-sm">Inputs changed. Calculate again to update these results.</p>}
              <div>
                <p className="break-words text-3xl font-bold tracking-tight text-primary sm:text-4xl">{projectedAmount(result)}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {todayDollars ? `In today’s dollars, assuming ${snapshot.inputs.inflationRate}% annual inflation` : "In future dollars, before inflation"}
                </p>
                {todayDollars && <p className="mt-1 text-sm text-muted-foreground">Equivalent annual return after inflation is {realAnnualReturn(snapshot.inputs.returnRate, snapshot.inputs.inflationRate).toFixed(2)}%</p>}
              </div>
              {!result.isCapped && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background/50 p-4">
                    <p className="text-sm text-muted-foreground">{todayDollars ? "Contributions in today’s dollars" : "Total contributions"}</p>
                    <p className="mt-1 text-xl font-semibold">{formatCurrency(result.totalContributions)}</p>
                  </div>
                  <div className="rounded-lg border bg-background/50 p-4">
                    <p className="text-sm text-muted-foreground">{todayDollars ? "Investment growth after inflation" : "Estimated investment growth"}</p>
                    <p className="mt-1 text-xl font-semibold text-primary">{formatCurrency(result.totalInterest)}</p>
                  </div>
                </div>
              )}
              {result.isCapped && <p className="text-sm text-muted-foreground">This projection exceeds the calculator’s display limit. Detailed totals and chart are hidden.</p>}
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Educational use only.</span>{" "}
                This is a hypothetical estimate, not financial, investment, tax, or legal advice. Actual results may differ.
              </p>
              {!result.isCapped && (
                <>
                  <Separator />
                  <section aria-labelledby="breakdown-title">
                    <h3 id="breakdown-title" className="font-semibold">Contribution breakdown</h3>
                    <p className="mb-4 mt-2 text-sm text-muted-foreground">Each bar shows how much a deposit contributes to the final balance{todayDollars ? " in today’s dollars" : " in future dollars"}.</p>
                    <div className="h-[300px] w-full"><ContributionChart data={result.breakdown} todayDollars={todayDollars} /></div>
                  </section>
                </>
              )}
              <section aria-labelledby="assumptions-title" className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                <h3 id="assumptions-title" className="font-semibold text-foreground">Assumptions and limitations</h3>
                <p>The model applies the same annualized return every year. Contributions are added at the {snapshot.inputs.contributionTiming} of each year and grow according to your inputs.</p>
                <p>{todayDollars
                  ? "Balances are adjusted for inflation at retirement. Contributions are adjusted when they are paid, so growth shows the change in purchasing power."
                  : "Future-dollar amounts do not account for inflation. Switch to today’s dollars to compare purchasing power."}</p>
                <p>The 5%, 7%, and 9% presets are illustrative scenarios. The 7% example is also used in <a href="https://www.investor.gov/introduction-investing" target="_blank" rel="noreferrer" className="underline underline-offset-2">Investor.gov’s investing guide</a>. These rates are not forecasts for any fund or portfolio.</p>
                <p>Taxes, fees, market volatility, contribution limits, and withdrawals are not modeled. Returns are not guaranteed.</p>
              </section>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
