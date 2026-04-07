import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Status = 'available' | 'planned' | 'external'

interface Topic {
  id: string
  title: string
  subtitle: string
  status: Status
  difficulty: 1 | 2 | 3 | 4 | 5
  prereqs: string[]
  concepts: string[]
  whyItMatters: string
  resources: { label: string; url: string }[]
  internalLink?: string // 站内交互页面路径
}

interface Category {
  id: string
  title: string
  description: string
  color: string
  topics: Topic[]
}

const curriculum: Category[] = [
  {
    id: 'math',
    title: '1. 数学基础',
    description: '深度学习的语言。没有这些，论文读不懂，模型调不动。',
    color: '#3b82f6',
    topics: [
      {
        id: 'linear-algebra',
        title: '线性代数',
        subtitle: '向量、矩阵、特征值、SVD',
        status: 'available',
        difficulty: 2,
        prereqs: [],
        concepts: ['向量空间与基变换', '矩阵乘法的几何意义', '特征值分解 vs SVD', '正交性与投影', '秩、零空间、列空间'],
        whyItMatters: '神经网络的每一层都是矩阵乘法+非线性。理解线性代数就是理解网络在做什么。Transformer 的 attention 是矩阵运算，CNN 的卷积是 Toeplitz 矩阵，BatchNorm 是协方差矩阵的白化。',
        resources: [
          { label: '3Blue1Brown: Essence of Linear Algebra', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab' },
          { label: 'MIT 18.06 Gilbert Strang', url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/' },
          { label: 'Interactive Linear Algebra (GT)', url: 'https://textbooks.math.gatech.edu/ila/' },
        ],
        internalLink: '/formula',
      },
      {
        id: 'calculus',
        title: '微积分与自动微分',
        subtitle: '梯度、链式法则、Jacobian',
        status: 'available',
        internalLink: '/calculus',
        difficulty: 2,
        prereqs: [],
        concepts: ['偏导数与梯度向量', '链式法则 → 反向传播', 'Jacobian 与 Hessian 矩阵', '自动微分 (AD) 原理', 'Taylor 展开与优化'],
        whyItMatters: '反向传播就是链式法则的自动化。理解计算图和梯度流动是调试训练问题（梯度消失/爆炸）的唯一方式。二阶方法（Hessian）是理解 Adam 和 LBFGS 的关键。',
        resources: [
          { label: '3Blue1Brown: Essence of Calculus', url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr' },
          { label: 'CS231n: Backpropagation 讲义', url: 'https://cs231n.github.io/optimization-2/' },
        ],
      },
      {
        id: 'probability',
        title: '概率论与信息论',
        subtitle: '分布、贝叶斯、熵、KL 散度',
        status: 'available',
        internalLink: '/probability',
        difficulty: 3,
        prereqs: ['calculus'],
        concepts: ['常见分布（高斯、伯努利、Categorical）', '贝叶斯定理与后验推断', '最大似然估计 (MLE) 与 MAP', '信息熵、交叉熵、KL 散度', 'VAE 的 ELBO 推导'],
        whyItMatters: '交叉熵损失函数、Softmax、Dropout、VAE、扩散模型——全是概率论。KL 散度是训练 LLM 做 RLHF 时的核心约束。不懂概率论就无法理解为什么模型会"幻觉"。',
        resources: [
          { label: 'Stanford CS229 概率论复习', url: 'https://cs229.stanford.edu/section/cs229-prob.pdf' },
          { label: 'Visual Information Theory (colah)', url: 'https://colah.github.io/posts/2015-09-Visual-Information/' },
        ],
      },
      {
        id: 'optimization',
        title: '优化理论',
        subtitle: 'SGD、Adam、学习率调度、收敛性',
        status: 'available',
        internalLink: '/optimization',
        difficulty: 3,
        prereqs: ['calculus', 'linear-algebra'],
        concepts: ['凸优化 vs 非凸优化', 'SGD 与 mini-batch 的方差分析', 'Momentum、RMSProp、Adam 族', '学习率调度（Cosine、Warmup）', '损失地貌与鞍点'],
        whyItMatters: '同一个模型，优化器选错性能差 10 倍。Adam 的 β1、β2 不是玄学，是指数移动平均的衰减率。学习率 warmup 是 Transformer 训练稳定的关键。理解优化才能调参不靠运气。',
        resources: [
          { label: 'Sebastian Ruder: 优化算法概览', url: 'https://www.ruder.io/optimizing-gradient-descent/' },
          { label: 'Stanford CS231n: Optimization', url: 'https://cs231n.github.io/optimization-1/' },
        ],
      },
    ],
  },
  {
    id: 'foundations',
    title: '2. 深度学习基础',
    description: '从感知机到反向传播，理解神经网络的构建块。',
    color: 'var(--accent)',
    topics: [
      {
        id: 'nn-basics',
        title: '神经网络基础',
        subtitle: '感知机、MLP、激活函数、损失函数',
        status: 'available',
        difficulty: 2,
        prereqs: ['linear-algebra', 'calculus'],
        concepts: ['万能逼近定理', '激活函数选择（ReLU、GELU、SiLU）', '损失函数设计（CE、MSE、Focal）', '权重初始化（Xavier、Kaiming）', '过拟合与正则化'],
        whyItMatters: 'MLP 是所有架构的基础。Transformer 的 FFN 就是两层 MLP。理解万能逼近定理才知道网络的能力边界。激活函数的选择直接影响梯度流动和训练速度。',
        resources: [
          { label: 'Stanford CS231n', url: 'https://cs231n.stanford.edu/' },
          { label: 'Neural Networks and Deep Learning (Nielsen)', url: 'http://neuralnetworksanddeeplearning.com/' },
        ],
        internalLink: '/neural-net',
      },
      {
        id: 'backprop',
        title: '反向传播与计算图',
        subtitle: 'AD、计算图、梯度累积',
        status: 'available',
        internalLink: '/backprop',
        difficulty: 3,
        prereqs: ['nn-basics', 'calculus'],
        concepts: ['前向传播 vs 反向传播', '计算图与拓扑排序', '梯度检查 (numerical gradient)', '梯度累积与混合精度', 'PyTorch autograd 原理'],
        whyItMatters: 'Andrej Karpathy 说：如果你不能手写反向传播，你就不真正理解神经网络。debug 训练问题（loss 不下降、梯度爆炸）需要你能追踪梯度流。',
        resources: [
          { label: 'Karpathy: micrograd', url: 'https://github.com/karpathy/micrograd' },
          { label: 'Karpathy: 手搓 backprop 视频', url: 'https://www.youtube.com/watch?v=VMj-3S1tku0' },
        ],
      },
      {
        id: 'regularization',
        title: '正则化与泛化',
        subtitle: 'Dropout、BatchNorm、数据增强',
        status: 'available',
        internalLink: '/regularization',
        difficulty: 2,
        prereqs: ['nn-basics'],
        concepts: ['偏差-方差权衡', 'L1/L2 正则化的几何解释', 'Dropout 的贝叶斯解释', 'BatchNorm / LayerNorm / RMSNorm', '数据增强策略'],
        whyItMatters: '训练集 loss 低但测试集差？这就是泛化问题。LayerNorm 是 Transformer 稳定训练的关键。RMSNorm 是 LLaMA 选择的归一化方式，比 LayerNorm 更高效。',
        resources: [
          { label: 'CS231n: Regularization', url: 'https://cs231n.github.io/neural-networks-2/' },
        ],
      },
    ],
  },
  {
    id: 'architectures',
    title: '3. 核心架构',
    description: '从 CNN 到 Transformer，理解改变世界的网络结构。',
    color: '#ef4444',
    topics: [
      {
        id: 'cnn',
        title: '卷积神经网络 (CNN)',
        subtitle: '卷积、池化、ResNet、特征可视化',
        status: 'available',
        internalLink: '/cnn',
        difficulty: 3,
        prereqs: ['nn-basics'],
        concepts: ['卷积的数学定义与实现', '感受野计算', 'ResNet 残差连接的梯度分析', '特征图可视化', '1x1 卷积与通道注意力'],
        whyItMatters: 'CNN 统治了计算机视觉十年。ResNet 的残差连接思想被 Transformer 继承。理解 CNN 是理解 Vision Transformer 的前提。卷积本质上是权重共享的矩阵乘法。',
        resources: [
          { label: 'Stanford CS231n: ConvNets', url: 'https://cs231n.github.io/convolutional-networks/' },
          { label: 'CNN Explainer (交互可视化)', url: 'https://poloclub.github.io/cnn-explainer/' },
        ],
      },
      {
        id: 'rnn',
        title: '循环神经网络 (RNN/LSTM)',
        subtitle: '序列建模、门控机制、梯度问题',
        status: 'available',
        internalLink: '/rnn',
        difficulty: 3,
        prereqs: ['nn-basics', 'backprop'],
        concepts: ['RNN 展开与 BPTT', 'LSTM 门控机制', 'GRU 简化版本', '梯度消失/爆炸的数学分析', '双向 RNN 与 Seq2Seq'],
        whyItMatters: '理解 RNN 的失败才能理解 Transformer 为什么成功。LSTM 的门控思想影响了后来的 Gated Attention。Seq2Seq + Attention 是 Transformer 的直接前身。',
        resources: [
          { label: 'colah: Understanding LSTM', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/' },
          { label: 'Karpathy: char-rnn', url: 'https://karpathy.github.io/2015/05/21/rnn-effectiveness/' },
        ],
      },
      {
        id: 'transformer',
        title: 'Transformer',
        subtitle: 'Self-Attention、位置编码、KV Cache',
        status: 'available',
        internalLink: '/transformer',
        difficulty: 4,
        prereqs: ['linear-algebra', 'nn-basics', 'rnn'],
        concepts: ['Scaled Dot-Product Attention', 'Multi-Head Attention 的作用', '位置编码（sinusoidal、RoPE、ALiBi）', 'KV Cache 与推理优化', 'Flash Attention 原理'],
        whyItMatters: 'GPT、BERT、LLaMA、Stable Diffusion 的核心都是 Transformer。理解 attention 的计算复杂度 O(n^2) 才能理解为什么长上下文是难题。Flash Attention 通过硬件感知算法将速度提升 2-4 倍。',
        resources: [
          { label: 'Attention Is All You Need (原论文)', url: 'https://arxiv.org/abs/1706.03762' },
          { label: 'The Illustrated Transformer (Jay Alammar)', url: 'https://jalammar.github.io/illustrated-transformer/' },
          { label: 'Karpathy: GPT from scratch', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY' },
        ],
      },
    ],
  },
  {
    id: 'modern',
    title: '4. 现代深度学习',
    description: '大模型时代的核心技术栈。',
    color: '#f59e0b',
    topics: [
      {
        id: 'llm',
        title: '大语言模型 (LLM)',
        subtitle: 'GPT、LLaMA、Scaling Laws、涌现能力',
        status: 'available',
        internalLink: '/llm',
        difficulty: 4,
        prereqs: ['transformer', 'probability'],
        concepts: ['自回归语言建模', 'Scaling Laws (Chinchilla)', 'Tokenization (BPE/SentencePiece)', '涌现能力与 In-Context Learning', 'MoE (Mixture of Experts)'],
        whyItMatters: 'LLM 是当前 AI 的核心。Scaling Laws 告诉我们模型大小、数据量、算力的最优配比。理解 tokenization 才能理解为什么 GPT 不会数数。MoE 是 GPT-4 和 DeepSeek 的架构基础。',
        resources: [
          { label: 'Karpathy: Let\'s build GPT', url: 'https://www.youtube.com/watch?v=kCc8FmEb1nY' },
          { label: 'Chinchilla Scaling Laws 论文', url: 'https://arxiv.org/abs/2203.15556' },
          { label: 'LLaMA 论文', url: 'https://arxiv.org/abs/2302.13971' },
        ],
      },
      {
        id: 'diffusion',
        title: '扩散模型',
        subtitle: 'DDPM、Stable Diffusion、Flow Matching',
        status: 'available',
        internalLink: '/diffusion',
        difficulty: 5,
        prereqs: ['probability', 'nn-basics'],
        concepts: ['前向扩散 (加噪) 与逆扩散 (去噪)', 'DDPM 的数学推导', 'Latent Diffusion (Stable Diffusion)', 'Classifier-Free Guidance', 'Flow Matching 与 Rectified Flow'],
        whyItMatters: '图像/视频/音频生成的统治架构。Stable Diffusion 3 和 DALL-E 3 都基于此。扩散模型本质上是学习数据分布的得分函数（score function），与 SVD 的低维结构有深层联系。',
        resources: [
          { label: 'Lil\'Log: What are Diffusion Models', url: 'https://lilianweng.github.io/posts/2021-07-11-diffusion-models/' },
          { label: 'DDPM 原论文', url: 'https://arxiv.org/abs/2006.11239' },
        ],
      },
      {
        id: 'rlhf',
        title: 'RLHF 与对齐',
        subtitle: 'PPO、DPO、Constitutional AI',
        status: 'available',
        internalLink: '/rlhf',
        difficulty: 5,
        prereqs: ['llm', 'optimization'],
        concepts: ['奖励模型训练', 'PPO 算法在 LLM 中的应用', 'DPO: 去掉奖励模型的简化', 'Constitutional AI (Anthropic)', 'RLHF 的局限与替代方案'],
        whyItMatters: 'ChatGPT 之所以好用，不是因为 GPT-3.5 的预训练，而是因为 RLHF 对齐。DPO 是 LLaMA-2-Chat 和 Claude 的训练方法。理解对齐是理解 AI 安全的入口。',
        resources: [
          { label: 'InstructGPT 论文', url: 'https://arxiv.org/abs/2203.02155' },
          { label: 'DPO 论文', url: 'https://arxiv.org/abs/2305.18290' },
        ],
      },
      {
        id: 'efficiency',
        title: '高效训练与推理',
        subtitle: 'LoRA、量化、蒸馏、并行',
        status: 'available',
        difficulty: 4,
        prereqs: ['linear-algebra', 'llm'],
        concepts: ['LoRA 低秩适配', '量化 (INT8/INT4/GPTQ/AWQ)', '知识蒸馏', '数据并行 vs 张量并行 vs 流水线并行', 'DeepSpeed ZeRO'],
        whyItMatters: 'LoRA 的核心就是 SVD 思想——权重更新是低秩的。量化把 FP16 压到 INT4，模型大小缩 4 倍。这些技术让个人开发者也能跑 70B 模型。',
        resources: [
          { label: 'LoRA 原论文', url: 'https://arxiv.org/abs/2106.09685' },
          { label: 'QLoRA 论文', url: 'https://arxiv.org/abs/2305.14314' },
        ],
        internalLink: '/neural-net',
      },
    ],
  },
  {
    id: 'practice',
    title: '5. 工程实践',
    description: '从 Jupyter 到生产部署，工程能力决定你能走多远。',
    color: '#8b5cf6',
    topics: [
      {
        id: 'pytorch',
        title: 'PyTorch 精通',
        subtitle: 'Tensor、autograd、DataLoader、分布式',
        status: 'available',
        difficulty: 2,
        prereqs: ['nn-basics'],
        concepts: ['Tensor 操作与广播', 'autograd 计算图', '自定义 Module 与 hook', 'DataLoader 与数据管线', 'torch.compile 与性能优化'],
        whyItMatters: 'PyTorch 是深度学习的通用语言。面试时手写模型、debug 训练问题、复现论文——都需要 PyTorch 熟练度。torch.compile 是 PyTorch 2.0 的核心，理解它需要理解计算图。',
        resources: [
          { label: 'PyTorch 官方教程', url: 'https://pytorch.org/tutorials/' },
          { label: 'Karpathy: nn-zero-to-hero', url: 'https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ' },
        ],
        internalLink: '/sandbox',
      },
      {
        id: 'experiment',
        title: '实验管理与调参',
        subtitle: 'wandb、学习率策略、消融实验',
        status: 'available',
        internalLink: '/experiment',
        difficulty: 3,
        prereqs: ['pytorch', 'optimization'],
        concepts: ['实验追踪 (Weights & Biases)', '超参搜索策略', '消融实验设计', '训练日志分析', '复现性保证'],
        whyItMatters: '论文结果无法复现是学术界的巨大问题。好的实验管理习惯从一开始就培养。调参不是瞎试——理解每个超参的物理意义，用消融实验验证假设。',
        resources: [
          { label: 'Weights & Biases 教程', url: 'https://docs.wandb.ai/' },
        ],
      },
      {
        id: 'deployment',
        title: '模型部署',
        subtitle: 'ONNX、TensorRT、vLLM、Triton',
        status: 'available',
        internalLink: '/deployment',
        difficulty: 4,
        prereqs: ['pytorch', 'efficiency'],
        concepts: ['ONNX 模型导出与优化', 'TensorRT 加速推理', 'vLLM PagedAttention', 'Batching 策略', 'Serving 框架选择'],
        whyItMatters: '训练出好模型只是一半，另一半是让它在生产环境快速、稳定地服务用户。vLLM 的 PagedAttention 把 LLM 推理吞吐量提升了 2-4 倍，这是工程而非研究的胜利。',
        resources: [
          { label: 'vLLM 项目', url: 'https://github.com/vllm-project/vllm' },
        ],
      },
    ],
  },
  {
    id: 'frontiers',
    title: '6. 前沿方向',
    description: '正在改变世界的研究前沿，选一个深入。',
    color: '#ec4899',
    topics: [
      {
        id: 'multimodal',
        title: '多模态模型',
        subtitle: 'CLIP、GPT-4V、Gemini',
        status: 'available',
        internalLink: '/multimodal',
        difficulty: 5,
        prereqs: ['transformer', 'cnn'],
        concepts: ['对比学习 (CLIP)', '视觉编码器选择', '多模态融合策略', '视觉 Token 化', 'Interleaved 多模态'],
        whyItMatters: 'GPT-4V 和 Gemini 证明了多模态是通往 AGI 的关键路径。CLIP 的对比学习思想影响了整个 AI 领域。理解多模态就是理解如何让 AI "看见"世界。',
        resources: [
          { label: 'CLIP 论文', url: 'https://arxiv.org/abs/2103.00020' },
          { label: 'LLaVA 论文', url: 'https://arxiv.org/abs/2304.08485' },
        ],
      },
      {
        id: 'agents',
        title: 'AI Agent',
        subtitle: '工具使用、规划、代码生成',
        status: 'available',
        internalLink: '/agent',
        difficulty: 4,
        prereqs: ['llm'],
        concepts: ['ReAct 推理框架', '工具使用与函数调用', 'Tree-of-Thought 搜索', '代码生成与执行', '多智能体协作'],
        whyItMatters: 'Agent 是 LLM 从"对话工具"进化为"能做事的助手"的关键。Claude Code、Cursor、Devin 都是 Agent 应用。理解 Agent 架构就是理解 AI 的下一个商业化浪潮。',
        resources: [
          { label: 'ReAct 论文', url: 'https://arxiv.org/abs/2210.03629' },
          { label: 'Anthropic: Claude Agent SDK', url: 'https://docs.anthropic.com/en/docs/agents-and-tools' },
        ],
      },
      {
        id: 'reasoning',
        title: '推理与思维链',
        subtitle: 'CoT、o1、MCTS、过程奖励',
        status: 'available',
        internalLink: '/reasoning',
        difficulty: 5,
        prereqs: ['llm', 'rlhf'],
        concepts: ['Chain-of-Thought Prompting', 'Self-Consistency 解码', '过程奖励模型 (PRM)', 'Test-Time Compute Scaling', 'MCTS + LLM'],
        whyItMatters: 'OpenAI o1/o3 证明了测试时计算可以大幅提升推理能力。这是 2024-2025 最热的研究方向。理解推理 scaling 是理解 AI 下一个突破点的关键。',
        resources: [
          { label: 'Chain-of-Thought 论文', url: 'https://arxiv.org/abs/2201.11903' },
          { label: 'Let\'s Verify Step by Step', url: 'https://arxiv.org/abs/2305.20050' },
        ],
      },
    ],
  },
]

const difficultyLabels = ['', '入门', '基础', '进阶', '高级', '前沿']

function TopicDetail({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: 16, padding: 28,
        maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
        border: '1px solid var(--border)',
      }} onClick={e => e.stopPropagation()}>
        <TopicHeader topic={topic} onClose={onClose} />
        <TopicMeta topic={topic} />
        <TopicPrereqs prereqs={topic.prereqs} />
        <TopicWhyMatters text={topic.whyItMatters} />
        <TopicConcepts concepts={topic.concepts} />
        <TopicResources resources={topic.resources} />
        {topic.internalLink && (
          <button
            onClick={() => { onClose(); navigate(topic.internalLink!) }}
            className="btn btn-primary"
            style={{ marginTop: 16, fontSize: 13 }}
          >
            进入交互 Demo →
          </button>
        )}
      </div>
    </div>
  )
}

function TopicHeader({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div className="flex-between" style={{ marginBottom: 16 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 700 }}>{topic.title}</h3>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{topic.subtitle}</div>
      </div>
      <button className="btn btn-secondary" onClick={onClose} style={{ padding: '4px 12px' }}>
        &#x2715;
      </button>
    </div>
  )
}

function TopicMeta({ topic }: { topic: Topic }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
      <span className="metric" style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4,
        background: topic.status === 'available' ? 'var(--accent-muted)' : 'var(--bg-card)',
        color: topic.status === 'available' ? 'var(--accent)' : 'var(--text-muted)',
        fontWeight: 600,
      }}>
        {topic.status === 'available' ? '有交互 Demo' : topic.status === 'planned' ? '规划中' : '外部资源'}
      </span>
      <span className="metric" style={{
        fontSize: 11, padding: '2px 8px', borderRadius: 4,
        background: 'var(--bg-card)', color: 'var(--text-muted)',
      }}>
        难度 {'#'.repeat(topic.difficulty)}{'_'.repeat(5 - topic.difficulty)} {difficultyLabels[topic.difficulty]}
      </span>
    </div>
  )
}

function TopicPrereqs({ prereqs }: { prereqs: string[] }) {
  if (prereqs.length === 0) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>前置知识</div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {prereqs.map(p => (
          <span key={p} style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 4,
            background: 'var(--bg-surface)', color: 'var(--text-secondary)',
          }}>{p}</span>
        ))}
      </div>
    </div>
  )
}

function TopicWhyMatters({ text }: { text: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>为什么重要</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{text}</p>
    </div>
  )
}

function TopicConcepts({ concepts }: { concepts: string[] }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>核心概念</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {concepts.map((c, i) => (
          <div key={i} style={{
            fontSize: 12, padding: '4px 8px', borderRadius: 4,
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            borderLeft: '2px solid var(--accent)',
          }}>{c}</div>
        ))}
      </div>
    </div>
  )
}

function TopicResources({ resources }: { resources: { label: string; url: string }[] }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 6 }}>学习资源</div>
      {resources.map((r, i) => (
        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', fontSize: 12, color: 'var(--accent)',
            padding: '4px 0', textDecoration: 'none',
          }}>
          {r.label} &#8599;
        </a>
      ))}
    </div>
  )
}

export default function RoadmapPage() {
  const navigate = useNavigate()
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null)
  const [filter, setFilter] = useState<'all' | 'available' | 'planned'>('all')

  const stats = {
    total: curriculum.flatMap(c => c.topics).length,
    available: curriculum.flatMap(c => c.topics).filter(t => t.status === 'available').length,
  }

  return (
    <div className="page" style={{ fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Deep Learning Mastery Roadmap
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            {stats.total} 个主题 | {stats.available} 个有交互 Demo | 点击卡片直接进入课程
          </p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'available', 'planned'] as const).map(f => (
            <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 11 }}
              onClick={() => setFilter(f)}>
              {f === 'all' ? '全部' : f === 'available' ? '可交互' : '规划中'}
            </button>
          ))}
        </div>
      </div>

      {curriculum.map(cat => {
        const topics = cat.topics.filter(t => filter === 'all' || t.status === filter)
        if (topics.length === 0) return null
        return (
          <div key={cat.id} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 4, height: 20, borderRadius: 2, background: cat.color }} />
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{cat.title}</h3>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.description}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {topics.map(topic => (
                <button key={topic.id} onClick={() => topic.internalLink ? navigate(topic.internalLink) : setActiveTopic(topic)} style={{
                  background: 'var(--bg-card)', borderRadius: 10, padding: '14px 16px',
                  border: '1px solid var(--border-subtle)', cursor: 'pointer',
                  textAlign: 'left', color: 'var(--text-primary)', fontFamily: 'inherit',
                  transition: 'border-color 0.2s, transform 0.15s',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
                >
                  <div className="flex-between" style={{ width: '100%' }}>
                    <strong style={{ fontSize: 14 }}>{topic.title}</strong>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {topic.internalLink && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: 'var(--accent-muted)', color: 'var(--accent)', fontWeight: 600,
                        }}>Demo</span>
                      )}
                      <span className="metric" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                        {'#'.repeat(topic.difficulty)}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{topic.subtitle}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {topic.whyItMatters.slice(0, 80)}...
                  </div>
                  {topic.prereqs.length > 0 && (
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {topic.prereqs.map(p => (
                        <span key={p} style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: 'var(--bg-surface)', color: 'var(--text-muted)',
                        }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )
      })}

      {activeTopic && <TopicDetail topic={activeTopic} onClose={() => setActiveTopic(null)} />}
    </div>
  )
}
