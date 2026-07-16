import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getStudents, deleteStudent, type Student } from '../lib/api'

const AVATAR_GRADS = [
  ['#6366f1','#818cf8'],['#22c55e','#4ade80'],['#f59e0b','#fbbf24'],
  ['#ef4444','#f87171'],['#a855f7','#c084fc'],['#06b6d4','#22d3ee'],
]

function Skeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
      {[0,1,2].map(i => (
        <div key={i} className="glass" style={{ height: 180, opacity: 0.5, animation: 'spin 2s ease-in-out infinite' }} />
      ))}
    </div>
  )
}

function ConfirmModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <motion.div
        initial={{ scale: 0.88, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="glass"
        style={{ padding: 28, maxWidth: 340, width: '90vw', textAlign: 'center' }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: '#f1f5f9' }}>O'chirishni tasdiqlang</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', marginBottom: 22, lineHeight: 1.5 }}>
          Bu talabaning varaqasi o'chib ketadi.<br />Uni qaytarib bo'lmaydi.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: 1, height: 42 }} onClick={onCancel}>Bekor</button>
          <button className="btn btn-danger" style={{ flex: 1, height: 42 }} onClick={onConfirm}>O'chirish</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StudentCard({ student, index, onDelete }: { student: Student; index: number; onDelete: () => void }) {
  const [c1, c2] = AVATAR_GRADS[index % AVATAR_GRADS.length]
  const initials = ((student.familiya[0] || '') + (student.ism[0] || '')).toUpperCase()

  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 280, damping: 22 }}
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      {/* head */}
      <div style={{ padding: '18px 18px 12px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${c1},${c2})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 800, color: '#fff',
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {student.familiya} {student.ism}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{student.otasining_ismi}</div>
        </div>
        <button
          className="btn btn-danger"
          style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, fontSize: 13, padding: 0 }}
          onClick={onDelete}
        >✕</button>
      </div>

      {/* tags */}
      <div style={{ padding: '0 18px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <span className="tag tag-blue">{student.kurs}</span>
        <span className="tag tag-gray">{student.fakultet}</span>
        <span className="tag tag-green">{student.yonalish}</span>
        <span className="tag tag-purple">{student.stipendiya} stipendiyasi</span>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '0 18px' }} />

      {/* download */}
      <div style={{ padding: '12px 18px' }}>
        {student.doc_filename
          ? (
            <a
              href={`/api/download/${student.id}`}
              download
              className="btn btn-primary"
              style={{ width: '100%', height: 40, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Word yuklash
            </a>
          )
          : <div style={{ textAlign: 'center', fontSize: 12, color: '#f87171', padding: '10px 0' }}>Xato yuz berdi</div>
        }
      </div>
    </motion.div>
  )
}

export default function DownloadPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    getStudents().then(s => { setStudents(s); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const confirmDelete = async () => {
    if (!deletingId) return
    const id = deletingId
    setDeletingId(null)
    setStudents(s => s.filter(x => x.id !== id))
    await deleteStudent(id)
  }

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#16a34a,#22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
          }}>⬇</span>
          Varaqalarni Yuklab Olish
        </div>
      </header>

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '28px 16px 80px' }}>

        {loading ? (
          <Skeleton />
        ) : students.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ padding: '80px 24px', textAlign: 'center' }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>📂</div>
            <h3 style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, color: '#f1f5f9' }}>Hali varaqalar yo'q</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.4)' }}>
              Ma'lumot kiritish sahifasida talabalarni qo'shing,<br />so'ng bu yerda yuklab olish imkoni bo'ladi.
            </p>
          </motion.div>
        ) : (
          <>
            {/* toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9' }}>Tayyor varaqalar</span>
                    <span style={{
                      background: 'rgba(99,102,241,.2)', color: '#a5b4fc',
                      border: '1px solid rgba(99,102,241,.3)',
                      borderRadius: 100, padding: '3px 13px', fontSize: 13, fontWeight: 700,
                    }}>{students.length} ta</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', marginTop: 2 }}>
                    Har birini alohida yoki barchasini ZIP formatda yuklang
                  </div>
                </div>
              </div>
              <a
                href="/api/download-all"
                className="btn btn-success"
                style={{ padding: '0 22px', height: 42, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                ⬇ Barchasini ZIP
              </a>
            </motion.div>

            {/* grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
              {students.map((s, i) => (
                <StudentCard key={s.id} student={s} index={i} onDelete={() => setDeletingId(s.id)} />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {deletingId && (
          <ConfirmModal
            onCancel={() => setDeletingId(null)}
            onConfirm={confirmDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}
