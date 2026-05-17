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
import { Line } from 'react-chartjs-2'
import { formatDateShort } from '@/lib/utils'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface LineChartProps {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
  title?: string
}

export default function LineChart({ labels, datasets, title }: LineChartProps) {
  const data = {
    labels: labels.map(formatDateShort),
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color,
      backgroundColor: ds.color + '20',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 6,
      fill: true,
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
        displayColors: true,
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
      <Line data={data} options={options} />
    </div>
  )
}
