import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  MdmPage, C, INK, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Toggle, Chips,
  Kpi, Pill, PILL, RolloutBar, RolloutStatus, TargetPicker, Stepper, Segmented,
  useToasts, usePoll, timeAgo, fmt, downloadBlob,
} from '../../components/mdm/MdmKit'
import { getInstitutions } from '../../api/appManagement'
import { deviceCountFor } from '../../api/mdmDemoStore'
import {
  FOLDERS, getContentSummary, getLibrary, uploadContent, deleteContent, publishContent, getPublications,
  recallPublication, exportDelivery, getBranding, uploadBrandAsset, pushBranding,
} from '../../api/contentPublishing'

const ACCENT = '#7C5CFC'
const THEME = {
  accent: ACCENT, accentDeep: '#5B3FD6', accentBg: '#F3F0FF', accentBorder: '#D6CCFE',
  gradient: 'linear-gradient(135deg, #A78BFA, #7C5CFC)',
}

const TABS = [
  { key: 'library', label: 'Content Library', icon: 'ti-folders' },
  { key: 'publications', label: 'Publications', icon: 'ti-send' },
  { key: 'branding', label: 'Boot Logo & Wallpaper', icon: 'ti-device-tablet' },
]

const TYPE_META = {
  pdf: { label: 'PDF', icon: 'ti-file-type-pdf', color: '#E4483C' },
  video: { label: 'Video', icon: 'ti-player-play', color: '#7C5CFC' },
  doc: { label: 'Document', icon: 'ti-file-text', color: '#3B6FE0' },
  ppt: { label: 'Slides', icon: 'ti-presentation', color: '#F79420' },
  image: { label: 'Image', icon: 'ti-photo', color: '#16B8A6' },
}
const sizeLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.round(mb * 1024)} KB`)

export default function ContentPublishingView() {
  const [tab, setTab] = useState('library')
  const [summary, setSummary] = useState(null)
  const [institutions, setInstitutions] = useState([])
  const { toasts, toast } = useToasts()

  const refreshSummary = useCallback(() => getContentSummary().then(setSummary).catch(() => {}), [])
  useEffect(() => { refreshSummary(); getInstitutions().then(setInstitutions) }, [refreshSummary])

  return (
    <MdmPage {...THEME} icon="ti-upload" title="Content Publishing"
      subtitle="Push PDFs, videos & documents to classroom devices — available even offline"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      badges={{ publications: summary?.running ? 'live' : null }}
      status={summary ? `Live · ${summary.openRate}% open rate` : 'connecting…'}>
      {tab === 'library' && <LibraryTab summary={summary} institutions={institutions} toast={toast} onChange={refreshSummary} goTo={setTab} />}
      {tab === 'publications' && <PublicationsTab toast={toast} onChange={refreshSummary} />}
      {tab === 'branding' && <BrandingTab institutions={institutions} toast={toast} onChange={refreshSummary} />}
    </MdmPage>
  )
}

/* ───────── Library ───────── */

function LibraryTab({ summary, institutions, toast, onChange, goTo }) {
  const [items, setItems] = useState(null)
  const [folder, setFolder] = useState('all')
  const [type, setType] = useState('all')
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState([])
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(null)
  const [busy, setBusy] = useState(null)

  const load = useCallback(() => getLibrary().then(setItems), [])
  useEffect(() => { load() }, [load])

  const shown = useMemo(() => (items || []).filter(c =>
    (folder === 'all' || c.folder === folder) && (type === 'all' || c.type === type) &&
    (!q.trim() || c.title.toLowerCase().includes(q.trim().toLowerCase()))), [items, folder, type, q])
  const counts = useMemo(() => {
    const c = { all: items?.length || 0 }
    FOLDERS.forEach(f => { c[f] = items?.filter(i => i.folder === f).length || 0 })
    return c
  }, [items])

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const del = async (c) => {
    if (!window.confirm(`Delete "${c.title}" from the library?`)) return
    setBusy(c.id); await deleteContent(c.id); await load(); onChange(); setBusy(null)
    setSelected(s => s.filter(x => x !== c.id)); toast('Content deleted')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Library items" value={summary ? summary.items : '—'} sub={summary ? `${sizeLabel(summary.storageMb)} stored` : ' '} icon="ti-folders" color={ACCENT} />
        <Kpi label="Publications" value={summary ? summary.publications : '—'} sub="Sent to institutions" icon="ti-send" color="#3B6FE0" />
        <Kpi label="Devices reached" value={summary ? fmt(summary.delivered) : '—'} sub="Content delivered" icon="ti-devices" color={C.success} />
        <Kpi label="Open rate" value={summary ? `${summary.openRate}%` : '—'} sub="Opened by students" icon="ti-eye" color="#F79420" />
      </div>

      <Card>
        <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search content"
                className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-56" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
            </div>
            <Select value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All types</option>
              {Object.entries(TYPE_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
            </Select>
          </div>
          <div className="flex gap-2">
            {selected.length > 0 && <Btn variant="accent" icon="ti-send" onClick={() => setPublishing(selected)}>Publish {selected.length} selected</Btn>}
            <Btn variant="primary" icon="ti-upload" onClick={() => setUploading(true)}>Upload content</Btn>
          </div>
        </div>
        <div className="px-5 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <Chips options={[['all', 'All folders'], ...FOLDERS.map(f => [f, f])]} value={folder} onChange={setFolder} counts={counts} />
        </div>

        {!items ? <Loader label="Loading content library…" /> : shown.length === 0 ? <Empty icon="ti-folder-off">No content here yet.</Empty> : (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {shown.map(c => {
              const m = TYPE_META[c.type]
              const on = selected.includes(c.id)
              return (
                <div key={c.id} onClick={() => toggle(c.id)} className="rounded-2xl overflow-hidden cursor-pointer transition-all"
                  style={{ border: `1.5px solid ${on ? ACCENT : C.border}`, boxShadow: on ? `0 12px 26px -18px ${ACCENT}` : 'none', background: C.surface }}>
                  <div className="h-24 relative flex items-center justify-center" style={{ background: m.color + '12' }}>
                    <i className={`ti ${m.icon} text-[34px]`} style={{ color: m.color }} aria-hidden="true"></i>
                    <span className="absolute top-2.5 left-2.5 w-5 h-5 rounded-md flex items-center justify-center" style={{ background: on ? ACCENT : 'rgba(255,255,255,0.9)', border: `1.5px solid ${on ? ACCENT : C.borderStrong}` }}>
                      {on && <i className="ti ti-check text-[12px] text-white" aria-hidden="true"></i>}
                    </span>
                    <span className="absolute top-2.5 right-2.5 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.9)', color: m.color }}>{m.label}</span>
                    {c.published > 0 && <span className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: 'rgba(255,255,255,0.9)', color: C.success }}><i className="ti ti-broadcast text-[11px]" aria-hidden="true"></i>Published ×{c.published}</span>}
                  </div>
                  <div className="p-3.5">
                    <div className="text-[13px] font-semibold leading-snug" style={{ color: C.textPrimary, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>{c.title}</div>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="text-[11px] min-w-0 truncate" style={{ color: C.textMuted }}>{c.folder} · {c.meta} · {sizeLabel(c.sizeMb)}</div>
                      <div onClick={e => e.stopPropagation()}><IconBtn icon="ti-trash" title="Delete" danger loading={busy === c.id} onClick={() => del(c)} /></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {uploading && (
        <UploadModal onClose={() => setUploading(false)}
          onUploaded={async (item) => { setUploading(false); await load(); onChange(); setSelected([item.id]); toast(`Uploaded — ${item.title}. Select & publish when ready.`) }} />
      )}
      {publishing && items && (
        <PublishWizard items={items.filter(c => publishing.includes(c.id))} institutions={institutions} onClose={() => setPublishing(null)}
          onPublished={async (pub) => {
            setPublishing(null); setSelected([]); await load(); onChange()
            toast(pub.status === 'scheduled' ? `Scheduled for tonight — ${fmt(pub.total)} devices` : `Publishing to ${fmt(pub.total)} devices`)
            goTo('publications')
          }} />
      )}
    </div>
  )
}

function DropZone({ onFile, accept, hint }) {
  const ref = useRef(null)
  const [drag, setDrag] = useState(false)
  return (
    <div onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); e.dataTransfer.files?.[0] && onFile(e.dataTransfer.files[0]) }}
      className="rounded-2xl py-9 px-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
      style={{ border: `2px dashed ${drag ? ACCENT : C.borderStrong}`, background: drag ? THEME.accentBg : C.surfaceAlt }}>
      <span className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}` }}>
        <i className="ti ti-cloud-upload text-[22px]" style={{ color: THEME.accentDeep }} aria-hidden="true"></i>
      </span>
      <div className="text-[13.5px] font-semibold" style={{ color: C.textPrimary }}>Drop file here or click to browse</div>
      <div className="text-[11.5px] mt-1" style={{ color: C.textMuted }}>{hint}</div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </div>
  )
}

function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [folder, setFolder] = useState(FOLDERS[2])
  const [progress, setProgress] = useState(0)
  const [busy, setBusy] = useState(false)

  const pick = (f) => { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ')) }
  const submit = async () => {
    setBusy(true)
    const item = await uploadContent(file, { title: title.trim(), folder }, setProgress)
    onUploaded(item)
  }

  return (
    <Modal title="Upload content" onClose={onClose} width={560}>
      {!file ? <DropZone onFile={pick} accept=".pdf,.mp4,.mkv,.mov,.webm,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg" hint="PDF · MP4 video · Word · PowerPoint · Images — up to 2 GB" /> : (
        <>
          <div className="rounded-xl p-3.5 mb-4 flex items-center gap-3" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
            <i className="ti ti-file text-[20px]" style={{ color: C.textSecondary }} aria-hidden="true"></i>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold mono truncate" style={{ color: C.textPrimary }}>{file.name}</div>
              <div className="text-[11px]" style={{ color: C.textMuted }}>{sizeLabel(file.size / (1024 * 1024))}{busy ? (progress < 100 ? ` · Uploading ${progress}%` : ' · Processing & generating preview…') : ''}</div>
              {busy && <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: C.surface }}><div className="mk-stripe" style={{ height: '100%', width: `${progress}%`, background: ACCENT, transition: 'width 150ms linear' }} /></div>}
            </div>
            {!busy && <button onClick={() => setFile(null)} className="text-[11.5px] font-semibold cursor-pointer" style={{ color: C.textMuted, background: 'transparent', border: 'none' }}>Replace</button>}
          </div>
          <Field label="Title"><Input value={title} onChange={e => setTitle(e.target.value)} /></Field>
          <Field label="Folder">
            <Select value={folder} onChange={e => setFolder(e.target.value)} className="w-full">
              {FOLDERS.map(f => <option key={f}>{f}</option>)}
            </Select>
          </Field>
        </>
      )}
      <div className="flex justify-end gap-2 pt-3">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-upload" loading={busy} disabled={!file || !title.trim()} onClick={submit}>Upload</Btn>
      </div>
    </Modal>
  )
}

function PublishWizard({ items, institutions, onClose, onPublished }) {
  const [step, setStep] = useState(1)
  const [targets, setTargets] = useState([])
  const [opts, setOpts] = useState({ offline: true, mandatory: false, notify: true, expires: false, expiresAt: '', schedule: 'now' })
  const [busy, setBusy] = useState(false)
  const allSelected = targets.length === institutions.length
  const count = targets.reduce((s, id) => s + deviceCountFor(institutions.find(i => i.id === id) || {}), 0)
  const totalMb = items.reduce((s, c) => s + c.sizeMb, 0)

  const submit = async () => {
    setBusy(true)
    const names = institutions.filter(i => targets.includes(i.id)).map(i => i.name)
    const pub = await publishContent({
      contentIds: items.map(c => c.id), deviceCount: count,
      targetLabel: allSelected ? 'All institutions' : names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0],
      offline: opts.offline, mandatory: opts.mandatory, expiresAt: opts.expires ? opts.expiresAt : null, schedule: opts.schedule,
    })
    onPublished(pub)
  }

  return (
    <Modal title="Publish content" onClose={onClose} width={620}>
      <Stepper steps={['Review content', 'Target devices', 'Delivery options']} step={step} />
      {step === 1 && (
        <>
          <div className="flex flex-col gap-2">
            {items.map(c => {
              const m = TYPE_META[c.type]
              return (
                <div key={c.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl" style={{ border: `1px solid ${C.border}` }}>
                  <i className={`ti ${m.icon} text-[18px]`} style={{ color: m.color }} aria-hidden="true"></i>
                  <div className="min-w-0 flex-1">
                    <div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{c.title}</div>
                    <div className="text-[11px]" style={{ color: C.textMuted }}>{c.folder} · {c.meta}</div>
                  </div>
                  <span className="text-[11.5px] shrink-0" style={{ color: C.textSecondary }}>{sizeLabel(c.sizeMb)}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 text-[12px]" style={{ color: C.textSecondary }}>Total download per device: <b style={{ color: C.textPrimary }}>{sizeLabel(totalMb)}</b></div>
          <div className="flex justify-end gap-2 pt-5">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn variant="primary" icon="ti-arrow-right" onClick={() => setStep(2)}>Continue</Btn>
          </div>
        </>
      )}
      {step === 2 && (
        <>
          <TargetPicker institutions={institutions} value={targets} onChange={setTargets} countFor={deviceCountFor} />
          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(1)}>Back</Btn>
            <Btn variant="primary" icon="ti-arrow-right" disabled={!targets.length} onClick={() => setStep(3)}>Continue</Btn>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <div className="rounded-xl px-4 py-1 mb-4" style={{ border: `1px solid ${C.border}` }}>
            <Toggle icon="ti-download" label="Download for offline use" desc="Files are stored on the device — works without internet" on={opts.offline} onChange={v => setOpts(o => ({ ...o, offline: v }))} />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle icon="ti-pin" label="Mandatory — pin to home screen" desc="Students cannot delete this content" on={opts.mandatory} onChange={v => setOpts(o => ({ ...o, mandatory: v }))} />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle icon="ti-bell" label="Show notification on device" on={opts.notify} onChange={v => setOpts(o => ({ ...o, notify: v }))} />
            <div style={{ borderTop: `1px solid ${C.border}` }} />
            <Toggle icon="ti-calendar-x" label="Auto-remove after a date" on={opts.expires} onChange={v => setOpts(o => ({ ...o, expires: v }))} />
            {opts.expires && <div className="pb-3"><Input type="date" value={opts.expiresAt} onChange={e => setOpts(o => ({ ...o, expiresAt: e.target.value }))} /></div>}
          </div>
          <div className="text-[12.5px] font-semibold mb-2" style={{ color: C.textPrimary }}>When to send</div>
          <Segmented options={[['now', 'Send now'], ['later', 'Tonight 22:00 (saves bandwidth)']]} value={opts.schedule} onChange={v => setOpts(o => ({ ...o, schedule: v }))} />
          <div className="mt-4 rounded-xl px-4 py-3 text-[12px] flex items-start gap-2.5" style={{ background: THEME.accentBg, border: `1px solid ${THEME.accentBorder}`, color: C.textPrimary }}>
            <i className="ti ti-info-circle text-[15px] mt-0.5" style={{ color: THEME.accentDeep }} aria-hidden="true"></i>
            <span><b>{items.length} item{items.length > 1 ? 's' : ''}</b> ({sizeLabel(totalMb)}) will be delivered to <b>{fmt(count)} devices</b>. Offline devices receive it when they reconnect.</span>
          </div>
          <div className="flex justify-between gap-2 pt-5">
            <Btn icon="ti-arrow-left" onClick={() => setStep(2)}>Back</Btn>
            <Btn variant="accent" icon="ti-send" loading={busy} disabled={opts.expires && !opts.expiresAt} onClick={submit}>Publish to {fmt(count)} devices</Btn>
          </div>
        </>
      )}
    </Modal>
  )
}

/* ───────── Publications ───────── */

function PublicationsTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [busy, setBusy] = useState(null)
  const [exporting, setExporting] = useState(false)

  const prevRef = useRef(null)
  const load = useCallback(async () => {
    const next = await getPublications()
    next.forEach(n => {
      const p = prevRef.current?.find(x => x.id === n.id)
      if (p && p.status === 'running' && n.status === 'completed') { toast(`Delivered to ${fmt(n.done)}/${fmt(n.total)} devices`); onChange() }
    })
    prevRef.current = next
    setList(next)
  }, [toast, onChange])
  useEffect(() => { load() }, [load])
  usePoll(load, true, 2500)

  const recall = async (p) => {
    if (!window.confirm('Recall this content? It will be removed from all devices.')) return
    setBusy(p.id); await recallPublication(p.id); await load(); onChange(); setBusy(null); toast('Recall command sent — content will be removed from devices')
  }
  const doExport = async () => { setExporting(true); downloadBlob(await exportDelivery(), `content-delivery-${new Date().toISOString().slice(0, 10)}.csv`); setExporting(false); toast('Report downloaded') }

  return (
    <Card>
      <CardHeader title="Publications" sub="Delivery and open status reported by devices"
        right={<Btn variant="primary" icon="ti-file-spreadsheet" loading={exporting} onClick={doExport}>Export to Excel</Btn>} />
      {!list ? <Loader /> : list.length === 0 ? <Empty>Nothing published yet.</Empty> : list.map(p => {
        const openPct = p.done ? Math.round((p.opened / p.done) * 100) : 0
        return (
          <div key={p.id} className="px-5 py-4" style={{ borderBottom: `1px solid ${C.border}`, opacity: p.status === 'recalled' ? 0.6 : 1 }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold flex items-center gap-2 flex-wrap" style={{ color: C.textPrimary }}>
                  {p.titles[0]}{p.titles.length > 1 && <span className="text-[11.5px] font-normal" style={{ color: C.textMuted }}>+{p.titles.length - 1} more</span>}
                  {p.status === 'recalled' ? <Pill small meta={PILL.danger('ti-arrow-back-up')}>Recalled</Pill> : <RolloutStatus r={p} />}
                  {p.mandatory && <Pill small meta={PILL.neutral('ti-pin')}>Mandatory</Pill>}
                  {p.offline && <Pill small meta={PILL.neutral('ti-download')}>Offline</Pill>}
                </div>
                <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>
                  {p.target} · by {p.by}, {timeAgo(p.startedAt)}{p.expiresAt ? ` · auto-removes ${new Date(p.expiresAt).toLocaleDateString('en-IN')}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-[18px] font-extrabold leading-none" style={{ color: C.textPrimary }}>{openPct}%</div>
                  <div className="text-[10.5px] mt-1" style={{ color: C.textMuted }}>opened ({fmt(p.opened)})</div>
                </div>
                {p.status !== 'recalled' && <Btn variant="danger" icon="ti-arrow-back-up" loading={busy === p.id} onClick={() => recall(p)}>Recall</Btn>}
              </div>
            </div>
            {p.status !== 'scheduled' && <RolloutBar r={p} doneLabel="delivered" />}
            {p.status === 'scheduled' && <div className="text-[11.5px]" style={{ color: C.textSecondary }}>Queued for {fmt(p.total)} devices — starts at 22:00 tonight.</div>}
          </div>
        )
      })}
    </Card>
  )
}

/* ───────── Branding (boot logo / animation / wallpaper) ───────── */

const ASSETS = [
  { kind: 'logo', title: 'Boot logo', desc: 'Shown when the device powers on', accept: '.png,.jpg,.jpeg', icon: 'ti-photo' },
  { kind: 'animation', title: 'Boot animation', desc: 'bootanimation.zip or MP4 — copied to device', accept: '.zip,.mp4', icon: 'ti-movie' },
  { kind: 'wallpaper', title: 'Home wallpaper', desc: 'Locked wallpaper for all devices', accept: '.png,.jpg,.jpeg', icon: 'ti-wallpaper' },
]

function BrandingTab({ institutions, toast, onChange }) {
  const [b, setB] = useState(null)
  const [up, setUp] = useState({})
  const [pushing, setPushing] = useState(false)
  const [preview, setPreview] = useState({})
  const refs = useRef({})

  const prevRef = useRef(null)
  const load = useCallback(async () => {
    const next = await getBranding()
    if (prevRef.current?.rollout?.status === 'running' && next.rollout?.status === 'completed') { toast(`Branding applied on ${fmt(next.rollout.done)} devices`); onChange() }
    prevRef.current = next
    setB(next)
  }, [toast, onChange])
  useEffect(() => { load() }, [load])
  usePoll(load, b?.rollout?.status === 'running')

  const upload = async (kind, file) => {
    if (!file) return
    if (/\.(png|jpe?g)$/i.test(file.name)) setPreview(p => ({ ...p, [kind]: URL.createObjectURL(file) }))
    setUp(u => ({ ...u, [kind]: 1 }))
    const next = await uploadBrandAsset(kind, file, (p) => setUp(u => ({ ...u, [kind]: p })))
    setUp(u => ({ ...u, [kind]: null }))
    setB(next)
    toast(`${ASSETS.find(a => a.kind === kind).title} uploaded — push to apply on devices`, 'info')
  }

  if (!b) return <Loader label="Loading device branding…" />
  const pendingPush = ASSETS.some(a => b[a.kind]?.pendingPush)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div className="xl:col-span-2 flex flex-col gap-5">
        <Card>
          <CardHeader title="Device branding assets" sub="Uploaded here, copied to every Android device"
            right={<Btn variant={pendingPush ? 'accent' : 'ghost'} icon="ti-send" onClick={() => setPushing(true)}>{pendingPush ? 'Push changes' : 'Push to devices'}</Btn>} />
          {ASSETS.map(a => {
            const cur = b[a.kind]
            const progress = up[a.kind]
            return (
              <div key={a.kind} className="px-5 py-4 flex items-center gap-4" style={{ borderBottom: `1px solid ${C.border}` }}>
                <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden" style={{ background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                  {preview[a.kind] ? <img src={preview[a.kind]} alt="" className="w-full h-full object-cover" /> : <i className={`ti ${a.icon} text-[20px]`} style={{ color: C.textSecondary }} aria-hidden="true"></i>}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold flex items-center gap-2" style={{ color: C.textPrimary }}>
                    {a.title}{cur?.pendingPush && <Pill small meta={PILL.warning('ti-clock')}>Not pushed yet</Pill>}
                  </div>
                  <div className="text-[11.5px]" style={{ color: C.textMuted }}>{a.desc}</div>
                  {cur && <div className="text-[11.5px] mt-0.5 mono truncate" style={{ color: C.textSecondary }}>{cur.name} · {cur.sizeKb >= 1024 ? `${(cur.sizeKb / 1024).toFixed(1)} MB` : `${cur.sizeKb} KB`} · {timeAgo(cur.updatedAt)}</div>}
                  {progress && <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: C.surfaceAlt }}><div className="mk-stripe" style={{ height: '100%', width: `${progress}%`, background: ACCENT }} /></div>}
                </div>
                <Btn icon="ti-upload" loading={!!progress} onClick={() => refs.current[a.kind]?.click()}>Replace</Btn>
                <input ref={el => { refs.current[a.kind] = el }} type="file" accept={a.accept} className="hidden" onChange={e => upload(a.kind, e.target.files?.[0])} />
              </div>
            )
          })}
        </Card>

        {b.rollout && (
          <Card className="px-5 py-4">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <div>
                <div className="text-[13.5px] font-semibold flex items-center gap-2" style={{ color: C.textPrimary }}>Last branding push <RolloutStatus r={b.rollout} /></div>
                <div className="text-[11.5px] mt-0.5" style={{ color: C.textMuted }}>{b.rollout.target} · by {b.rollout.by}, {timeAgo(b.rollout.startedAt)}</div>
              </div>
            </div>
            <RolloutBar r={b.rollout} doneLabel="applied" />
          </Card>
        )}
      </div>

      {/* Device preview */}
      <Card className="p-5 flex flex-col items-center">
        <div className="text-[11px] font-semibold uppercase tracking-wider self-start mb-4" style={{ color: C.textMuted }}>Device preview</div>
        <div className="flex gap-4">
          {[['Boot screen', 'logo'], ['Home screen', 'wallpaper']].map(([label, kind]) => (
            <div key={kind} className="flex flex-col items-center gap-2">
              <div className="w-[120px] h-[210px] rounded-[18px] p-1.5" style={{ background: INK, boxShadow: '0 18px 30px -18px rgba(0,0,0,0.6)' }}>
                <div className="w-full h-full rounded-[13px] overflow-hidden flex items-center justify-center relative"
                  style={{ background: kind === 'logo' ? '#000' : 'linear-gradient(160deg, #A78BFA, #7C5CFC 55%, #3B6FE0)' }}>
                  {preview[kind] ? <img src={preview[kind]} alt="" className={kind === 'logo' ? 'w-16 h-16 object-contain' : 'w-full h-full object-cover'} />
                    : kind === 'logo' ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: '#fff' }}><span className="text-[13px] font-black" style={{ color: INK }}>ISF</span></div>
                        <div className="w-10 h-1 rounded-full overflow-hidden" style={{ background: '#333' }}><div className="mk-stripe" style={{ width: '60%', height: '100%', background: '#fff' }} /></div>
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                        {[0, 1, 2, 3].map(i => <span key={i} className="w-5 h-5 rounded-md" style={{ background: 'rgba(255,255,255,0.75)' }} />)}
                      </div>
                    )}
                </div>
              </div>
              <span className="text-[11px] font-semibold" style={{ color: C.textSecondary }}>{label}</span>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] mt-4 text-center" style={{ color: C.textMuted }}>Upload a new logo or wallpaper to preview it here before pushing.</p>
      </Card>

      {pushing && (
        <BrandPushModal institutions={institutions} onClose={() => setPushing(false)}
          onPushed={(next) => { setPushing(false); setB(next); onChange(); toast(`Branding push started — ${fmt(next.rollout.total)} devices`) }} />
      )}
    </div>
  )
}

function BrandPushModal({ institutions, onClose, onPushed }) {
  const [targets, setTargets] = useState([])
  const [busy, setBusy] = useState(false)
  const count = targets.reduce((s, id) => s + deviceCountFor(institutions.find(i => i.id === id) || {}), 0)
  const submit = async () => {
    setBusy(true)
    const names = institutions.filter(i => targets.includes(i.id)).map(i => i.name)
    onPushed(await pushBranding({ deviceCount: count, targetLabel: targets.length === institutions.length ? 'All institutions' : names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0] }))
  }
  return (
    <Modal title="Push branding to devices" onClose={onClose} width={560}>
      <TargetPicker institutions={institutions} value={targets} onChange={setTargets} countFor={deviceCountFor} />
      <div className="flex justify-end gap-2 pt-5">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-send" loading={busy} disabled={!targets.length} onClick={submit}>Push to {fmt(count)} devices</Btn>
      </div>
    </Modal>
  )
}
