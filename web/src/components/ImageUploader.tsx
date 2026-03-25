import { useRef } from 'react'

interface Props {
  onUpload: (file: File) => void
}

export default function ImageUploader({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }

  return (
    <button className="upload-btn" onClick={() => inputRef.current?.click()}>
      上传图片
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        onChange={handleChange}
      />
    </button>
  )
}
