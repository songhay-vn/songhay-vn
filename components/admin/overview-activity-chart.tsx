"use client"

import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type OverviewDailyPoint = {
  label: string
  views: number
}

type OverviewActivityChartProps = {
  data: OverviewDailyPoint[]
}

const overviewChartConfig = {
  views: {
    label: "Views",
    color: "#2563eb",
  },
} satisfies ChartConfig

export function OverviewActivityChart({ data }: OverviewActivityChartProps) {
  return (
    <ChartContainer
      config={overviewChartConfig}
      className="aspect-auto min-h-[300px] w-full flex-1"
    >
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: 8, right: 8, top: 8 }}
      >
        <CartesianGrid vertical={false} />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="line" />}
        />
        <Legend verticalAlign="top" height={28} />
        <Line
          dataKey="views"
          type="monotone"
          stroke="var(--color-views)"
          strokeWidth={2.5}
          dot={false}
        />
        <Brush
          dataKey="label"
          height={20}
          stroke="#94a3b8"
          travellerWidth={8}
        />
      </LineChart>
    </ChartContainer>
  )
}
