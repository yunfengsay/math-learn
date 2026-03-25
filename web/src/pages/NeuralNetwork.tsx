import { useState, useEffect } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

interface NNResult {
  layers: { name: string; input_dim: number; output_dim: number }[]
  singular_values: number[]
  k: number
  total_rank: number
  original_weights: number[][]
  compressed_weights: number[][]
  accuracy_original: number
  accuracy_compressed: number
  weight_shape: number[]
}

function NetworkDiagram({ layers }: { layers: NNResult['layers'] }) {
  const dims = [layers[0]?.input_dim || 8, layers[0]?.output_dim || 16, layers[1]?.output_dim || 4]
  const labels = ['输入层', '隐藏层', '输出层']
  const w = 400, h = 200
  const colX = [60, 200, 340]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', maxWidth: 400 }}>
      {colX.slice(0, -1).map((x1, ci) => {
        const x2 = colX[ci + 1]
        const n1 = Math.min(dims[ci], 6)
        const n2 = Math.min(dims[ci + 1], 6)
        return Array.from({ length: n1 }, (_, i) =>
          Array.from({ length: n2 }, (_, j) => (
            <line
              key={`${ci}-${i}-${j}`}
              x1={x1} y1={20 + i * ((h - 40) / (n1 - 1 || 1))}
              x2={x2} y2={20 + j * ((h - 40) / (n2 - 1 || 1))}
              stroke="var(--border)" strokeWidth={0.5} opacity={0.4}
            />
          ))
        )
      })}
      {colX.map((x, ci) => {
        const n = Math.min(dims[ci], 6)
        return Array.from({ length: n }, (_, i) => (
          <g key={`node-${ci}-${i}`}>
            <circle
              cx={x} cy={20 + i * ((h - 40) / (n - 1 || 1))}
              r={8} fill="var(--accent)" opacity={0.8}
            />
          </g>
        )).concat(
          dims[ci] > 6 ? [
            <text key={`dots-${ci}`} x={x} y={h - 5} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
              ...({dims[ci]})
            </text>
          ] : [],
          [
            <text key={`label-${ci}`} x={x} y={12} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>
              {labels[ci]}({dims[ci]})
            </text>
          ]
        )
      })}
    </svg>
  )
}

export default function NeuralNetwork() {
  const [k, setK] = useState(4)
  const [layerIndex, setLayerIndex] = useState(0)
  const [result, setResult] = useState<NNResult | null>(null)
  const tc = useThemeColors()

  async function load(kVal: number, layer: number) {
    const res = await fetch('/api/svd/neural-net', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ k: kVal, layer_index: layer }),
    })
    setResult(await res.json())
  }

  useEffect(() => { load(4, 0) }, [])

  const sv = result?.singular_values || []
  const barColors = sv.map((_, i) => i < k ? tc.accent : tc.accentDim)

  return (
    <div className="page">
      <h3 className="mb-16">神经网络中的 SVD</h3>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        神经网络的权重矩阵可以用 SVD 分解后做低秩近似，实现模型压缩。
        较小的奇异值对应的方向携带较少信息，截断它们可以在几乎不损失精度的情况下减少参数量。
      </p>

      {result && (
        <div className="card mb-16" style={{ textAlign: 'center' }}>
          <label className="mb-12" style={{ display: 'block' }}>输入(8) → 隐藏(16) → 输出(4)</label>
          <NetworkDiagram layers={result.layers} />
        </div>
      )}

      <div className="grid-2 mb-16">
        <div className="card">
          <label>权重层</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['输入→隐藏 (8x16)', '隐藏→输出 (16x4)'].map((name, i) => (
              <button
                key={i}
                className={`btn ${layerIndex === i ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setLayerIndex(i); load(k, i) }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <label>保留秩 k = {k} / {result?.total_rank || '?'}</label>
          <input
            type="range"
            min={1}
            max={result?.total_rank || 8}
            value={k}
            onChange={e => { const v = Number(e.target.value); setK(v); load(v, layerIndex) }}
            style={{ marginTop: 8 }}
          />
          {result && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span className="metric" style={{ fontSize: 13 }}>
                原始: <strong style={{ color: 'var(--success)' }}>{(result.accuracy_original * 100).toFixed(1)}%</strong>
              </span>
              <span className="metric" style={{ fontSize: 13 }}>
                压缩后: <strong style={{ color: result.accuracy_compressed >= result.accuracy_original * 0.9 ? 'var(--success)' : 'var(--error)' }}>
                  {(result.accuracy_compressed * 100).toFixed(1)}%
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="grid-2">
          <div className="card">
            <Plot
              data={[{
                x: sv.map((_, i) => `σ${i + 1}`),
                y: sv,
                type: 'bar',
                marker: { color: barColors },
              }]}
              layout={{
                title: { text: '奇异值分布', font: { size: 14, color: tc.plotlyTitle } },
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: tc.plotlyText, size: 11 },
                xaxis: { gridcolor: tc.plotlyGrid },
                yaxis: { title: 'σ', gridcolor: tc.plotlyGrid },
                margin: { t: 40, b: 40, l: 50, r: 20 },
                height: 280,
              }}
              config={{ displayModeBar: false, responsive: true }}
              style={{ width: '100%' }}
            />
          </div>
          <div className="card">
            <div className="grid-2" style={{ gap: 8 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, textAlign: 'center' }}>原始权重</label>
                <Plot
                  data={[{ z: result.original_weights, type: 'heatmap', colorscale: 'RdBu', showscale: false }]}
                  layout={{
                    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                    margin: { t: 5, b: 5, l: 5, r: 5 }, height: 200,
                    xaxis: { showticklabels: false }, yaxis: { showticklabels: false },
                  }}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, textAlign: 'center' }}>k={k} 近似</label>
                <Plot
                  data={[{ z: result.compressed_weights, type: 'heatmap', colorscale: 'RdBu', showscale: false }]}
                  layout={{
                    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                    margin: { t: 5, b: 5, l: 5, r: 5 }, height: 200,
                    xaxis: { showticklabels: false }, yaxis: { showticklabels: false },
                  }}
                  config={{ displayModeBar: false, responsive: true }}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
