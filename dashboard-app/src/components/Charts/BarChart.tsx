import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface BarChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
  title?: string
}

export default function BarChart({ labels, datasets, title }: BarChartProps) {
  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color,
      borderRadius: 6,
      borderSkipped: false as const,
    })),
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
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
        titleFont: { family: 'Inter', size: 13 },
        bodyFont: { family: 'Inter', size: 12 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#8b95a5',
        },
      },
      y: {
        grid: { color: 'rgba(26, 35, 50, 0.06)' },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#8b95a5',
        },
        beginAtZero: true,
      },
    },
  }

  return (
    <div className="h-80">
      <Bar data={data} options={options} />
    </div>
  )
}
