# Wealth Compass

![Wealth Compass retirement calculator](docs/wealth-compass.png)

Wealth Compass is an interactive retirement scenario explorer. It helps people build intuition for how their current savings, annual contributions, contribution growth, time horizon, and assumed return can shape a long-term outcome.

This project is an educational planning tool, not financial advice. Its projections are simplified estimates and do not account for taxes, fees, account rules, or market volatility. Inflation is an editable assumption in the optional today's-dollar view.

## Features

- Project a retirement balance from a configurable set of assumptions
- Start in basic mode with illustrative 5%, 7%, and 9% returns or enter a custom rate
- Switch to advanced mode without losing any inputs
- Adjust inflation, contribution increases, and start/end-of-year deposits
- Show results and the contribution chart in future dollars or today's purchasing power
- Increase annual contributions by a percentage or fixed amount
- Separate total contributions from estimated investment growth
- Visualize how each year's contribution participates in the final balance
- Validate inputs with React Hook Form and Zod

## Tech stack

- Next.js 15 and React 18
- TypeScript
- Tailwind CSS and Radix UI
- Recharts
- React Hook Form and Zod

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Validate

```bash
npm test
npm run typecheck
npm run build
```

The test command requires Node.js 22.6 or later and runs TypeScript model tests using Node's built-in type stripping. No additional test dependency is needed.

## Calculation model

The calculator uses a constant annualized return and annual deposits. Start-of-year deposits are the default; advanced mode also supports end-of-year deposits. Contribution increases apply to the following year's deposit. The 5%, 7%, and 9% scenarios are illustrative, not predictions for any investment. The 7% example is also used in [Investor.gov's investing guide](https://www.investor.gov/introduction-investing).

The nominal projection is calculated first. In today's-dollar view, each year's balance is divided by `(1 + inflation)^year`, and each final contribution value is discounted over the full horizon. Deposits are discounted at their payment date so the displayed contributions and inflation-adjusted growth add up to the final purchasing power. Equivalent real annual return is `(1 + nominal return) / (1 + inflation) - 1`, not simple subtraction.

The display limit is applied after conversion to the selected dollar basis. Values above the limit retain their raw amounts internally so inflation conversion remains accurate. Changing inputs marks the previous result as needing recalculation; display and mode switches preserve inputs.

## Roadmap

- Add shareable scenario summaries
- Explore variable annual returns and portfolio-specific assumptions

## License

MIT
