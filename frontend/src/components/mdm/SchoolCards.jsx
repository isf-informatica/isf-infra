import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSchools } from '../../api/schools'

/* Receives the same `C` tokens object the parent page already defines. */
export default function SchoolCards({ C, onSelect, title, subtitle }) {
  const navigate = useNavigate()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllSchools()
      .then(setSchools)
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <h1 className="text-[20px] font-semibold mb-1" style={{ color: C.textPrimary }}>{title}</h1>
      <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>{subtitle}</p>

      {loading ? (
        <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
          <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {schools.map((s) => (
            <button key={s.id}
              onClick={() => onSelect(s.id, s.name)}
              className="flex items-center gap-4 rounded-2xl p-5 text-left"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-semibold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                {s.name?.[0]}
              </div>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{s.name}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{s.institution_type || 'Institution'}</div>
              </div>
            </button>
          ))}

          {/* Reuses the existing NewSchool.jsx form — not rebuilt here. */}
          <button onClick={() => navigate('/schools/new')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5"
            style={{ background: C.surfaceAlt, border: `1px dashed ${C.border}` }}>
            <i className="ti ti-plus text-[20px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
            <span className="text-[12.5px] font-semibold" style={{ color: C.textSecondary }}>Add School / College</span>
          </button>
        </div>
      )}
    </div>
  )
}