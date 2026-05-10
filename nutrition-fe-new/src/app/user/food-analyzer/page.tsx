'use client'

import { useRef, useState } from 'react'
import {
  Camera, Upload, Sparkles, X, Flame, Beef, Wheat, Droplet,
  Lightbulb, AlertCircle, RefreshCw, Trophy,
} from 'lucide-react'
import {
  SectionHeader, Card, UserButton, UserNotice, UserEmptyState,
} from '@/components/user/user-ui'

type Prediction = {
  label_raw: string
  label_vi: string | null
  confidence: number
  source?: 'food101' | 'clip' | 'knn' | null
  nutrition_per_100g: { calories: number; protein: number; carbs: number; fat: number } | null
  estimated_total: { calories: number; protein: number; carbs: number; fat: number; estimated_serving_g: number } | null
  category: string | null
  tip: string | null
  has_data: boolean
}

type SimilarImage = {
  path: string | null
  label: string
  label_vi: string | null
  similarity: number
  url: string | null
}

type Result = {
  top: Prediction
  alternatives: Prediction[]
  model: string
  method: 'food101' | 'clip' | 'hybrid' | 'knn'
  used_fallback: boolean
  similar_images?: SimilarImage[]
}

export default function FoodAnalyzerPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file ảnh (JPEG, PNG, WEBP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Ảnh tối đa 10MB.')
      return
    }
    setError('')
    setResult(null)
    setImagePreview(URL.createObjectURL(file))
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/ai/classify-food', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail ?? `Lỗi ${res.status}`)
      }
      const data: Result = await res.json()
      setResult(data)
    } catch (e: any) {
      setError(e.message ?? 'Lỗi phân tích ảnh. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setImagePreview(null)
    setResult(null)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <>
      <SectionHeader
        title='Phân tích món ăn AI 🍱'
        subtitle='Chụp/upload ảnh món ăn → AI nhận diện và ước lượng dinh dưỡng tự động.'
        action={
          imagePreview && !loading ? (
            <UserButton variant='secondary' onClick={reset}>
              <RefreshCw size={14} /> Thử ảnh khác
            </UserButton>
          ) : undefined
        }
      />

      {error && <UserNotice tone='error'>{error}</UserNotice>}

      {/* Info banner */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={20} color='white' />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              Hoạt động bằng AI · Vision Transformer (ViT) Food-101
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
              Nhận diện 101 món ăn phổ biến + 30 món Việt. Dinh dưỡng tham khảo từ USDA & Viện Dinh dưỡng VN.
            </p>
          </div>
        </div>
      </Card>

      {/* Upload zone */}
      {!imagePreview && (
        <UploadZone onFile={handleFile} fileInputRef={fileInputRef} />
      )}

      {/* Preview + result */}
      {imagePreview && (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(280px, 1fr) minmax(280px, 1.6fr)' }}>
          {/* Image preview */}
          <Card>
            <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', aspectRatio: '1/1', background: '#f1f5f9' }}>
              <img src={imagePreview} alt='Món ăn' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(15,23,42,.75)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 12, color: 'white',
                }}>
                  <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>AI đang phân tích...</p>
                  <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>~3-5 giây</p>
                </div>
              )}
            </div>
          </Card>

          {/* Result */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!loading && result && <ResultCard prediction={result.top} isTop />}
            {!loading && result && result.alternatives.length > 0 && (
              <Card>
                <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={13} style={{ color: '#6366f1' }} />
                  Có thể là ({result.alternatives.length} món khác)
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {result.alternatives.map((alt) => (
                    <AlternativeRow key={alt.label_raw} prediction={alt} />
                  ))}
                </div>
              </Card>
            )}
            {!loading && !result && !error && (
              <UserEmptyState
                icon={AlertCircle}
                title='Đang chờ phân tích'
                description='Hãy giữ nguyên ảnh hoặc thử ảnh khác nếu kết quả không chính xác.'
              />
            )}
          </div>
        </div>
      )}

      {/* Similar images từ k-NN */}
      {result && !loading && result.similar_images && result.similar_images.length > 0 && (
        <Card>
          <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} style={{ color: '#10b981' }} />
            Ảnh tương tự từ database ({result.similar_images.length} món)
          </p>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
            AI tìm ra các ảnh giống nhất trong gallery 25,000 ảnh thực — bạn có thể dùng để verify kết quả.
          </p>
          <div style={{
            display: 'grid', gap: 10,
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          }}>
            {result.similar_images.map((sim, idx) => (
              <div key={idx} style={{
                borderRadius: 12, overflow: 'hidden', border: '1px solid #f1f5f9',
                background: 'white', position: 'relative',
              }}>
                {sim.url && (
                  <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: '#f1f5f9' }}>
                    <img
                      src={`/ai${sim.url}`}
                      alt={sim.label_vi ?? sim.label}
                      loading='lazy'
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: 8 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sim.label_vi ?? sim.label}
                  </p>
                  <div style={{
                    marginTop: 4, height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${Math.round(sim.similarity * 100)}%`,
                      background: 'linear-gradient(90deg, #10b981, #34d399)',
                    }} />
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>
                    {(sim.similarity * 100).toFixed(1)}% tương đồng
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {result && !loading && (
        <Card>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: '#64748b' }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0 }}>
                <strong>Lưu ý:</strong> Kết quả từ AI chỉ mang tính ước lượng.
                Calo thực tế có thể chênh lệch do khẩu phần và cách chế biến.
              </p>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                  background: result.method === 'food101' ? '#dbeafe'
                    : result.method === 'clip' ? '#fce7f3'
                    : result.method === 'knn' ? '#dcfce7'
                    : '#fef3c7',
                  color: result.method === 'food101' ? '#1e40af'
                    : result.method === 'clip' ? '#9d174d'
                    : result.method === 'knn' ? '#166534'
                    : '#92400e',
                }}>
                  {result.method === 'food101' && '🤖 Food-101 ViT'}
                  {result.method === 'clip' && '🌏 CLIP zero-shot'}
                  {result.method === 'knn' && '🎯 k-NN từ 25k ảnh thực'}
                  {result.method === 'hybrid' && '🔀 Hybrid (food101 + CLIP)'}
                </span>
                {result.used_fallback && (
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    AI tự động kích hoạt fallback do confidence thấp
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontFamily: 'monospace', fontSize: 11, color: '#94a3b8' }}>
                {result.model}
              </p>
            </div>
          </div>
        </Card>
      )}

      <style jsx>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </>
  )
}

function UploadZone({
  onFile,
  fileInputRef,
}: {
  onFile: (f: File) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
}) {
  const [dragOver, setDragOver] = useState(false)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  return (
    <Card>
      <div
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false)
          if (e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0])
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          padding: 48, textAlign: 'center',
          border: `2px dashed ${dragOver ? '#6366f1' : '#cbd5e1'}`,
          background: dragOver ? '#eef2ff' : '#fafafa',
          borderRadius: 16, transition: 'all 0.2s',
        }}
      >
        <div style={{
          width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 12px 24px rgba(99,102,241,.3)',
        }}>
          <Camera size={32} color='white' />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
          Tải ảnh món ăn
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: 13.5, color: '#64748b' }}>
          Kéo thả ảnh vào đây hoặc bấm chọn từ thiết bị · JPG/PNG/WEBP, tối đa 10MB
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          <UserButton onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Chọn ảnh
          </UserButton>
          <UserButton variant='secondary' onClick={() => cameraInputRef.current?.click()}>
            <Camera size={14} /> Chụp ảnh
          </UserButton>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />
        <input
          ref={cameraInputRef}
          type='file'
          accept='image/*'
          capture='environment'
          style={{ display: 'none' }}
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />

        {/* Demo suggestions */}
        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px dashed #e2e8f0' }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
            💡 GỢI Ý — món AI nhận diện chính xác nhất:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['🍕 Pizza', '🍣 Sushi', '🍔 Burger', '🍝 Pasta', '🥗 Salad', '🍩 Donut', '🥞 Pancake', '🍜 Phở', '🍦 Kem'].map((s) => (
              <span key={s} style={{ padding: '4px 10px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, fontSize: 12, color: '#475569' }}>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function ResultCard({ prediction, isTop }: { prediction: Prediction; isTop?: boolean }) {
  const conf = Math.round(prediction.confidence * 100)
  return (
    <Card>
      {isTop && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999, marginBottom: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
        }}>
          <Trophy size={12} /> KẾT QUẢ HÀNG ĐẦU
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3 }}>
            {prediction.label_vi ?? prediction.label_raw}
          </h2>
          {prediction.category && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
              {prediction.category}
            </p>
          )}
        </div>
        <ConfidenceBadge confidence={conf} />
      </div>

      {prediction.has_data && prediction.estimated_total ? (
        <>
          {/* Big calorie display */}
          <div style={{
            padding: 16, borderRadius: 14,
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            border: '1px solid #fcd34d', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 14px rgba(245,158,11,.4)',
            }}>
              <Flame size={22} color='white' />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#92400e', lineHeight: 1 }}>
                ~{prediction.estimated_total.calories} <span style={{ fontSize: 14, fontWeight: 600 }}>kcal</span>
              </p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#a16207' }}>
                Cho 1 phần ~{prediction.estimated_total.estimated_serving_g}g
              </p>
            </div>
          </div>

          {/* Macros grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
            <MacroBox icon={<Beef size={14} />} label='Đạm' value={prediction.estimated_total.protein} unit='g' tone='#ef4444' />
            <MacroBox icon={<Wheat size={14} />} label='Tinh bột' value={prediction.estimated_total.carbs} unit='g' tone='#f59e0b' />
            <MacroBox icon={<Droplet size={14} />} label='Béo' value={prediction.estimated_total.fat} unit='g' tone='#3b82f6' />
          </div>

          {/* Per 100g detail */}
          {prediction.nutrition_per_100g && (
            <div style={{ padding: 10, background: '#fafafa', borderRadius: 10, marginBottom: 12 }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Trên 100g
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}>
                <span>🔥 <strong>{prediction.nutrition_per_100g.calories}</strong> kcal</span>
                <span>P: <strong>{prediction.nutrition_per_100g.protein}g</strong></span>
                <span>C: <strong>{prediction.nutrition_per_100g.carbs}g</strong></span>
                <span>F: <strong>{prediction.nutrition_per_100g.fat}g</strong></span>
              </div>
            </div>
          )}

          {/* Tip */}
          {prediction.tip && (
            <div style={{
              padding: 12, borderRadius: 12,
              background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
              border: '1px solid #d1fae5',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Lightbulb size={15} style={{ color: '#059669', flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#065f46', lineHeight: 1.5 }}>
                <strong>Gợi ý sức khoẻ:</strong> {prediction.tip}
              </p>
            </div>
          )}
        </>
      ) : (
        <UserNotice tone='warning'>
          AI nhận ra món <strong>"{prediction.label_raw}"</strong>, nhưng chưa có dữ liệu dinh dưỡng cho món này. Hãy thử ảnh khác.
        </UserNotice>
      )}
    </Card>
  )
}

function AlternativeRow({ prediction }: { prediction: Prediction }) {
  const conf = Math.round(prediction.confidence * 100)
  const sourceTag = prediction.source === 'clip' ? '🌏' : prediction.source === 'knn' ? '🎯' : prediction.source === 'food101' ? '🤖' : null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      padding: '8px 12px', background: '#fafafa', borderRadius: 10, border: '1px solid #f1f5f9',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        {sourceTag && <span style={{ fontSize: 11 }} title={prediction.source === 'clip' ? 'CLIP zero-shot' : 'Food-101'}>{sourceTag}</span>}
        <span style={{ fontSize: 13.5, fontWeight: 600, color: '#475569' }}>
          {prediction.label_vi ?? prediction.label_raw}
        </span>
        {prediction.has_data && prediction.estimated_total && (
          <span style={{ fontSize: 11.5, color: '#94a3b8' }}>
            · ~{prediction.estimated_total.calories} kcal
          </span>
        )}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>
        {conf}%
      </span>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tone = confidence >= 80
    ? { bg: '#d1fae5', color: '#065f46', label: 'Rất chắc' }
    : confidence >= 50
    ? { bg: '#fef3c7', color: '#92400e', label: 'Khá chắc' }
    : { bg: '#fee2e2', color: '#991b1b', label: 'Không chắc' }
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 22, fontWeight: 800, color: tone.color }}>{confidence}%</span>
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
        background: tone.bg, color: tone.color, textTransform: 'uppercase', letterSpacing: 0.3,
      }}>
        {tone.label}
      </span>
    </div>
  )
}

function MacroBox({ icon, label, value, unit, tone }: {
  icon: React.ReactNode; label: string; value: number; unit: string; tone: string
}) {
  return (
    <div style={{
      padding: 10, borderRadius: 10, background: 'white',
      border: '1px solid #f1f5f9', textAlign: 'center',
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 28, height: 28, borderRadius: 8, background: `${tone}15`, color: tone,
        marginBottom: 4,
      }}>
        {icon}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</p>
      <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
        {value}<span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>{unit}</span>
      </p>
    </div>
  )
}
