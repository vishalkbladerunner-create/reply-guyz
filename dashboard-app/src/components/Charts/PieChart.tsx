import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  labels: string[]
  data: number[]
  colors: string[]
  title?: string
}

export default function PieChart({ labels, data, colors, title }: PieChartProps) {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { family: 'Inter', size: 12 },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: { family: 'Playfair Display', size: 16, weight: 'bold' as const },
        padding: { bottom: 20 },
        color: '#1a2332',
      },
      tooltip: {
        backgroundColor: '#1a2332',
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const pct = ((context.raw / total) * 100).toFixed(1)
            return `${context.label}: ${context.raw} (${pct}%)`
          },
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  )
}
