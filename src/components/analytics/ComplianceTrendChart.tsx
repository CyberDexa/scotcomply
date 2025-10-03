'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface ComplianceTrendData {
  month: string
  certificates: number
  registrations: number
  hmoLicenses: number
  total: number
}

interface ComplianceTrendChartProps {
  data: ComplianceTrendData[]
}

export function ComplianceTrendChart({ data }: ComplianceTrendChartProps) {
  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Certificates',
        data: data.map((d) => d.certificates),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Registrations',
        data: data.map((d) => d.registrations),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'HMO Licenses',
        data: data.map((d) => d.hmoLicenses),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
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
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  )
}
