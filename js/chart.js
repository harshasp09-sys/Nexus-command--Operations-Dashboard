/**
 * CEREBRO // THREAT TREND VISUALIZATION
 * Stacked bar chart powered by Chart.js
 * Tracks weekly incident counts stacked by Threat Level (1–5)
 */

let threatChartInstance = null;

const THREAT_COLORS = {
  1: {
    label: 'Level 1: Low Threat',
    bg: 'rgba(16, 185, 129, 0.85)',
    border: '#10B981',
    hover: '#34D399'
  },
  2: {
    label: 'Level 2: Guarded',
    bg: 'rgba(6, 182, 212, 0.85)',
    border: '#06B6D4',
    hover: '#22D3EE'
  },
  3: {
    label: 'Level 3: Elevated',
    bg: 'rgba(245, 158, 11, 0.85)',
    border: '#F59E0B',
    hover: '#FBBF24'
  },
  4: {
    label: 'Level 4: Severe',
    bg: 'rgba(249, 115, 22, 0.85)',
    border: '#F97316',
    hover: '#FB923C'
  },
  5: {
    label: 'Level 5: Omega Level',
    bg: 'rgba(255, 0, 85, 0.9)',
    border: '#FF0055',
    hover: '#FF3377'
  }
};

function initThreatTrendChart(canvasId = 'threatTrendCanvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const weeklyData = state.getChartWeeklyData();

  const datasets = [1, 2, 3, 4, 5].map(level => ({
    label: THREAT_COLORS[level].label,
    data: weeklyData.countsByLevel[level],
    backgroundColor: THREAT_COLORS[level].bg,
    borderColor: THREAT_COLORS[level].border,
    borderWidth: 2,
    borderRadius: 4,
    hoverBackgroundColor: THREAT_COLORS[level].hover
  }));

  if (threatChartInstance) {
    threatChartInstance.destroy();
  }

  // Configure Chart.js stacked bar chart with Marvel/Cerebro futuristic styling
  threatChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyData.labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#E2E8F0',
            font: {
              family: "'Inter', sans-serif",
              weight: 'bold',
              size: 11
            },
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 15
          }
        },
        tooltip: {
          backgroundColor: 'rgba(12, 16, 32, 0.95)',
          titleColor: '#00F0FF',
          bodyColor: '#F8FAFC',
          borderColor: '#FFCC00',
          borderWidth: 1.5,
          padding: 12,
          boxPadding: 6,
          usePointStyle: true,
          titleFont: {
            family: "'Russo One', sans-serif",
            size: 13
          },
          bodyFont: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.06)',
            borderColor: '#334155'
          },
          ticks: {
            color: '#94A3B8',
            font: {
              family: "'Russo One', sans-serif",
              size: 11
            }
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          suggestedMax: 4,
          grid: {
            color: 'rgba(255, 255, 255, 0.08)',
            borderColor: '#334155'
          },
          ticks: {
            stepSize: 1,
            color: '#94A3B8',
            font: {
              family: "'JetBrains Mono', monospace",
              size: 11
            }
          }
        }
      }
    }
  });
}

function updateThreatTrendChart() {
  if (!threatChartInstance) {
    initThreatTrendChart();
    return;
  }

  const weeklyData = state.getChartWeeklyData();
  threatChartInstance.data.labels = weeklyData.labels;
  [1, 2, 3, 4, 5].forEach((level, idx) => {
    threatChartInstance.data.datasets[idx].data = weeklyData.countsByLevel[level];
  });
  threatChartInstance.update();
}
