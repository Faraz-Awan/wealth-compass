# Wealth Compass

![Wealth Compass retirement calculator](docs/wealth-compass.png)

Wealth Compass is an interactive retirement scenario explorer. It helps people build intuition for how their current savings, annual contributions, contribution growth, time horizon, and expected return can shape a long-term outcome.

This project is an educational planning tool, not financial advice. Its projections are simplified estimates and do not account for taxes, fees, inflation, account rules, or market volatility.

## Features

- Project a retirement balance from a configurable set of assumptions
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
npm run typecheck
npm run build
```

## Calculation model

The calculator applies each year's contribution before that year's investment growth. Results are nominal, deterministic projections based on the assumptions entered by the user.

## Roadmap

- Compare multiple scenarios side by side
- Show inflation-adjusted values
- Make contribution timing and other assumptions configurable
- Add shareable scenario summaries
- Add unit tests around the projection model and boundary conditions

## License

MIT
