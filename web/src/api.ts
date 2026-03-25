const BASE = '/api'

export async function postSvdCompute(matrix: number[][]) {
  const res = await fetch(`${BASE}/svd/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix }),
  })
  return res.json()
}

export async function postImageCompress(imageId: string, k: number) {
  const res = await fetch(`${BASE}/svd/image-compress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_id: imageId, k }),
  })
  return res.json()
}

export async function postEigenfaces(nComponents: number, imageIndex?: number) {
  const res = await fetch(`${BASE}/svd/eigenfaces`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ n_components: nComponents, image_index: imageIndex }),
  })
  return res.json()
}

export async function postNeuralNet(k: number) {
  const res = await fetch(`${BASE}/svd/neural-net`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ k }),
  })
  return res.json()
}

export async function postRunCode(code: string) {
  const res = await fetch(`${BASE}/code/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  return res.json()
}

export async function fetchSamples() {
  const res = await fetch(`${BASE}/samples`)
  return res.json()
}

export async function uploadImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: formData,
  })
  return res.json()
}
