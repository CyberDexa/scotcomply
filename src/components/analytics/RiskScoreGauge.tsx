'use client'

interface RiskScoreGaugeProps {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
}

export function RiskScoreGauge({ score, level }: RiskScoreGaugeProps) {
  const getColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600'
      case 'medium':
        return 'text-yellow-600'
      case 'high':
        return 'text-orange-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getBgColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100'
      case 'medium':
        return 'bg-yellow-100'
      case 'high':
        return 'bg-orange-100'
      case 'critical':
        return 'bg-red-100'
      default:
        return 'bg-gray-100'
    }
  }

  const getProgressColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-600'
      case 'medium':
        return 'bg-yellow-600'
      case 'high':
        return 'bg-orange-600'
      case 'critical':
        return 'bg-red-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* Circular gauge */}
      <div className="relative">
        <svg className="w-48 h-48 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            strokeDasharray={`${(score / 100) * 502.4} 502.4`}
            className={getColor(level)}
            strokeLinecap="round"
          />
        </svg>
        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-5xl font-bold ${getColor(level)}`}>{score}</div>
          <div className="text-sm text-gray-500 mt-1">Risk Score</div>
        </div>
      </div>

      {/* Risk level badge */}
      <div
        className={`px-6 py-2 rounded-full ${getBgColor(level)} ${getColor(level)} font-semibold text-lg uppercase tracking-wide`}
      >
        {level} Risk
      </div>

      {/* Risk scale */}
      <div className="w-full max-w-md">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Low (0-25)</span>
          <span>Medium (26-50)</span>
          <span>High (51-75)</span>
          <span>Critical (76-100)</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor(level)} transition-all duration-500`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}
