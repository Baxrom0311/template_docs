import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addStudent } from '../lib/api'

const COLORS = ['#6366f1','#8b5cf6','#22c55e','#f59e0b','#ef4444','#06b6d4','#f97316','#ec4899']

function Confetti() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1000, overflow: 'hidden' }}>
      {Array.from({ length: 88 }).map((_, i) => {
        const sz = 6 + Math.random() * 7
        return (
          <div
            key={i}
            className="piece"
            style={{
              left: `${Math.random() * 100}%`,
              background: COLORS[i % COLORS.length],
              width: sz,
              height: sz * 1.5,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${Math.random() * 0.7}s`,
              animationDuration: `${1.6 + Math.random() * 1.2}s`,
            }}
          />
        )
      })}
    </div>
  )
}

function SuccessOverlay({ onAgain }: { onAgain: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Confetti />
      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="glass"
        style={{ padding: '44px 36px', textAlign: 'center', maxWidth: 360, width: '90vw' }}
      >
        {/* Animated check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          style={{
            width: 76, height: 76, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)',
            border: '2px solid rgba(34,197,94,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px',
          }}
        >
          <motion.svg
            width="36" height="36" viewBox="0 0 24 24"
            fill="none" stroke="#22c55e" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <motion.polyline
              points="20 6 9 17 4 12"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            />
          </motion.svg>
        </motion.div>

        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 10, color: '#f1f5f9' }}>
          Rahmat!
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 28 }}>
          Varaqangiz muvaffaqiyatli yuborildi va hujjat tayyor bo'ldi.
        </p>
        <button className="btn btn-ghost" style={{ width: '100%', height: 44 }} onClick={onAgain}>
          Yana birini yuborish
        </button>
      </motion.div>
    </motion.div>
  )
}

interface FieldProps {
  label: string
  children: React.ReactNode
}
function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="field-label">
        {label} <span className="req">*</span>
      </label>
      {children}
    </div>
  )
}

export default function FormPage() {
  const [form, setForm] = useState({
    familiya: '', ism: '', otasining_ismi: '',
    fakultet: '', yonalish: '', kurs: '', stipendiya: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    setPhotoUrl(URL.createObjectURL(f))
    setErrors(er => ({ ...er, photo: false }))
  }

  const validate = () => {
    const errs: Record<string, boolean> = {}
    Object.entries(form).forEach(([k, v]) => { if (!v.trim()) errs[k] = true })
    if (!photo) errs.photo = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('photo', photo!)
      await addStudent(fd)
      setSuccess(true)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Noma\'lum xato'
      alert('Xatolik: ' + message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setForm({ familiya:'',ism:'',otasining_ismi:'',fakultet:'',yonalish:'',kurs:'',stipendiya:'' })
    setPhoto(null); setPhotoUrl(''); setErrors({}); setSuccess(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const addRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget
    const r = btn.getBoundingClientRect()
    const size = Math.max(r.width, r.height) * 2.5
    const rpl = document.createElement('span')
    rpl.className = 'ripple'
    rpl.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX-r.left-size/2}px;top:${e.clientY-r.top-size/2}px`
    btn.appendChild(rpl)
    setTimeout(() => rpl.remove(), 600)
  }, [])

  const inputCls = (k: string) => `gi${errors[k] ? ' gi-error' : ''}`

  const sectionBadge = (n: number, color = '#6366f1') => (
    <span style={{
      width: 22, height: 22, borderRadius: 7, background: color,
      color: '#fff', fontSize: 11, fontWeight: 800,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>{n}</span>
  )

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>📋</span>
          Stipendiya Ariza
        </div>
      </header>

      <main style={{ maxWidth: 620, margin: '36px auto 80px', padding: '0 16px' }}>
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: 'center', marginBottom: 28 }}
        >
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,.15)', color: '#a5b4fc',
            border: '1px solid rgba(99,102,241,.25)',
            borderRadius: 100, padding: '5px 14px',
            fontSize: 12, fontWeight: 700, letterSpacing: '.3px', marginBottom: 14,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: 'spin 2s linear infinite' }} />
            Urganch Davlat Universiteti
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,30px)', fontWeight: 800, letterSpacing: '-.5px', lineHeight: 1.2, color: '#f1f5f9', marginBottom: 0 }}>
            Imtihon Varaqasi<br />To'ldirish
          </h1>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={submit}
          noValidate
        >
          <div className="glass" style={{ overflow: 'hidden' }}>

            {/* Section 1 */}
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 9 }}>
              {sectionBadge(1)}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>Shaxsiy ma'lumotlar</span>
            </div>
            <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
              <Field label="Familiya"><input className={inputCls('familiya')} placeholder="Karimov" value={form.familiya} onChange={set('familiya')} /></Field>
              <Field label="Ism"><input className={inputCls('ism')} placeholder="Jasur" value={form.ism} onChange={set('ism')} /></Field>
              <Field label="Otasining ismi"><input className={inputCls('otasining_ismi')} placeholder="Aliyevich" value={form.otasining_ismi} onChange={set('otasining_ismi')} /></Field>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,.07)' }} />

            {/* Section 2 */}
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 9 }}>
              {sectionBadge(2, '#8b5cf6')}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>O'quv ma'lumotlari</span>
            </div>
            <div style={{ padding: '20px 22px', display: 'grid', gap: 14 }}>
              <Field label="Fakultet">
                <input className={inputCls('fakultet')} placeholder="Masalan: Tabiiy fanlar fakulteti" value={form.fakultet} onChange={set('fakultet')} />
              </Field>
              <Field label="Yo'nalishi">
                <input className={inputCls('yonalish')} placeholder="Masalan: Matematika va informatika" value={form.yonalish} onChange={set('yonalish')} />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Kurs">
                  <select className={inputCls('kurs')} value={form.kurs} onChange={set('kurs')} style={{ cursor: 'pointer' }}>
                    <option value="">— Tanlang —</option>
                    {['1-kurs','2-kurs','3-kurs','4-kurs'].map(k => <option key={k}>{k}</option>)}
                    <option value="Magistratura 1-kurs">Magistr 1-kurs</option>
                    <option value="Magistratura 2-kurs">Magistr 2-kurs</option>
                  </select>
                </Field>
                <Field label="Stipendiya nomi">
                  <input className={inputCls('stipendiya')} placeholder="Ulug'bek nomidagi" value={form.stipendiya} onChange={set('stipendiya')} />
                </Field>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,.07)' }} />

            {/* Section 3 - Photo */}
            <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', gap: 9 }}>
              {sectionBadge(3, '#22c55e')}
              <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>
                Rasm (3×4) <span className="req">*</span>
              </span>
            </div>
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* drop zone */}
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    width: 88, height: 116, flexShrink: 0,
                    border: `2px dashed ${errors.photo ? 'rgba(239,68,68,.6)' : photo ? 'rgba(34,197,94,.5)' : 'rgba(255,255,255,.15)'}`,
                    borderRadius: 10,
                    background: photo ? 'rgba(34,197,94,.05)' : errors.photo ? 'rgba(239,68,68,.05)' : 'rgba(255,255,255,.04)',
                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: '.15s',
                    boxShadow: errors.photo ? '0 0 0 3px rgba(239,68,68,.15)' : undefined,
                  }}
                >
                  {photoUrl
                    ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (
                      <div style={{ textAlign: 'center', padding: 8 }}>
                        <div style={{ fontSize: 24, opacity: .3 }}>🖼</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.25)', marginTop: 4 }}>Rasm<br />yuklash</div>
                      </div>
                    )
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" style={{ display: 'none' }} onChange={onPhoto} />

                <div style={{ flex: 1, paddingTop: 2 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5, color: '#e2e8f0' }}>3×4 formatdagi rasm</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)', lineHeight: 1.6 }}>
                    JPG yoki PNG formatda yuklang.<br />
                    Rasm Word hujjatga avtomatik<br />
                    3×4 sm o'lchamda kiritiladi.
                  </div>
                  {errors.photo && (
                    <div style={{ fontSize: 11, color: '#f87171', marginTop: 6, fontWeight: 600 }}>
                      Rasm majburiy
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,.07)' }} />

            {/* Submit */}
            <div style={{ padding: '20px 22px' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', height: 50, fontSize: 15 }}
                disabled={loading}
                onPointerDown={addRipple}
              >
                {loading ? <span className="spinner" /> : 'Yuborish'}
              </button>
            </div>

          </div>
        </motion.form>
      </main>

      <AnimatePresence>
        {success && <SuccessOverlay onAgain={reset} />}
      </AnimatePresence>
    </>
  )
}
