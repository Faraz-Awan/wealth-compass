"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Calculator as CalculatorIcon,
  Loader2,
  TrendingUp,
  Wallet,
  Calendar,
  AreaChart,
  Percent,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContributionChart } from "./contribution-chart";
import { formatCurrency } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { calculateRetirementSavings, MAX_PROJECTION } from "@/lib/retirement-calculator";
import { cn } from "@/lib/utils";


const formSchema = z
  .object({
    currentAge: z.coerce
      .number({ required_error: "Current age is required." })
      .min(18, "Must be at least 18")
      .max(99, "Must be less than 100"),
    retirementAge: z.coerce
      .number({ required_error: "Retirement age is required." })
      .min(19, "Must be older than current age")
      .max(100, "Must be 100 or less"),
    currentSavings: z.coerce
      .number({ required_error: "Enter your current savings." })
      .min(0, "Cannot be negative")
      .max(100000000, "Must be less than 100,000,000"),
    annualContribution: z.coerce
      .number({ required_error: "Enter your annual contribution." })
      .min(0, "Cannot be negative")
      .max(1000000, "Must be less than 1,000,000"),
    increaseType: z.enum(["percent", "amount"]).default("percent"),
    increaseValue: z.coerce.number().min(0, "Cannot be negative").default(0),
    returnRate: z.coerce
      .number({ required_error: "Enter an expected return rate." })
      .min(0, "Must be 0 or greater")
      .max(20, "Must be 20 or less"),
  })
  .refine((data) => data.retirementAge > data.currentAge, {
    message: "Retirement age must be after current age.",
    path: ["retirementAge"],
  })
  .refine((data) => {
    if (data.increaseType === 'percent') {
        return data.increaseValue <= 50;
    }
    return true;
  }, {
    message: "Increase cannot be more than 50%.",
    path: ["increaseValue"],
  })
  .refine((data) => {
    if (data.increaseType === 'amount') {
        return data.increaseValue <= data.annualContribution;
    }
    return true;
  }, {
    message: "Increase cannot be more than the initial annual contribution.",
    path: ["increaseValue"],
  });


export type FormValues = z.infer<typeof formSchema>;

export type BreakdownItem = {
  name: string;
  value: number;
  percentage: number;
  age: number;
  contribution: number;
};

export type CalculationResult = {
  totalProjectedValue: number;
  totalContributions: number;
  totalInterest: number;
  breakdown: BreakdownItem[];
};

export function Calculator() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProjectedValueTooHigh, setIsProjectedValueTooHigh] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentAge: 30,
      retirementAge: 65,
      currentSavings: 50000,
      annualContribution: 10000,
      increaseType: "percent",
      increaseValue: 0,
      returnRate: 7,
    },
  });

  function onSubmit(values: FormValues) {
    setIsLoading(true);
    setResult(null);
    setIsProjectedValueTooHigh(false);

    setTimeout(() => {
      const calculation = calculateRetirementSavings(values);

      if (calculation.totalProjectedValue >= MAX_PROJECTION) {
        setIsProjectedValueTooHigh(true);
        setResult(calculation);
      } else {
        setResult(calculation);
      }

      setIsLoading(false);
    }, 1000);
  }

  const increaseType = form.watch("increaseType");

  return (
    <div className="grid w-full gap-8 lg:grid-cols-5">
      <div className="flex flex-col gap-8 lg:col-span-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalculatorIcon className="h-6 w-6" />
              Your Financial Details
            </CardTitle>
            <CardDescription>
              Enter your information to project your retirement savings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="currentAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Age</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="30" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="retirementAge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retirement Age</FormLabel>
                         <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="65" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="currentSavings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Savings</FormLabel>
                       <FormControl>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="50000" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="annualContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Contribution</FormLabel>
                      <FormControl>
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="10000" {...field} className="pl-9" />
                          </div>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="increaseValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Contribution Increase</FormLabel>
                      <FormDescription className="pb-2">
                        Increase your contribution each year by a set amount or percentage.
                      </FormDescription>
                       <div className="relative">
                          <FormControl>
                             <Input type="number" placeholder="0" {...field} step="0.1" className={cn(increaseType === 'percent' ? "pr-24" : "pr-20")} />
                          </FormControl>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
                             <FormField
                              control={form.control}
                              name="increaseType"
                              render={({ field: radioField }) => (
                                <RadioGroup
                                  onValueChange={radioField.onChange}
                                  defaultValue={radioField.value}
                                  className="flex items-center rounded-md bg-muted p-1"
                                >
                                  <FormItem>
                                    <FormControl>
                                      <RadioGroupItem value="percent" id="r1" className="sr-only"/>
                                    </FormControl>
                                    <FormLabel htmlFor="r1" className={cn("flex h-full cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium", form.watch('increaseType') === 'percent' ? 'bg-background shadow' : '')}>
                                      %
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem>
                                    <FormControl>
                                      <RadioGroupItem value="amount" id="r2" className="sr-only"/>
                                    </FormControl>
                                     <FormLabel htmlFor="r2" className={cn("flex h-full cursor-pointer items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium", form.watch('increaseType') === 'amount' ? 'bg-background shadow' : '')}>
                                      $
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              )}
                            />
                          </div>
                       </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="returnRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avg. Annual Return Rate (%)</FormLabel>
                      <FormControl>
                          <div className="relative">
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="number" placeholder="7" {...field} step="0.1" className="pl-9" />
                          </div>
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-accent text-accent-foreground shadow-md transition-all hover:bg-accent/90 hover:shadow-lg"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    "Calculate Projection"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-8 lg:col-span-3">
        {isLoading && (
          <div className="flex h-[600px] w-full items-center justify-center rounded-lg border border-dashed bg-card shadow-sm">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Compounding your returns...</p>
            </div>
          </div>
        )}
        {!isLoading && !result && (
           <div className="flex h-[600px] w-full flex-col items-center justify-center rounded-lg border border-dashed bg-card shadow-sm">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full border bg-background p-4">
                 <AreaChart className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Your Future Awaits</h3>
              <p className="text-muted-foreground">Fill out the form to see your retirement projection.</p>
            </div>
          </div>
        )}
        {result && (
          <Card className="shadow-lg animate-in fade-in-50 duration-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Illustrative Retirement Projection
              </CardTitle>
              <CardDescription>
                At age {form.getValues("retirementAge")}, your savings could be worth:
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                {isProjectedValueTooHigh ? (
                  <div className="text-center">
                    <p className="text-5xl font-bold text-primary">&gt; {formatCurrency(MAX_PROJECTION)}</p>
                    <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-6 text-center">
                      <AlertTriangle className="h-10 w-10 text-amber-500" />
                      <h3 className="text-xl font-bold text-amber-600">Off the charts!</h3>
                      <p className="text-amber-700">
                        Your projected savings are astronomical. While impressive, these numbers are beyond the scope of this calculator&apos;s detailed breakdown.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-5xl font-bold text-primary">
                      {formatCurrency(result.totalProjectedValue)}
                    </p>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="rounded-lg border bg-background/50 p-4">
                        <p className="text-sm text-muted-foreground">Total Contributions</p>
                        <p className="text-xl font-semibold">{formatCurrency(result.totalContributions)}</p>
                      </div>
                      <div className="rounded-lg border bg-background/50 p-4">
                        <p className="text-sm text-muted-foreground">Estimated Investment Growth</p>
                        <p className="text-xl font-semibold text-primary">{formatCurrency(result.totalInterest)}</p>
                      </div>
                    </div>
                  </>
                )}
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Educational use only.</span>{" "}
                This is a hypothetical estimate, not financial, investment, tax, or legal advice.
                Actual results may differ.
              </p>
              <Separator />
               <div>
                <h4 className="font-semibold text-lg mb-2">Contribution Breakdown</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  This chart shows which contributions make up your final projected savings.
                </p>
                <div className="h-[300px] w-full">
                  <ContributionChart data={result.breakdown} isCapped={isProjectedValueTooHigh} />
                </div>
               </div>
               <section aria-labelledby="projection-assumptions-heading" className="rounded-lg border bg-muted/30 p-4 text-sm">
                <h4 id="projection-assumptions-heading" className="font-semibold">
                  Assumptions and limitations
                </h4>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  The calculator assumes the same annual return every year. It adds each
                  annual contribution before that year&apos;s growth and increases future
                  contributions according to your inputs. All amounts are nominal,
                  meaning they are not adjusted for inflation.
                </p>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  These projections do not account for taxes, fees, market volatility,
                  contribution limits, withdrawals, or your full financial situation.
                  Returns are not guaranteed, and actual results will vary. Consider
                  consulting a qualified professional before making financial decisions.
                </p>
               </section>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
