import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import { postEigenfaces } from '../api'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

interface EigenfacesResult {
  eigenfaces: string[]
  scatter_3d: { x: number; y: number; z: number; label: number }[]
  target_names: string[]
  reconstruction: { original: string; reconstructed: string } | null
  explained_variance_ratio: number[]
  face_shape: number[]
  total_faces: number
}

// 为不同标签分配颜色
const COLORS = [
  '#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#14b8a6',
  '#6366f1', '#d946ef', '#22d3ee', '#a3e635', '#fb923c',
]

function ScatterPoints({ points }: { points: EigenfacesResult['scatter_3d'] }) {
  // 归一化坐标到 [-3, 3]
  const maxAbs = Math.max(
    ...points.map(p => Math.abs(p.x)),
    ...points.map(p => Math.abs(p.y)),
    ...points.map(p => Math.abs(p.z)),
    1,
  )
  const scale = 3 / maxAbs

  return (
    <group>
      {points.map((p, i) => (
        <mesh key={i} position={[p.x * scale, p.y * scale, p.z * scale]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={COLORS[p.label % COLORS.length]} />
        </mesh>
      ))}
    </group>
  )
}

function AxisLines() {
  return (
    <group>
      <Line points={[[-4,0,0],[4,0,0]]} color="#f85149" lineWidth={1} opacity={0.3} transparent />
      <Line points={[[0,-4,0],[0,4,0]]} color="#3fb950" lineWidth={1} opacity={0.3} transparent />
      <Line points={[[0,0,-4],[0,0,4]]} color="#58a6ff" lineWidth={1} opacity={0.3} transparent />
    </group>
  )
}

export default function Eigenfaces() {
  const [nComponents, setNComponents] = useState(20)
  const [imageIndex, setImageIndex] = useState<number | undefined>(0)
  const [result, setResult] = useState<EigenfacesResult | null>(null)
  const tc = useThemeColors()

  async function load(n: number, idx?: number) {
    try {
      const data = await postEigenfaces(n, idx)
      setResult(data)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { load(20, 0) }, [])

  const evr = result?.explained_variance_ratio || []
  const cumulative = evr.reduce<number[]>((acc, v) => {
    acc.push((acc[acc.length - 1] || 0) + v)
    return acc
  }, [])

  return (
    <div className="page">
      <h3 className="mb-16">SVD 降维与特征脸 (Eigenfaces)</h3>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        对人脸图像矩阵做 SVD，得到的右奇异向量就是"特征脸"。
        它们代表人脸数据中最重要的变化方向（主成分），可用于人脸识别和降维可视化。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* 左侧：3D 散点图 */}
        <div className="card" style={{ height: 450 }}>
          <label className="mb-12" style={{ display: 'block' }}>
            3D 主成分投影 (PC1, PC2, PC3) — 拖拽旋转
          </label>
          <div style={{ height: 380, borderRadius: 8, overflow: 'hidden', background: tc.canvasBg }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <pointLight position={[10, 10, 10]} />
              <AxisLines />
              {result && <ScatterPoints points={result.scatter_3d} />}
              <OrbitControls enableDamping dampingFactor={0.1} />
            </Canvas>
          </div>
        </div>

        {/* 右侧上：特征脸 */}
        <div>
          <div className="card mb-16">
            <label className="mb-12" style={{ display: 'block' }}>
              前 {result?.eigenfaces.length || 0} 个特征脸
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: 6,
            }}>
              {result?.eigenfaces.map((face, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <img
                    src={`data:image/png;base64,${face}`}
                    alt={`eigenface ${i + 1}`}
                    style={{ width: '100%', borderRadius: 4, filter: 'grayscale(100%)' }}
                  />
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>#{i + 1}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 控制面板 */}
          <div className="card mb-16">
            <label>主成分数量: {nComponents}</label>
            <input
              type="range"
              min={1}
              max={50}
              value={nComponents}
              onChange={e => {
                const v = Number(e.target.value)
                setNComponents(v)
                load(v, imageIndex)
              }}
              style={{ marginTop: 8 }}
            />
            {cumulative.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                累计解释方差: {(cumulative[cumulative.length - 1] * 100).toFixed(1)}%
              </div>
            )}
          </div>

          {/* 重建对比 */}
          {result?.reconstruction && (
            <div className="card">
              <label className="mb-12" style={{ display: 'block' }}>
                人脸重建（第 {(imageIndex ?? 0) + 1} 张）
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <img
                    src={`data:image/png;base64,${result.reconstruction.original}`}
                    alt="original"
                    style={{ width: '100%', borderRadius: 4 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>原图</div>
                </div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <img
                    src={`data:image/png;base64,${result.reconstruction.reconstructed}`}
                    alt="reconstructed"
                    style={{ width: '100%', borderRadius: 4 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {nComponents} 个主成分重建
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>选择人脸 (0-{(result.total_faces || 1) - 1})</label>
                <input
                  type="range"
                  min={0}
                  max={(result.total_faces || 1) - 1}
                  value={imageIndex ?? 0}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setImageIndex(v)
                    load(nComponents, v)
                  }}
                  style={{ marginTop: 4 }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 方差解释图 */}
      {evr.length > 0 && (
        <div className="card mt-20">
          <Plot
            data={[
              {
                x: evr.map((_, i) => i + 1),
                y: evr,
                type: 'bar',
                name: '单个方差',
                marker: { color: tc.accent },
              },
              {
                x: cumulative.map((_, i) => i + 1),
                y: cumulative,
                type: 'scatter',
                mode: 'lines+markers',
                name: '累计方差',
                yaxis: 'y2',
                line: { color: '#3b82f6', width: 2 },
                marker: { size: 4 },
              },
            ]}
            layout={{
              title: { text: '各主成分解释方差比', font: { size: 14, color: tc.plotlyTitle } },
              paper_bgcolor: 'transparent',
              plot_bgcolor: 'transparent',
              font: { color: tc.plotlyText, size: 11 },
              xaxis: { title: '主成分', gridcolor: tc.plotlyGrid },
              yaxis: { title: '方差比', gridcolor: tc.plotlyGrid },
              yaxis2: { title: '累计比', overlaying: 'y', side: 'right', gridcolor: tc.plotlyGrid, range: [0, 1.05] },
              margin: { t: 40, b: 50, l: 60, r: 60 },
              height: 280,
              legend: { x: 0.7, y: 0.3, bgcolor: 'transparent' },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%' }}
          />
        </div>
      )}
    </div>
  )
}
