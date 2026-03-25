import { useState, useEffect } from 'react'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { postSvdCompute } from '../api'

function Tex({ math, block = false }: { math: string; block?: boolean }) {
  const html = katex.renderToString(math, { displayMode: block, throwOnError: false })
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

function K({ children }: { children: string }) {
  return <Tex math={children} />
}

// --- 2D 几何可视化：单位圆 → 椭圆 ---
function GeometryViz() {
  const [matrix, setMatrix] = useState([[2, 1], [1, 3]])
  const [svdData, setSvdData] = useState<{
    U: number[][], sigma: number[], Vt: number[][]
  } | null>(null)
  const [step, setStep] = useState(3) // 0=原始, 1=Vt旋转, 2=Σ缩放, 3=U旋转

  useEffect(() => {
    postSvdCompute(matrix).then(setSvdData)
  }, [matrix])

  const size = 200, cx = size / 2, cy = size / 2, scale = 30

  function transformPoint(x: number, y: number): [number, number] {
    if (!svdData) return [cx + x * scale, cy - y * scale]
    const { U, sigma, Vt } = svdData
    let px = x, py = y
    // Step 1: Vt rotation
    if (step >= 1) {
      const nx = Vt[0][0] * px + Vt[0][1] * py
      const ny = Vt[1][0] * px + Vt[1][1] * py
      px = nx; py = ny
    }
    // Step 2: Sigma scaling
    if (step >= 2) { px *= sigma[0]; py *= sigma[1] }
    // Step 3: U rotation
    if (step >= 3) {
      const nx = U[0][0] * px + U[0][1] * py
      const ny = U[1][0] * px + U[1][1] * py
      px = nx; py = ny
    }
    return [cx + px * scale, cy - py * scale]
  }

  // 单位圆上的点
  const circlePoints = Array.from({ length: 64 }, (_, i) => {
    const t = (i / 64) * Math.PI * 2
    return transformPoint(Math.cos(t), Math.sin(t))
  })
  const pathD = circlePoints.map(([x, y], i) =>
    `${i === 0 ? 'M' : 'L'}${x},${y}`
  ).join(' ') + 'Z'

  // 基向量
  const e1 = transformPoint(1, 0)
  const e2 = transformPoint(0, 1)
  const origin: [number, number] = [cx, cy]

  const stepLabels = ['原始单位圆', 'V^T 旋转', '\\Sigma 缩放', 'U 旋转 (完整变换)']

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {stepLabels.map((label, i) => (
          <button key={i} className={`btn ${step === i ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
            onClick={() => setStep(i)}>
            <Tex math={label} />
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
        <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: 200, background: 'var(--bg-surface)', borderRadius: 8 }}>
          {/* 网格 */}
          {[-3, -2, -1, 1, 2, 3].map(v => (
            <g key={v}>
              <line x1={cx + v * scale} y1={0} x2={cx + v * scale} y2={size} stroke="var(--border)" strokeWidth={0.3} />
              <line x1={0} y1={cy - v * scale} x2={size} y2={cy - v * scale} stroke="var(--border)" strokeWidth={0.3} />
            </g>
          ))}
          <line x1={0} y1={cy} x2={size} y2={cy} stroke="var(--border)" strokeWidth={0.5} />
          <line x1={cx} y1={0} x2={cx} y2={size} stroke="var(--border)" strokeWidth={0.5} />
          {/* 变换后的形状 */}
          <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={1.5} opacity={0.8} />
          {/* 基向量 */}
          <line x1={origin[0]} y1={origin[1]} x2={e1[0]} y2={e1[1]} stroke="#ef4444" strokeWidth={1.5} markerEnd="url(#arrow-r)" />
          <line x1={origin[0]} y1={origin[1]} x2={e2[0]} y2={e2[1]} stroke="#3b82f6" strokeWidth={1.5} markerEnd="url(#arrow-b)" />
          <defs>
            <marker id="arrow-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#ef4444" /></marker>
            <marker id="arrow-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#3b82f6" /></marker>
          </defs>
        </svg>
        <div style={{ fontSize: 11 }}>
          <div style={{ marginBottom: 4 }}>
            <label style={{ textTransform: 'none', letterSpacing: 0 }}>矩阵 A</label>
          </div>
          {matrix.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
              {row.map((v, j) => (
                <input key={j} type="number" value={v} style={{
                  width: 48, padding: '3px 6px', fontSize: 12, textAlign: 'center',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  border: '1px solid var(--border)', borderRadius: 4,
                }}
                  onChange={e => {
                    const m = matrix.map(r => [...r])
                    m[i][j] = Number(e.target.value) || 0
                    setMatrix(m)
                  }}
                />
              ))}
            </div>
          ))}
          {svdData && (
            <div className="metric" style={{ fontSize: 10, marginTop: 6, lineHeight: 1.6 }}>
              <div>σ₁={svdData.sigma[0]?.toFixed(2)}, σ₂={svdData.sigma[1]?.toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// --- 性质卡片 ---
const properties = [
  { title: '存在性', formula: '\\forall A \\in \\mathbb{R}^{m \\times n}, \\exists \\text{ SVD}', note: '任意矩阵都有 SVD 分解' },
  { title: '秩', formula: '\\text{rank}(A) = \\text{非零奇异值个数}', note: 'σᵢ > 0 的数量' },
  { title: '范数', formula: '\\|A\\|_2 = \\sigma_1, \\quad \\|A\\|_F = \\sqrt{\\sum \\sigma_i^2}', note: '谱范数=最大奇异值' },
  { title: '最优低秩近似', formula: '\\min_{\\text{rank}(B)=k} \\|A-B\\|_F = \\sqrt{\\sum_{i=k+1}^{r} \\sigma_i^2}', note: 'Eckart-Young 定理' },
  { title: '伪逆', formula: 'A^+ = V \\Sigma^+ U^T', note: '最小二乘解 x = A⁺b' },
  { title: '条件数', formula: '\\kappa(A) = \\sigma_1 / \\sigma_r', note: '衡量矩阵"病态"程度' },
]

// --- 例题 ---
const examples = [
  {
    title: '2x2 对角矩阵',
    matrix: '\\begin{bmatrix} 3 & 0 \\\\ 0 & 2 \\end{bmatrix}',
    steps: [
      '对角矩阵的 SVD：U=I, Σ=A, V=I',
      '\\sigma_1 = 3, \\quad \\sigma_2 = 2',
      'A = I \\cdot \\begin{bmatrix} 3 & 0 \\\\ 0 & 2 \\end{bmatrix} \\cdot I^T',
    ],
  },
  {
    title: '3x2 非方阵',
    matrix: '\\begin{bmatrix} 1 & 1 \\\\ 0 & 1 \\\\ 1 & 0 \\end{bmatrix}',
    steps: [
      'A^T A = \\begin{bmatrix} 2 & 1 \\\\ 1 & 2 \\end{bmatrix}',
      '\\lambda_1=3, \\lambda_2=1 \\Rightarrow \\sigma_1=\\sqrt{3}, \\sigma_2=1',
      'V 由 A^T A 特征向量组成，U = AV\\Sigma^{-1}',
    ],
  },
  {
    title: '秩 1 矩阵',
    matrix: '\\begin{bmatrix} 2 & 4 \\\\ 1 & 2 \\end{bmatrix}',
    steps: [
      '\\text{rank}(A) = 1 \\Rightarrow 只有一个非零奇异值',
      '\\sigma_1 = 5, \\quad \\sigma_2 = 0',
      'A = \\sigma_1 u_1 v_1^T \\text{（外积形式）}',
    ],
  },
]

// --- 学习资源 ---
const resources = [
  { label: '3Blue1Brown: 线性代数的本质', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab', tag: '视频' },
  { label: 'Gilbert Strang MIT 18.06', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/', tag: '课程' },
  { label: 'SVD 的几何解释 (Steve Brunton)', url: 'https://www.youtube.com/watch?v=nbBvuuNVfco', tag: '视频' },
  { label: 'Wikipedia: Singular Value Decomposition', url: 'https://en.wikipedia.org/wiki/Singular_value_decomposition', tag: '参考' },
  { label: 'NumPy SVD 文档', url: 'https://numpy.org/doc/stable/reference/generated/numpy.linalg.svd.html', tag: 'API' },
  { label: 'SVD 在推荐系统中的应用', url: 'https://sifter.org/simon/journal/20061211.html', tag: '应用' },
]

// --- 关联概念 ---
const relatedConcepts = [
  { name: 'PCA', relation: 'SVD 是 PCA 的计算基础，X=UΣVᵀ → 主成分 = V 的列', formula: 'PC = XV = U\\Sigma' },
  { name: '最小二乘', relation: 'Ax≈b 的最小二乘解可通过伪逆 A⁺ 计算', formula: 'x = A^+ b = V\\Sigma^+ U^T b' },
  { name: '矩阵补全', relation: 'Netflix Prize: 低秩矩阵补全的核心工具', formula: '\\min \\|M - UV^T\\|_F' },
  { name: 'LoRA', relation: '大模型微调: W₀+ΔW, 其中 ΔW=BA 是低秩分解', formula: '\\Delta W = BA, B \\in \\mathbb{R}^{d \\times r}' },
]

function ExampleCard({ ex }: { ex: typeof examples[0] }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '10px 0' }}>
      <div className="flex-between">
        <strong style={{ fontSize: 13 }}>{ex.title}</strong>
        <button className="btn btn-secondary" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => setOpen(!open)}>
          {open ? '收起' : '解法'}
        </button>
      </div>
      <div style={{ margin: '6px 0' }}><Tex math={`A = ${ex.matrix}`} block /></div>
      {open && (
        <div style={{ paddingTop: 4 }}>
          {ex.steps.map((s, i) => (
            <div key={i} style={{ margin: '4px 0', paddingLeft: 12, borderLeft: '2px solid var(--accent)', fontSize: 13 }}>
              <Tex math={s} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MatrixCalculator() {
  const [input, setInput] = useState('[[1, 2], [3, 4]]')
  const [result, setResult] = useState<{ U: number[][]; sigma: number[]; Vt: number[][] } | null>(null)

  async function compute() {
    try {
      const data = await postSvdCompute(JSON.parse(input))
      setResult(data)
    } catch { setResult(null) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
        <div style={{ flex: 1 }}>
          <label style={{ textTransform: 'none', letterSpacing: 0 }}>矩阵 (JSON)</label>
          <textarea value={input} onChange={e => setInput(e.target.value)} rows={2}
            style={{
              width: '100%', marginTop: 4,
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              border: '1px solid var(--border)', borderRadius: 6, padding: 8,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, resize: 'vertical',
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={compute} style={{ marginBottom: 2 }}>计算</button>
      </div>
      {result && (
        <div className="metric" style={{ fontSize: 11, marginTop: 8, background: 'var(--bg-surface)', padding: 10, borderRadius: 6, lineHeight: 1.8 }}>
          <div><strong>U</strong> = [{result.U.map(r => `[${r.map(v => v.toFixed(3)).join(', ')}]`).join(', ')}]</div>
          <div><strong style={{ color: 'var(--accent)' }}>σ</strong> = [{result.sigma.map(v => v.toFixed(4)).join(', ')}]</div>
          <div><strong>Vᵀ</strong> = [{result.Vt.map(r => `[${r.map(v => v.toFixed(3)).join(', ')}]`).join(', ')}]</div>
        </div>
      )}
    </div>
  )
}

const stories = [
  {
    tag: '商业',
    tagColor: '#f59e0b',
    title: 'Netflix Prize: 100 万美金的矩阵分解',
    body: '2006 年 Netflix 悬赏 100 万美金改进推荐算法。获胜团队 BellKor 的核心武器就是 SVD 矩阵分解——将"用户x电影"评分矩阵分解为低秩近似，发现用户的隐含偏好维度。这场竞赛让 SVD 从学术殿堂走进工业界，今天几乎所有推荐系统（淘宝、抖音、Spotify）的底层都有矩阵分解的影子。',
  },
  {
    tag: '学术',
    tagColor: '#3b82f6',
    title: 'Eckart-Young 1936: 最优近似定理',
    body: 'Carl Eckart 和 Gale Young 在 1936 年证明了一个优美的定理：对任意矩阵做秩 k 近似，SVD 截断就是 Frobenius 范数下的全局最优解。这个定理奠定了数据压缩和降维的数学基础，90 年后的今天仍是机器学习课程的核心内容。',
  },
  {
    tag: '前沿',
    tagColor: 'var(--accent)',
    title: 'LoRA 2021: 用 SVD 思想微调大模型',
    body: 'Edward Hu 等人提出 LoRA（Low-Rank Adaptation），核心思想直接来自 SVD：大模型权重的更新 ΔW 可以用低秩矩阵 BA 近似。这使得微调 GPT-3 级别的模型只需训练原始参数量的 0.1%，让个人开发者也能定制大模型。LoRA 已成为 LLM 微调的事实标准。',
  },
  {
    tag: '商业',
    tagColor: '#f59e0b',
    title: 'Google PageRank: 搜索引擎的数学内核',
    body: 'Larry Page 和 Sergey Brin 的 PageRank 算法本质上是对网页链接矩阵求主特征向量——这正是 SVD/特征分解的应用。Google 靠这个算法从车库创业到万亿市值。今天 SVD 仍在搜索排序、知识图谱、语义检索中扮演关键角色。',
  },
  {
    tag: '学术',
    tagColor: '#3b82f6',
    title: 'Turk & Pentland 1991: 特征脸开创人脸识别',
    body: 'MIT 的 Turk 和 Pentland 将 SVD/PCA 应用于人脸图像，提取"特征脸"（Eigenfaces）作为人脸空间的基向量。仅用 50 个特征脸就能准确识别身份。这篇论文被引用超过 2 万次，开创了计算机视觉中基于子空间的识别方法，直接影响了后来深度学习的发展路径。',
  },
  {
    tag: '前沿',
    tagColor: 'var(--accent)',
    title: 'Stable Diffusion: 图像生成中的 SVD',
    body: 'Stability AI 的视频生成模型直接以 SVD（Stable Video Diffusion）命名。在扩散模型中，对 attention 层的权重做 SVD 分解可以实现模型压缩和风格迁移。SVD 还被用于 ControlNet 的条件注入——将控制信号投影到模型的主要奇异向量方向。',
  },
  {
    tag: '商业',
    tagColor: '#f59e0b',
    title: '金融风控: JP Morgan 的风险因子分解',
    body: '华尔街用 SVD/PCA 分解资产收益率矩阵，提取市场风险因子。JP Morgan 的 RiskMetrics 系统用 SVD 将上千种资产的相关性压缩为几十个主成分，使得万亿级投资组合的风险计算从不可能变为实时。2008 年金融危机后，SVD 在压力测试中的应用更加关键。',
  },
  {
    tag: '学术',
    tagColor: '#3b82f6',
    title: 'Latent Semantic Analysis: NLP 的奠基工作',
    body: 'Deerwester 等人在 1990 年提出 LSA，对"词-文档"矩阵做 SVD，发现词语的语义关系藏在低秩结构中。"king - man + woman = queen" 这类词向量类比的数学基础就在这里。LSA 是 Word2Vec 和 BERT 的思想先驱，SVD 是第一个真正"理解"语言的数学工具。',
  },
]

function Stories() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? stories : stories.slice(0, 4)

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
        Real-World Impact — 为什么值得深入学习 SVD
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {visible.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', borderRadius: 8, padding: '12px 14px',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 3, fontWeight: 600,
                background: `color-mix(in srgb, ${s.tagColor} 15%, transparent)`,
                color: s.tagColor,
              }}>
                {s.tag}
              </span>
              <strong style={{ fontSize: 13 }}>{s.title}</strong>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {s.body}
            </p>
          </div>
        ))}
      </div>
      {stories.length > 4 && (
        <button
          className="btn btn-secondary"
          style={{ marginTop: 10, fontSize: 12, padding: '5px 14px' }}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '收起' : `展开全部 ${stories.length} 个故事`}
        </button>
      )}
    </div>
  )
}

export default function FormulaPage() {
  return (
    <div className="page" style={{ fontSize: 13 }}>
      {/* 顶部：公式 + 几何可视化 并排 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* 左：核心公式 + 分解说明 */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Core Formula
          </div>
          <div style={{ fontSize: 28, marginBottom: 12 }}>
            <Tex math="A_{m \times n} = U_{m \times m} \, \Sigma_{m \times n} \, V^T_{n \times n}" block />
          </div>

          {/* U Σ V 三列说明 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { t: 'U', sub: '左奇异向量', desc: '列: AAᵀ 特征向量', color: '#3b82f6' },
              { t: '\\Sigma', sub: '奇异值', desc: '对角线: √(λᵢ)', color: 'var(--accent)' },
              { t: 'V^T', sub: '右奇异向量', desc: '行: AᵀA 特征向量', color: '#ef4444' },
            ].map((item, i) => (
              <div key={i} style={{ borderLeft: `2px solid ${item.color}`, paddingLeft: 8 }}>
                <div style={{ fontSize: 14 }}><K>{item.t}</K></div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.sub}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
              </div>
            ))}
          </div>

          {/* 紧凑外积展开 */}
          <div style={{ background: 'var(--bg-surface)', padding: 10, borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>外积展开形式</div>
            <Tex math="A = \sigma_1 u_1 v_1^T + \sigma_2 u_2 v_2^T + \cdots + \sigma_r u_r v_r^T" block />
          </div>

          {/* 计算步骤 */}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>计算步骤</div>
            <div>1. 计算 <K>{'A^T A'}</K> → 特征值 <K>{'\\lambda_i'}</K> → 奇异值 <K>{'\\sigma_i = \\sqrt{\\lambda_i}'}</K></div>
            <div>2. <K>{'A^T A'}</K> 的特征向量 → <K>V</K> 的列</div>
            <div>3. <K>{'u_i = \\frac{1}{\\sigma_i} A v_i'}</K> → <K>U</K> 的列</div>
          </div>
        </div>

        {/* 右：几何可视化 */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Geometric Intuition — 分步变换
          </div>
          <GeometryViz />
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
            SVD 将线性变换分解为：<K>{'V^T'}</K> 旋转输入空间 → <K>{'\\Sigma'}</K> 沿坐标轴缩放 → <K>U</K> 旋转输出空间。
            修改左侧矩阵观察变换效果。<span style={{ color: '#ef4444' }}>红色</span>=e₁方向,{' '}
            <span style={{ color: '#3b82f6' }}>蓝色</span>=e₂方向。
          </div>
        </div>
      </div>

      {/* 第二行：性质 + 例题 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* 性质 */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Key Properties
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {properties.map((p, i) => (
              <div key={i} style={{ background: 'var(--bg-surface)', padding: '8px 10px', borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 3 }}>{p.title}</div>
                <div style={{ fontSize: 12 }}><Tex math={p.formula} /></div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{p.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 例题 */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Worked Examples
          </div>
          {examples.map((ex, i) => <ExampleCard key={i} ex={ex} />)}
        </div>
      </div>

      {/* 第三行：关联概念 + 计算器 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Related Concepts — SVD 的延伸应用
          </div>
          {relatedConcepts.map((c, i) => (
            <div key={i} style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <strong style={{ fontSize: 13, color: 'var(--accent)' }}>{c.name}</strong>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{c.relation}</span>
              </div>
              <div style={{ fontSize: 12, marginTop: 2 }}><Tex math={c.formula} /></div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Interactive Calculator
          </div>
          <MatrixCalculator />
        </div>
      </div>

      {/* 商业与学术故事 */}
      <Stories />

      {/* 底部：学习资源 */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Learning Resources
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 10px', borderRadius: 6,
                background: 'var(--bg-surface)', textDecoration: 'none',
                color: 'var(--text-primary)', fontSize: 12,
                border: '1px solid var(--border-subtle)',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
            >
              <span style={{
                fontSize: 9, padding: '1px 5px', borderRadius: 3,
                background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 600,
              }}>
                {r.tag}
              </span>
              <span style={{ flex: 1 }}>{r.label}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>&#8599;</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
