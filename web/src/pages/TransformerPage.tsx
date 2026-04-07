import { useState } from 'react'
import createPlotlyComponent from 'react-plotly.js/factory'
import Plotly from 'plotly.js-basic-dist-min'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { useThemeColors } from '../useThemeColors'

const Plot = createPlotlyComponent(Plotly)

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

// softmax 工具函数
function softmax(arr: number[]): number[] {
  const max = Math.max(...arr)
  const exps = arr.map(x => Math.exp(x - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(e => e / sum)
}

// 生成随机矩阵
function randomMatrix(rows: number, cols: number, seed: number): number[][] {
  let s = seed
  function rand() {
    s = (s * 16807 + 0) % 2147483647
    return (s / 2147483647) * 2 - 1
  }
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Math.round(rand() * 100) / 100)
  )
}

// 矩阵乘法
function matMul(a: number[][], b: number[][]): number[][] {
  const rows = a.length, cols = b[0].length, inner = b.length
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => {
      let sum = 0
      for (let k = 0; k < inner; k++) sum += a[i][k] * b[k][j]
      return Math.round(sum * 100) / 100
    })
  )
}

// Self-Attention 交互
function SelfAttention() {
  const [sentence, setSentence] = useState('我 爱 学习 AI')
  const [scale, setScale] = useState(1.0)
  const [seed, setSeed] = useState(42)
  const tc = useThemeColors()

  const tokens = sentence.split(/\s+/).filter(Boolean)
  const n = tokens.length
  const dK = 4

  // 生成 QKV 矩阵
  const Q = randomMatrix(n, dK, seed)
  const K_mat = randomMatrix(n, dK, seed + 1)

  // 计算 attention scores: Q·K^T / sqrt(dK) * scale
  const scores = computeScores(Q, K_mat, dK, scale)
  // 每行做 softmax
  const attnWeights = scores.map(row => softmax(row))

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>Self-Attention 可视化</label>
        <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}
          onClick={() => setSeed(seed + 7)}>重新生成 QKV</button>
      </div>

      <div className="flex-center mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ textTransform: 'none', letterSpacing: 0 }}>输入句子 (空格分词)</label>
          <input type="text" value={sentence}
            onChange={e => setSentence(e.target.value)}
            style={{
              width: '100%', marginTop: 4, padding: '6px 10px', fontSize: 13,
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 6,
            }}
          />
        </div>
        <div style={{ minWidth: 160 }}>
          <label>Temperature / Scale = {scale.toFixed(1)}</label>
          <input type="range" min={0.1} max={3.0} step={0.1} value={scale}
            style={{ width: '100%', marginTop: 4 }}
            onChange={e => setScale(Number(e.target.value))} />
        </div>
      </div>

      {n > 0 && n <= 10 && (
        <Plot
          data={[{
            z: attnWeights.map(r => [...r]).reverse(),
            x: tokens,
            y: [...tokens].reverse(),
            type: 'heatmap',
            colorscale: [[0, '#1a1a2e'], [0.5, '#16537e'], [1, tc.accent]],
            showscale: true,
            colorbar: { len: 0.8, thickness: 10, tickfont: { size: 9, color: tc.plotlyText } },
            text: attnWeights.map(r => [...r]).reverse().map(r => r.map(v => v.toFixed(3))),
            hovertemplate: 'Query: %{y}<br>Key: %{x}<br>Attention: %{text}<extra></extra>',
          }]}
          layout={{
            title: { text: 'Attention Weight 热力图', font: { size: 14, color: tc.plotlyTitle } },
            paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
            font: { color: tc.plotlyText, size: 11 },
            xaxis: { title: 'Key', side: 'bottom' },
            yaxis: { title: 'Query' },
            margin: { t: 40, b: 60, l: 60, r: 40 },
            height: 350,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%' }}
        />
      )}

      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
        <Tex math={`\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}} \\cdot \\text{scale}\\right)V`} />
        <span style={{ marginLeft: 8 }}>当前 d_k={dK}, scale={scale.toFixed(1)}</span>
      </div>
    </div>
  )
}

// 从 SelfAttention 抽出的分数计算
function computeScores(Q: number[][], K: number[][], dK: number, scale: number): number[][] {
  const KT = K[0].map((_, j) => K.map(row => row[j]))
  const raw = matMul(Q, KT)
  const factor = Math.sqrt(dK) / scale
  return raw.map(row => row.map(v => v / factor))
}

// 位置编码可视化
function PositionalEncoding() {
  const [seqLen, setSeqLen] = useState(32)
  const [dModel, setDModel] = useState(64)
  const tc = useThemeColors()

  // 计算 sinusoidal 位置编码
  const pe = computePE(seqLen, dModel)

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>Sinusoidal 位置编码</label>
        <div className="flex-center" style={{ gap: 16 }}>
          <div>
            <span style={{ fontSize: 11 }}>序列长度 = {seqLen}</span>
            <input type="range" min={8} max={64} value={seqLen} style={{ width: 100 }}
              onChange={e => setSeqLen(Number(e.target.value))} />
          </div>
          <div>
            <span style={{ fontSize: 11 }}>维度 = {dModel}</span>
            <input type="range" min={16} max={128} step={16} value={dModel} style={{ width: 100 }}
              onChange={e => setDModel(Number(e.target.value))} />
          </div>
        </div>
      </div>

      <Plot
        data={[{
          z: pe,
          type: 'heatmap',
          colorscale: 'RdBu',
          showscale: true,
          colorbar: { len: 0.8, thickness: 10, tickfont: { size: 9, color: tc.plotlyText } },
        }]}
        layout={{
          title: { text: '位置编码矩阵 (行=位置, 列=维度)', font: { size: 13, color: tc.plotlyTitle } },
          paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
          font: { color: tc.plotlyText, size: 11 },
          xaxis: { title: '维度 (d)', gridcolor: tc.plotlyGrid },
          yaxis: { title: '位置 (pos)', autorange: 'reversed', gridcolor: tc.plotlyGrid },
          margin: { t: 40, b: 50, l: 50, r: 30 },
          height: 300,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
      />

      <div style={{ fontSize: 12, marginTop: 8 }}>
        <Tex math="PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right), \quad PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)" block />
      </div>
    </div>
  )
}

function computePE(seqLen: number, dModel: number): number[][] {
  return Array.from({ length: seqLen }, (_, pos) =>
    Array.from({ length: dModel }, (_, i) => {
      const angle = pos / Math.pow(10000, (2 * Math.floor(i / 2)) / dModel)
      return i % 2 === 0 ? Math.sin(angle) : Math.cos(angle)
    })
  )
}

// Transformer 架构图
function TransformerArch() {
  const [selected, setSelected] = useState<string | null>(null)

  const modules: Record<string, string> = {
    'Multi-Head\nAttention': '多头注意力: 将 Q/K/V 分成 h 个头，各自计算注意力后拼接。允许模型关注不同位置的不同表示子空间。',
    'Add & Norm₁': '残差连接 + 层归一化: output = LayerNorm(x + Sublayer(x))。稳定训练、加速收敛。',
    'Feed Forward': '逐位置前馈网络: FFN(x) = max(0, xW₁+b₁)W₂+b₂。两层线性变换+ReLU，隐层通常 4×d_model。',
    'Add & Norm₂': '第二个残差连接 + 层归一化，包裹 FFN 子层。',
    'Masked MHA': '掩码多头注意力: 在解码器中防止关注未来位置，保证自回归生成。',
    'Cross Attention': '交叉注意力: Q 来自解码器，K/V 来自编码器输出，实现编码-解码信息交互。',
  }

  const encBlocks = ['Multi-Head\nAttention', 'Add & Norm₁', 'Feed Forward', 'Add & Norm₂']
  const decBlocks = ['Masked MHA', 'Add & Norm₁', 'Cross Attention', 'Add & Norm₂', 'Feed Forward', 'Add & Norm₂']

  return (
    <div className="card mb-16">
      <label className="mb-16" style={{ display: 'block' }}>Transformer 架构 (点击模块查看说明)</label>
      <div className="grid-2">
        <div>
          <ArchColumn title="Encoder" blocks={encBlocks} selected={selected}
            onSelect={setSelected} modules={modules} color="var(--accent)" />
        </div>
        <div>
          <ArchColumn title="Decoder" blocks={decBlocks} selected={selected}
            onSelect={setSelected} modules={modules} color="#3b82f6" />
        </div>
      </div>
      {selected && (
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 8,
          background: 'var(--bg-surface)', border: '1px solid var(--accent)',
          fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
        }}>
          <strong style={{ color: 'var(--text-primary)' }}>{selected.replace('\n', ' ')}</strong>：{modules[selected]}
        </div>
      )}
    </div>
  )
}

// 架构列
function ArchColumn({ title, blocks, selected, onSelect, modules, color }: {
  title: string; blocks: string[]; selected: string | null
  onSelect: (s: string) => void; modules: Record<string, string>; color: string
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color }}>{title}</div>
      <svg viewBox={`0 0 200 ${blocks.length * 52 + 20}`} style={{ width: '100%', maxWidth: 200 }}>
        <defs>
          <marker id="arch-arr" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4" fill="var(--text-muted)" />
          </marker>
        </defs>
        {blocks.map((name, i) => {
          const y = 10 + i * 52
          const isSel = selected === name
          return (
            <g key={`${name}-${i}`} style={{ cursor: 'pointer' }} onClick={() => onSelect(name)}>
              <rect x={10} y={y} width={180} height={38} rx={6}
                fill={isSel ? 'var(--accent-muted)' : 'var(--bg-card)'}
                stroke={isSel ? color : 'var(--border)'} strokeWidth={isSel ? 2 : 1} />
              {name.split('\n').map((line, li) => (
                <text key={li} x={100} y={y + 18 + li * 13} textAnchor="middle" fontSize={10}
                  fill={isSel ? color : 'var(--text-primary)'} fontWeight={isSel ? 600 : 400}>
                  {line}
                </text>
              ))}
              {i < blocks.length - 1 && (
                <line x1={100} y1={y + 38} x2={100} y2={y + 52}
                  stroke="var(--text-muted)" strokeWidth={1} markerEnd="url(#arch-arr)" />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// Multi-Head Attention 示意图
function MultiHeadDiagram() {
  const [numHeads, setNumHeads] = useState(4)
  const headColors = ['#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4']

  return (
    <div className="card mb-16">
      <div className="flex-between mb-16">
        <label>Multi-Head Attention 示意</label>
        <div className="flex-center">
          <span style={{ fontSize: 12 }}>Head 数量 = {numHeads}</span>
          <input type="range" min={1} max={8} value={numHeads} style={{ width: 100 }}
            onChange={e => setNumHeads(Number(e.target.value))} />
        </div>
      </div>

      <svg viewBox={`0 0 ${Math.max(400, numHeads * 80 + 80)} 200`}
        style={{ width: '100%', maxWidth: Math.max(400, numHeads * 80 + 80) }}>
        <defs>
          <marker id="mh-arr" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <path d="M0,0 L6,2 L0,4" fill="var(--text-muted)" />
          </marker>
        </defs>

        {/* 输入 */}
        <rect x={10} y={80} width={60} height={35} rx={6}
          fill="var(--bg-surface)" stroke="var(--border)" />
        <text x={40} y={95} textAnchor="middle" fontSize={10} fill="var(--text-primary)">Input</text>
        <text x={40} y={107} textAnchor="middle" fontSize={9} fill="var(--text-muted)">(n × d)</text>

        {/* Split 线 */}
        {Array.from({ length: numHeads }, (_, i) => {
          const hx = 120 + i * 70
          return (
            <g key={i}>
              <line x1={70} y1={97} x2={hx + 25} y2={60}
                stroke={headColors[i % headColors.length]} strokeWidth={1.5} opacity={0.6} />
              <rect x={hx} y={40} width={50} height={40} rx={6}
                fill="var(--accent-muted)"
                stroke={headColors[i % headColors.length]} strokeWidth={1.5} />
              <text x={hx + 25} y={57} textAnchor="middle" fontSize={9}
                fill={headColors[i % headColors.length]} fontWeight={600}>Head {i + 1}</text>
              <text x={hx + 25} y={72} textAnchor="middle" fontSize={8} fill="var(--text-muted)">
                d/{numHeads}
              </text>
              {/* 到 Concat 的线 */}
              <line x1={hx + 25} y1={80} x2={concatX(numHeads)} y2={140}
                stroke={headColors[i % headColors.length]} strokeWidth={1.5} opacity={0.6} />
            </g>
          )
        })}

        {/* Concat */}
        <rect x={concatX(numHeads) - 35} y={140} width={70} height={30} rx={6}
          fill="var(--bg-surface)" stroke="var(--accent)" strokeWidth={1.5} />
        <text x={concatX(numHeads)} y={159} textAnchor="middle" fontSize={10}
          fill="var(--accent)" fontWeight={600}>Concat + W_o</text>

        {/* 输出 */}
        <line x1={concatX(numHeads)} y1={170} x2={concatX(numHeads)} y2={190}
          stroke="var(--text-muted)" strokeWidth={1} markerEnd="url(#mh-arr)" />
        <text x={concatX(numHeads)} y={198} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
          Output (n × d)
        </text>
      </svg>

      <div style={{ fontSize: 12, marginTop: 8 }}>
        <Tex math={`\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1, \\ldots, \\text{head}_{${numHeads}}) W^O`} block />
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
          每个 head: <Tex math={`\\text{head}_i = \\text{Attention}(QW_i^Q, KW_i^K, VW_i^V), \\quad d_k = d_{model} / ${numHeads}`} />
        </div>
      </div>
    </div>
  )
}

function concatX(numHeads: number) {
  return 120 + (numHeads - 1) * 35
}

// 公式区
function TransformerFormulas() {
  return (
    <div className="card">
      <label className="mb-16" style={{ display: 'block' }}>核心公式</label>
      <div style={{ display: 'grid', gap: 12 }}>
        <FormulaBlock title="Scaled Dot-Product Attention"
          formula="\text{Attention}(Q,K,V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V" />
        <FormulaBlock title="Multi-Head Attention"
          formula="\text{MultiHead}(Q,K,V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h) W^O" />
        <FormulaBlock title="位置编码 (偶数维)"
          formula="PE_{(pos, 2i)} = \sin\left(\frac{pos}{10000^{2i/d_{model}}}\right)" />
        <FormulaBlock title="位置编码 (奇数维)"
          formula="PE_{(pos, 2i+1)} = \cos\left(\frac{pos}{10000^{2i/d_{model}}}\right)" />
        <FormulaBlock title="前馈网络"
          formula="\text{FFN}(x) = \max(0, xW_1 + b_1)W_2 + b_2" />
      </div>
    </div>
  )
}

function FormulaBlock({ title, formula }: { title: string; formula: string }) {
  return (
    <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
      <Tex math={formula} block />
    </div>
  )
}

export default function TransformerPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      <h3 className="mb-16">Transformer</h3>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        Transformer 通过自注意力机制并行处理序列，是 GPT、BERT 等现代大模型的基础架构。
        其核心是 Scaled Dot-Product Attention 和 Multi-Head 机制。
      </p>

      <SelfAttention />
      <PositionalEncoding />
      <TransformerArch />

      <div className="grid-2 mb-16">
        <MultiHeadDiagram />
        <TransformerFormulas />
      </div>
    </div>
  )
}
