"use client"

import * as React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import type { CalculationResult } from "@/lib/retirement-calculator"
import { formatCurrency } from "@/lib/utils";
import { MAX_PROJECTION } from "@/lib/retirement-calculator";

interface ContributionChartProps {
  data: CalculationResult["breakdown"]
  isCapped?: boolean;
  todayDollars?: boolean;
}

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--chart-1))",
  },
}

export function ContributionChart({ data, isCapped, todayDollars }: ContributionChartProps) {
  const chartData = data.map(item => ({
    ...item,
    name: item.name === "Initial Savings" ? "Initial" : item.name.replace("Year ", "Y")
  }))

  return (
    <ChartContainer
      config={chartConfig}
      className="h-full w-full"
    >
      <BarChart 
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          bottom: 5,
          left: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          fontSize={12}
          tickFormatter={(value) => {
             if (isCapped) {
              if (value >= 1_000_000_000_000_000) return `${(value / 1_000_000_000_000_000).toFixed(0)}Q`;
              if (value >= 1_000_000_000_000) return `${(value / 1_000_000_000_000).toFixed(0)}T`;
             }
             if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(0)}B`;
             if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
             if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
             return `$${value}`;
          }}
          domain={[0, isCapped ? MAX_PROJECTION : 'auto']}
        />
        <ChartTooltip
          cursor={false}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const { name, value, percentage, age, contribution } = payload[0].payload;
              const isInitial = name === "Initial";
              return (
                <div className="min-w-[150px] rounded-lg border bg-background p-2 text-sm shadow-md">
                  <p className="font-bold">{isInitial ? "Initial Savings" : `Contribution at Age ${age}`}</p>
                  <p>Deposit {formatCurrency(contribution as number)}</p>
                  <p>Final value {isCapped && value >= MAX_PROJECTION ? `> ${formatCurrency(MAX_PROJECTION)}` : formatCurrency(value as number)}</p>
                  {!isCapped && <p>Share {(percentage as number).toFixed(2)}%</p>}
                  <p className="mt-1 text-muted-foreground">{todayDollars ? "In today’s dollars" : "In future dollars"}</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
