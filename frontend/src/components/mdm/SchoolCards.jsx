import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllSchools } from '../../api/schools'

/* Receives the same `C` tokens object the parent page already defines.
   `accent` is optional — when passed (Enrollment page) cards get a coloured
   hover + header; when omitted (Remote Management) the look is unchanged. */
export default function SchoolCards({ C, onSelect, title, subtitle, accent, hideHeader }) {
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
      {!hideHeader && (
        <>
          <h1 className="text-[20px] font-semibold mb-1" style={{ color: C.textPrimary }}>{title}</h1>
          <p className="text-[13px] mb-6" style={{ color: C.textSecondary }}>{subtitle}</p>
        </>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-10" style={{ color: C.textSecondary }}>
          <i className="ti ti-loader-2 animate-spin" aria-hidden="true"></i> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {schools.map((s) => (
            <button key={s.id}
              onClick={() => onSelect(s.id, s.name)}
              className="flex items-center gap-4 rounded-2xl p-5 text-left cursor-pointer transition-all duration-200"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
              onMouseEnter={accent ? (e => { e.currentTarget.style.borderColor = accent + '80'; e.currentTarget.style.boxShadow = `0 16px 30px -18px ${accent}99`; e.currentTarget.style.transform = 'translateY(-2px)' }) : undefined}
              onMouseLeave={accent ? (e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }) : undefined}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[16px] font-semibold text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${C.brandFrom}, ${C.brandTo})` }}>
                {s.name?.[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{s.name}</div>
                <div className={`text-[11.5px] mt-0.5 ${accent ? 'capitalize' : ''}`} style={{ color: C.textMuted }}>{s.institution_type || 'Institution'}</div>
              </div>
              {accent && <i className="ti ti-chevron-right text-[16px] shrink-0" style={{ color: accent }} aria-hidden="true"></i>}
            </button>
          ))}

          {/* Reuses the existing NewSchool.jsx form — not rebuilt here. */}
          <button onClick={() => navigate('/schools/new')}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl p-5 cursor-pointer"
            style={{ background: accent ? accent + '0D' : C.surfaceAlt, border: `1px dashed ${accent ? accent + '66' : C.border}` }}>
            <i className="ti ti-plus text-[20px]" style={{ color: accent || C.textMuted }} aria-hidden="true"></i>
            <span className="text-[12.5px] font-semibold" style={{ color: accent || C.textSecondary }}>Add School / College</span>
          </button>
        </div>
      )}
    </div>
  )
}