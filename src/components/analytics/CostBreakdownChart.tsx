'use client'

import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface CostData {
  month: string
  registrationCost: number
  hmoCost: number
  total: number
}

interface CostBreakdownChartProps {
  data: CostData[]
}

export function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Registration Fees',
        data: data.map((d) => d.registrationCost),
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
      },
      {
        label: 'HMO Fees',
        data: data.map((d) => d.hmoCost),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: 'GBP',
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return '£' + value.toLocaleString()
          },
        },
      },
    },
  }

  return (
    <div className="h-[300px]">
      <Bar data={chartData} options={options} />
    </div>
  )
}
