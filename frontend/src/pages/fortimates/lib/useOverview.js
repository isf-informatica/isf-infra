/* ─────────────────────────────────────────────────────────────────────────────
   FortiMates — useOverview hook (DEMO STUB).

   ⚠️ Like ./api.js, the real hook was git-ignored and never pushed. This demo
   version returns the mock overview data (./data/mockData.js) in the exact
   shape the dashboard widgets read:
     data.users        → { with_passport, without_passport, corporate, total }
     data.recent_mails → [ { id, email, subject, message } ]
     data.registrations→ [ { day, today, yesterday } ]
     data.mail_split   → [ { name, value, color } ]
     data.mail_total   → number
   Replace with the production hook (GET /fortimates/overview) when ready.
   ───────────────────────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react'
import { userSplit, mailsList, registrationSeries, mailSplit, mailLog } from '../data/mockData.js'

const OVERVIEW = {
  users: {
    with_passport: userSplit.withPassport,
    without_passport: userSplit.withoutPassport,
    corporate: userSplit.corporate,
    total: userSplit.totalUsers,
  },
  recent_mails: mailsList,
  registrations: registrationSeries,
  mail_split: mailSplit,
  mail_total: mailLog.length,
}

export default function useOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      if (!alive) return
      try { setData(OVERVIEW); setError(null) } catch (e) { setError(e) } finally { setLoading(false) }
    }, 400)
    return () => { alive = false; clearTimeout(t) }
  }, [])

  return { data, error, loading }
}
