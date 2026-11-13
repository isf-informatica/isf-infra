/* ─────────────────────────────────────────────────────────────────────────────
   FortiMates — useOverview hook (LIVE).

   GET /easyreach/fortimates/overview → the dashboard shape:
     data.users        → { with_passport, without_passport, corporate, total }
     data.recent_mails → [ { id, email, subject, message } ]
     data.registrations→ [ { day, today, yesterday } ]
     data.mail_split   → [ { name, value, color } ]
     data.mail_total   → number
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { apiGet } from './api.js'

export default function useOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    apiGet('/overview')
      .then(d => { if (alive) { setData(d); setError(null) } })
      .catch(e => { if (alive) setError(e) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return { data, error, loading }
}
