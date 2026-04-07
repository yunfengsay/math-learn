import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RoadmapPage from './pages/RoadmapPage'
import FormulaPage from './pages/FormulaPage'
import CodeSandbox from './pages/CodeSandbox'
import ImageCompression from './pages/ImageCompression'
import NeuralNetwork from './pages/NeuralNetwork'
import Eigenfaces from './pages/Eigenfaces'
import CalculusPage from './pages/CalculusPage'
import ProbabilityPage from './pages/ProbabilityPage'
import OptimizationPage from './pages/OptimizationPage'
import BackpropPage from './pages/BackpropPage'
import RegularizationPage from './pages/RegularizationPage'
import CNNPage from './pages/CNNPage'
import RNNPage from './pages/RNNPage'
import TransformerPage from './pages/TransformerPage'
import LLMPage from './pages/LLMPage'
import DiffusionPage from './pages/DiffusionPage'
import RLHFPage from './pages/RLHFPage'
import ExperimentPage from './pages/ExperimentPage'
import DeploymentPage from './pages/DeploymentPage'
import MultimodalPage from './pages/MultimodalPage'
import AgentPage from './pages/AgentPage'
import ReasoningPage from './pages/ReasoningPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/roadmap" element={<RoadmapPage />} />
          <Route path="/formula" element={<FormulaPage />} />
          <Route path="/sandbox" element={<CodeSandbox />} />
          <Route path="/compression" element={<ImageCompression />} />
          <Route path="/neural-net" element={<NeuralNetwork />} />
          <Route path="/eigenfaces" element={<Eigenfaces />} />
          <Route path="/calculus" element={<CalculusPage />} />
          <Route path="/probability" element={<ProbabilityPage />} />
          <Route path="/optimization" element={<OptimizationPage />} />
          <Route path="/backprop" element={<BackpropPage />} />
          <Route path="/regularization" element={<RegularizationPage />} />
          <Route path="/cnn" element={<CNNPage />} />
          <Route path="/rnn" element={<RNNPage />} />
          <Route path="/transformer" element={<TransformerPage />} />
          <Route path="/llm" element={<LLMPage />} />
          <Route path="/diffusion" element={<DiffusionPage />} />
          <Route path="/rlhf" element={<RLHFPage />} />
          <Route path="/experiment" element={<ExperimentPage />} />
          <Route path="/deployment" element={<DeploymentPage />} />
          <Route path="/multimodal" element={<MultimodalPage />} />
          <Route path="/agent" element={<AgentPage />} />
          <Route path="/reasoning" element={<ReasoningPage />} />
          <Route path="*" element={<Navigate to="/roadmap" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
