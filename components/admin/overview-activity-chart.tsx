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
  comments: number
  posts: number
}

type OverviewActivityChartProps = {
  data: OverviewDailyPoint[]
}

const overviewChartConfig = {
  views: {
    label: "Views",
    color: "#2563eb",
  },
  comments: {
    label: "Comments",
    color: "#60a5fa",
  },
} satisfies ChartConfig

export function OverviewActivityChart({ data }: OverviewActivityChartProps) {
  return (
    <ChartContainer config={overviewChartConfig} className="h-80 w-full">
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
        <Line
          dataKey="comments"
          type="monotone"
          stroke="var(--color-comments)"
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
