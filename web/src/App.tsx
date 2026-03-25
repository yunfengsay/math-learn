import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import FormulaPage from './pages/FormulaPage'
import CodeSandbox from './pages/CodeSandbox'
import ImageCompression from './pages/ImageCompression'
import NeuralNetwork from './pages/NeuralNetwork'
import Eigenfaces from './pages/Eigenfaces'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/formula" element={<FormulaPage />} />
          <Route path="/sandbox" element={<CodeSandbox />} />
          <Route path="/compression" element={<ImageCompression />} />
          <Route path="/neural-net" element={<NeuralNetwork />} />
          <Route path="/eigenfaces" element={<Eigenfaces />} />
          <Route path="*" element={<Navigate to="/formula" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
