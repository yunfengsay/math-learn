import { useState, useEffect } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import { fetchSamples, postImageCompress, uploadImage } from '../api'
import ImageUploader from '../components/ImageUploader'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

interface Sample { id: string; name: string; thumbnail: string }
interface CompressResult {
  compressed_image: string
  original_image: string
  singular_values: number[]
  k: number
  total_rank: number
  retained_ratio: number
  shape: number[]
  original_size_kb: number
  compressed_size_kb: number
}

export default function ImageCompression() {
  const [samples, setSamples] = useState<Sample[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [k, setK] = useState(20)
  const [result, setResult] = useState<CompressResult | null>(null)
  const [loading, setLoading] = useState(false)
  const tc = useThemeColors()

  useEffect(() => {
    fetchSamples().then(data => {
      setSamples(data.samples)
      if (data.samples.length > 0) {
        const first = data.samples[0]
        setSelectedId(first.id)
        loadImage(first.id, 20)
      }
    })
  }, [])

  async function loadImage(imageId: string, kVal: number) {
    setLoading(true)
    const data = await postImageCompress(imageId, kVal)
    setResult(data)
    setLoading(false)
  }

  function handleSelectImage(id: string) {
    setSelectedId(id)
    setK(20)
    loadImage(id, 20)
  }

  function handleKChange(newK: number) {
    setK(newK)
    if (selectedId) loadImage(selectedId, newK)
  }

  async function handleUpload(file: File) {
    const data = await uploadImage(file)
    setSamples(prev => [...prev, data])
    setSelectedId(data.id)
    setK(20)
    loadImage(data.id, 20)
  }

  const sv = result?.singular_values || []

  return (
    <div className="page">
      <h3 className="mb-16">SVD 图像压缩 — K 秩近似</h3>

      {/* 图片选择 */}
      <div className="flex-center mb-16" style={{ flexWrap: 'wrap', gap: 8 }}>
        {samples.map(s => (
          <button
            key={s.id}
            onClick={() => handleSelectImage(s.id)}
            style={{
              border: s.id === selectedId ? '2px solid var(--accent)' : '2px solid var(--border)',
              borderRadius: 8, padding: 4, background: 'transparent', cursor: 'pointer',
            }}
          >
            <img
              src={`data:image/png;base64,${s.thumbnail}`}
              alt={s.name}
              style={{ width: 60, height: 60, borderRadius: 4, display: 'block' }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{s.name}</div>
          </button>
        ))}
        <ImageUploader onUpload={handleUpload} />
      </div>

      {result && (
        <>
          {/* 图片对比 */}
          <div className="grid-2 mb-16">
            <div className="card" style={{ textAlign: 'center' }}>
              <label className="mb-12" style={{ display: 'block' }}>原始图像</label>
              <img
                src={`data:image/png;base64,${result.original_image}`}
                alt="original"
                style={{ maxWidth: '100%', borderRadius: 4 }}
              />
              <div className="metric" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                {result.shape[0]}x{result.shape[1]} | 秩 {result.total_rank} | <strong>{result.original_size_kb} KB</strong>
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <label className="mb-12" style={{ display: 'block' }}>
                k = {result.k} 近似 ({(result.retained_ratio * 100).toFixed(2)}% 信息保留)
              </label>
              <img
                src={`data:image/png;base64,${result.compressed_image}`}
                alt="compressed"
                style={{ maxWidth: '100%', borderRadius: 4, opacity: loading ? 0.5 : 1 }}
              />
              <div className="metric" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                <strong style={{ color: 'var(--accent)' }}>{result.compressed_size_kb} KB</strong>
                {' '}({((result.compressed_size_kb / result.original_size_kb) * 100).toFixed(1)}% 存储)
                {' | '}节省 {(result.original_size_kb - result.compressed_size_kb).toFixed(1)} KB
              </div>
            </div>
          </div>

          {/* Slider + 奇异值曲线 */}
          <div className="grid-2">
            <div className="card">
              <label>k 值: {k} / {result.total_rank}</label>
              <input
                type="range"
                min={1}
                max={result.total_rank}
                value={k}
                onChange={e => handleKChange(Number(e.target.value))}
                style={{ marginTop: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                <span>1 (最大压缩)</span>
                <span>{result.total_rank} (无损)</span>
              </div>
            </div>
            <div className="card">
              <Plot
                data={[
                  {
                    x: sv.map((_, i) => i + 1),
                    y: sv,
                    type: 'scatter',
                    mode: 'lines',
                    name: '奇异值',
                    line: { color: tc.accent, width: 2 },
                  },
                ]}
                layout={{
                  title: { text: '奇异值分布', font: { size: 14, color: tc.plotlyTitle } },
                  paper_bgcolor: 'transparent',
                  plot_bgcolor: 'transparent',
                  font: { color: tc.plotlyText, size: 11 },
                  xaxis: {
                    title: 'index',
                    gridcolor: tc.plotlyGrid,
                    zerolinecolor: tc.plotlyGrid,
                  },
                  yaxis: {
                    title: 'σ',
                    gridcolor: tc.plotlyGrid,
                    zerolinecolor: tc.plotlyGrid,
                  },
                  shapes: [{
                    type: 'line',
                    x0: k, x1: k, y0: 0, y1: Math.max(...sv),
                    line: { color: '#f85149', width: 2, dash: 'dash' },
                  }],
                  margin: { t: 40, b: 40, l: 50, r: 20 },
                  height: 250,
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
