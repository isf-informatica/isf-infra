import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  MdmPage, C, Card, CardHeader, Btn, IconBtn, Loader, Empty, Modal, Field, Input, Select, Chips,
  Kpi, Pill, useToasts, timeAgo,
} from '../../components/mdm/MdmKit'
import {
  NOTE_COLORS, TASK_PRIORITY, TASK_LISTS, EVENT_KINDS, ymd,
  getToday, getNotes, saveNote, deleteNote,
  getTasks, saveTask, toggleTask, deleteTask, clearCompleted,
  getEvents, saveEvent, deleteEvent,
} from '../../api/organizer'

/* Digital Organizer — personal notes, tasks and calendar in the isf-infra
   MdmKit style (same shell as VAPT / DRM / Signage). */

const ACCENT = '#0EA5E9'
const THEME = {
  accent: ACCENT, accentDeep: '#0369A1', accentBg: '#F0F9FF', accentBorder: '#BAE6FD',
  gradient: 'linear-gradient(135deg, #38BDF8, #0369A1)',
}

const TABS = [
  { key: 'today', label: 'Today', icon: 'ti-sun' },
  { key: 'notes', label: 'Notes', icon: 'ti-notes' },
  { key: 'tasks', label: 'Tasks', icon: 'ti-checklist' },
  { key: 'calendar', label: 'Calendar', icon: 'ti-calendar-month' },
]

const textareaStyle = { border: `1px solid ${C.systemBorder}`, background: C.surface, color: C.textPrimary }
const longDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const todayYmd = () => ymd(new Date())

export default function OrganizerView() {
  const [tab, setTab] = useState('today')
  const [today, setToday] = useState(null)
  const { toasts, toast } = useToasts()
  const refresh = useCallback(() => getToday().then(setToday).catch(() => {}), [])
  useEffect(() => { refresh() }, [refresh])

  return (
    <MdmPage {...THEME} icon="ti-notebook" title="Digital Organizer"
      subtitle="Your notes, to-dos and calendar in one place — plan the day without leaving InfraPoint"
      tabs={TABS} tab={tab} onTab={setTab} toasts={toasts}
      activeKey="organizer" backPath="/home" backLabel="Home"
      badges={{ tasks: (today?.overdue.length || 0) + (today?.dueToday.length || 0) }}
      status={today ? longDate(today.date) : 'loading…'}>
      {tab === 'today' && <TodayTab data={today} goTo={setTab} onChange={refresh} />}
      {tab === 'notes' && <NotesTab toast={toast} onChange={refresh} />}
      {tab === 'tasks' && <TasksTab toast={toast} onChange={refresh} />}
      {tab === 'calendar' && <CalendarTab toast={toast} onChange={refresh} />}
    </MdmPage>
  )
}

/* ───────── Today ───────── */

function TodayTab({ data, goTo, onChange }) {
  if (!data) return <Loader label="Planning your day…" />
  const due = [...data.overdue, ...data.dueToday]
  const done = async (t) => { await toggleTask(t.id); onChange() }
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="Events today" value={data.events.length} sub={data.events[0] ? `Next: ${data.events[0].start || 'all day'} · ${data.events[0].title}` : 'Nothing scheduled'} icon="ti-calendar-event" color={ACCENT} />
        <Kpi label="Due today" value={data.dueToday.length} sub={`${data.openTasks} open tasks`} icon="ti-checklist" color="#059669" />
        <Kpi label="Overdue" value={data.overdue.length} sub="Past their due date" icon="ti-alarm" color={C.red} />
        <Kpi label="Notes" value={data.notes} sub={`${data.pinned.length} pinned`} icon="ti-notes" color="#D97706" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Today's schedule" right={<Btn icon="ti-calendar-month" onClick={() => goTo('calendar')}>Calendar</Btn>} />
          {data.events.length === 0 ? <Empty icon="ti-calendar-off">No events today.</Empty> : data.events.map(e => <EventRow key={e.id} e={e} />)}
          {data.upcoming.length > 0 && (
            <>
              <div className="px-5 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted }}>Coming up</div>
              {data.upcoming.map(e => <EventRow key={e.id} e={e} showDate />)}
            </>
          )}
        </Card>

        <Card>
          <CardHeader title="Tasks needing attention" right={<Btn icon="ti-checklist" onClick={() => goTo('tasks')}>All tasks</Btn>} />
          {due.length === 0 ? <Empty icon="ti-mood-happy">All caught up.</Empty> : due.map(t => <TaskRow key={t.id} t={t} onToggle={() => done(t)} />)}
        </Card>
      </div>

      <Card>
        <CardHeader title="Pinned notes" right={<Btn icon="ti-notes" onClick={() => goTo('notes')}>All notes</Btn>} />
        {data.pinned.length === 0 ? <Empty icon="ti-pin">Pin a note to keep it here.</Empty> : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {data.pinned.map(n => <NoteCard key={n.id} n={n} />)}
          </div>
        )}
      </Card>
    </div>
  )
}

function EventRow({ e, showDate, onClick }) {
  const k = EVENT_KINDS[e.kind] || EVENT_KINDS.reminder
  return (
    <div onClick={onClick} className={`mk-row px-5 py-3 flex items-center gap-3 ${onClick ? 'cursor-pointer' : ''}`} style={{ borderBottom: `1px solid ${C.border}` }}>
      <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: k.color }} />
      <div className="w-16 shrink-0 text-[12px] font-semibold" style={{ color: C.textPrimary }}>
        {showDate ? shortDate(e.date) : (e.start || 'All day')}
        {!showDate && e.end && <div className="text-[10.5px] font-normal" style={{ color: C.textMuted }}>to {e.end}</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-semibold truncate" style={{ color: C.textPrimary }}>{e.title}</div>
        <div className="text-[11px] truncate" style={{ color: C.textMuted }}><i className={`ti ${k.icon} mr-1`} style={{ color: k.color }} aria-hidden="true"></i>{k.label}{e.location && ` · ${e.location}`}{showDate && e.start && ` · ${e.start}`}</div>
      </div>
    </div>
  )
}

function TaskRow({ t, onToggle, onEdit, onDelete, busy }) {
  const p = TASK_PRIORITY[t.priority]
  const overdue = !t.done && t.due && t.due < todayYmd()
  return (
    <div className="mk-row px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
      <button onClick={onToggle} className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 cursor-pointer"
        style={{ border: `1.5px solid ${t.done ? C.success : C.borderStrong}`, background: t.done ? C.success : 'transparent' }} title={t.done ? 'Mark as not done' : 'Mark as done'}>
        {t.done && <i className="ti ti-check text-[12px] text-white" aria-hidden="true"></i>}
      </button>
      <div className={`min-w-0 flex-1 ${onEdit ? 'cursor-pointer' : ''}`} onClick={onEdit}>
        <div className="text-[12.5px] font-semibold truncate" style={{ color: t.done ? C.textMuted : C.textPrimary, textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</div>
        <div className="text-[11px] flex items-center gap-2" style={{ color: C.textMuted }}>
          <span>{t.list}</span>
          {t.due && <span style={{ color: overdue ? C.red : C.textMuted, fontWeight: overdue ? 600 : 400 }}><i className="ti ti-calendar-due mr-0.5" aria-hidden="true"></i>{t.due === todayYmd() ? 'Today' : shortDate(t.due)}{overdue && ' · overdue'}</span>}
        </div>
      </div>
      <Pill small meta={p} />
      {onDelete && <IconBtn icon="ti-trash" danger title="Delete" loading={busy} onClick={onDelete} />}
    </div>
  )
}

/* ───────── Notes ───────── */

function NoteCard({ n, onOpen, onPin }) {
  const c = NOTE_COLORS[n.color] || NOTE_COLORS.yellow
  return (
    <div onClick={onOpen} className={`rounded-2xl p-4 flex flex-col min-h-[140px] ${onOpen ? 'cursor-pointer mk-btn' : ''}`} style={{ background: c.bg, border: `1px solid ${c.border}` }}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="text-[13px] font-bold leading-snug" style={{ color: c.ink }}>{n.title || 'Untitled'}</div>
        {onPin ? (
          <button onClick={(e) => { e.stopPropagation(); onPin() }} className="shrink-0 cursor-pointer" style={{ background: 'transparent', border: 'none', color: c.ink, opacity: n.pinned ? 1 : 0.35 }} title={n.pinned ? 'Unpin' : 'Pin'}>
            <i className={`ti ${n.pinned ? 'ti-pin-filled' : 'ti-pin'} text-[15px]`} aria-hidden="true"></i>
          </button>
        ) : n.pinned && <i className="ti ti-pin-filled text-[14px] shrink-0" style={{ color: c.ink }} aria-hidden="true"></i>}
      </div>
      <div className="text-[12px] whitespace-pre-wrap flex-1 line-clamp-6" style={{ color: c.ink, opacity: 0.85 }}>{n.body}</div>
      <div className="text-[10.5px] mt-2" style={{ color: c.ink, opacity: 0.55 }}>Edited {timeAgo(n.updatedAt)}</div>
    </div>
  )
}

function NotesTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState(null) // null | {} new | note
  const load = useCallback(() => getNotes().then(setList), [])
  useEffect(() => { load() }, [load])

  const shown = (list || []).filter(n => !q.trim() || `${n.title} ${n.body}`.toLowerCase().includes(q.trim().toLowerCase()))
  const pin = async (n) => { await saveNote({ ...n, pinned: !n.pinned }); load(); onChange() }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-[13px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search notes"
            className="mk-input text-[12.5px] pl-8 pr-3 py-2 rounded-xl w-60" style={{ border: `1px solid ${C.systemBorder}`, background: C.surface }} />
        </div>
        <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New note</Btn>
      </div>
      {!list ? <Loader /> : shown.length === 0 ? <Card><Empty icon="ti-notes">{q ? 'No notes match.' : 'No notes yet — create your first one.'}</Empty></Card> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {shown.map(n => <NoteCard key={n.id} n={n} onOpen={() => setEditing(n)} onPin={() => pin(n)} />)}
        </div>
      )}
      {editing && <NoteModal note={editing} onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); onChange(); toast('Note saved') }}
        onDeleted={() => { setEditing(null); load(); onChange(); toast('Note deleted') }} />}
    </div>
  )
}

function NoteModal({ note, onClose, onSaved, onDeleted }) {
  const [f, setF] = useState({ title: '', body: '', color: 'yellow', pinned: false, ...note })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  const c = NOTE_COLORS[f.color]
  return (
    <Modal title={note.id ? 'Edit note' : 'New note'} onClose={onClose} width={560}>
      <div className="rounded-2xl p-4 mb-4" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
        <input value={f.title} onChange={e => set('title', e.target.value)} placeholder="Title" autoFocus
          className="w-full text-[15px] font-bold bg-transparent outline-none mb-2" style={{ color: c.ink, border: 'none' }} />
        <textarea value={f.body} onChange={e => set('body', e.target.value)} placeholder="Write something…" rows={7}
          className="w-full text-[13px] bg-transparent outline-none resize-none" style={{ color: c.ink, border: 'none' }} />
      </div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          {Object.entries(NOTE_COLORS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => set('color', k)} title={k} className="w-7 h-7 rounded-full cursor-pointer"
              style={{ background: v.bg, border: `2px solid ${f.color === k ? v.ink : v.border}` }} />
          ))}
          <button type="button" onClick={() => set('pinned', !f.pinned)} className="ml-2 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: f.pinned ? C.textPrimary : C.surfaceAlt, color: f.pinned ? '#fff' : C.textSecondary, border: 'none' }} title={f.pinned ? 'Unpin' : 'Pin'}>
            <i className={`ti ${f.pinned ? 'ti-pin-filled' : 'ti-pin'} text-[14px]`} aria-hidden="true"></i>
          </button>
        </div>
        <div className="flex gap-2">
          {note.id && <Btn variant="danger" icon="ti-trash" onClick={async () => { await deleteNote(note.id); onDeleted() }}>Delete</Btn>}
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.title.trim() && !f.body.trim()} onClick={async () => { setBusy(true); await saveNote(f); onSaved() }}>Save</Btn>
        </div>
      </div>
    </Modal>
  )
}

/* ───────── Tasks ───────── */

function TasksTab({ toast, onChange }) {
  const [list, setList] = useState(null)
  const [scope, setScope] = useState('open')
  const [listName, setListName] = useState('all')
  const [quickTitle, setQuickTitle] = useState('')
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(null)
  const load = useCallback(() => getTasks().then(setList), [])
  useEffect(() => { load() }, [load])

  const t0 = todayYmd()
  const counts = useMemo(() => ({
    open: list?.filter(t => !t.done).length || 0,
    today: list?.filter(t => !t.done && t.due && t.due <= t0).length || 0,
    done: list?.filter(t => t.done).length || 0,
    all: list?.length || 0,
  }), [list, t0])

  const shown = (list || []).filter(t => (listName === 'all' || t.list === listName)
    && (scope === 'all' || (scope === 'open' && !t.done) || (scope === 'done' && t.done) || (scope === 'today' && !t.done && t.due && t.due <= t0)))
    .sort((a, b) => (a.done - b.done) || (a.due || '9999').localeCompare(b.due || '9999') || TASK_PRIORITY[b.priority].rank - TASK_PRIORITY[a.priority].rank)

  const addQuick = async () => {
    if (!quickTitle.trim()) return
    await saveTask({ title: quickTitle.trim(), list: listName === 'all' ? TASK_LISTS[0] : listName, priority: 'medium', due: t0 })
    setQuickTitle(''); load(); onChange(); toast('Task added')
  }
  const toggle = async (t) => { await toggleTask(t.id); load(); onChange(); if (!t.done) toast(`Done — ${t.title}`) }
  const remove = async (t) => { setBusy(t.id); await deleteTask(t.id); setBusy(null); load(); onChange() }
  const clear = async () => { const r = await clearCompleted(); load(); onChange(); toast(`Cleared ${r.removed} completed task${r.removed === 1 ? '' : 's'}`) }

  return (
    <Card>
      <div className="px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={listName} onChange={e => setListName(e.target.value)}><option value="all">All lists</option>{TASK_LISTS.map(l => <option key={l}>{l}</option>)}</Select>
          <Chips options={[['open', 'Open'], ['today', 'Due'], ['done', 'Done'], ['all', 'All']]} value={scope} onChange={setScope} counts={counts} />
        </div>
        <div className="flex items-center gap-2">
          {counts.done > 0 && <Btn icon="ti-clear-all" onClick={clear}>Clear completed</Btn>}
          <Btn variant="accent" icon="ti-plus" onClick={() => setEditing({})}>New task</Btn>
        </div>
      </div>
      <div className="px-5 py-3 flex gap-2" style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
        <Input value={quickTitle} onChange={e => setQuickTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuick()} placeholder="Quick add a task for today and press Enter" />
        <Btn icon="ti-corner-down-left" disabled={!quickTitle.trim()} onClick={addQuick}>Add</Btn>
      </div>
      {!list ? <Loader /> : shown.length === 0 ? <Empty icon="ti-checklist">No tasks here.</Empty>
        : shown.map(t => <TaskRow key={t.id} t={t} busy={busy === t.id} onToggle={() => toggle(t)} onEdit={() => setEditing(t)} onDelete={() => remove(t)} />)}

      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); onChange(); toast('Task saved') }} />}
    </Card>
  )
}

function TaskModal({ task, onClose, onSaved }) {
  const [f, setF] = useState({ title: '', list: TASK_LISTS[0], priority: 'medium', due: todayYmd(), notes: '', ...task })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  return (
    <Modal title={task.id ? 'Edit task' : 'New task'} onClose={onClose} width={500}>
      <Field label="Task"><Input value={f.title} onChange={e => set('title', e.target.value)} autoFocus /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-3">
        <Field label="List"><Select value={f.list} onChange={e => set('list', e.target.value)} className="w-full">{TASK_LISTS.map(l => <option key={l}>{l}</option>)}</Select></Field>
        <Field label="Priority"><Select value={f.priority} onChange={e => set('priority', e.target.value)} className="w-full">{Object.entries(TASK_PRIORITY).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}</Select></Field>
        <Field label="Due date"><Input type="date" value={f.due || ''} onChange={e => set('due', e.target.value)} /></Field>
      </div>
      <Field label="Notes (optional)"><textarea value={f.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} className="mk-input w-full text-[13px] px-3 py-2 rounded-xl" style={textareaStyle} /></Field>
      <div className="flex justify-end gap-2 pt-2">
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.title.trim()} onClick={async () => { setBusy(true); await saveTask(f); onSaved() }}>Save task</Btn>
      </div>
    </Modal>
  )
}

/* ───────── Calendar ───────── */

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function CalendarTab({ toast, onChange }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [events, setEvents] = useState(null)
  const [tasks, setTasks] = useState([])
  const [selected, setSelected] = useState(todayYmd())
  const [editing, setEditing] = useState(null)

  const month = ymd(cursor).slice(0, 7)
  const load = useCallback(() => { getEvents(month).then(setEvents); getTasks().then(setTasks) }, [month])
  useEffect(() => { load() }, [load])

  // Monday-first grid covering the whole month
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7))
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }, [cursor])

  const shift = (n) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + n, 1))
  const t0 = todayYmd()
  const dayEvents = (key) => (events || []).filter(e => e.date === key).sort((a, b) => (a.start || '99').localeCompare(b.start || '99'))
  const dayTasks = (key) => tasks.filter(t => !t.done && t.due === key)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <Card className="xl:col-span-2 overflow-hidden">
        <div className="px-5 py-3.5 flex items-center justify-between gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="text-[15px] font-bold" style={{ color: C.textPrimary }}>{cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
          <div className="flex items-center gap-1.5">
            <IconBtn icon="ti-chevron-left" title="Previous month" onClick={() => shift(-1)} />
            <Btn onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); setSelected(t0) }}>Today</Btn>
            <IconBtn icon="ti-chevron-right" title="Next month" onClick={() => shift(1)} />
          </div>
        </div>
        <div className="grid grid-cols-7 text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: C.textMuted, background: C.surfaceAlt }}>
          {WEEKDAYS.map(w => <div key={w} className="px-2 py-2 text-center">{w}</div>)}
        </div>
        {!events ? <Loader /> : (
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const key = ymd(d)
              const inMonth = d.getMonth() === cursor.getMonth()
              const evs = dayEvents(key)
              const tks = dayTasks(key)
              const isSel = key === selected
              return (
                <button key={i} onClick={() => setSelected(key)} onDoubleClick={() => setEditing({ date: key })}
                  className="text-left p-1.5 min-h-[86px] cursor-pointer flex flex-col gap-1"
                  style={{ borderTop: `1px solid ${C.border}`, borderLeft: i % 7 ? `1px solid ${C.border}` : 'none', background: isSel ? THEME.accentBg : 'transparent', opacity: inMonth ? 1 : 0.45, outline: 'none' }}>
                  <span className="text-[11.5px] font-semibold w-6 h-6 rounded-full flex items-center justify-center"
                    style={key === t0 ? { background: ACCENT, color: '#fff' } : { color: C.textPrimary }}>{d.getDate()}</span>
                  {evs.slice(0, 2).map(e => (
                    <span key={e.id} className="text-[10.5px] font-medium px-1.5 py-0.5 rounded truncate" style={{ background: (EVENT_KINDS[e.kind]?.color || ACCENT) + '1A', color: EVENT_KINDS[e.kind]?.color || ACCENT }}>
                      {e.start && `${e.start} `}{e.title}
                    </span>
                  ))}
                  {(evs.length > 2 || tks.length > 0) && (
                    <span className="text-[10px]" style={{ color: C.textMuted }}>
                      {evs.length > 2 && `+${evs.length - 2} more`}{evs.length > 2 && tks.length > 0 && ' · '}{tks.length > 0 && `${tks.length} task${tks.length > 1 ? 's' : ''}`}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader title={longDate(selected)} sub={selected === t0 ? 'Today' : ' '} right={<Btn variant="accent" icon="ti-plus" onClick={() => setEditing({ date: selected })}>Event</Btn>} />
        {dayEvents(selected).length === 0 && dayTasks(selected).length === 0
          ? <Empty icon="ti-calendar-off">Nothing on this day.<br /><span className="text-[11px]">Double-click any date to add an event.</span></Empty>
          : (
            <>
              {dayEvents(selected).map(e => <EventRow key={e.id} e={e} onClick={() => setEditing(e)} />)}
              {dayTasks(selected).map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: `1px solid ${C.border}` }}>
                  <i className="ti ti-checkbox text-[16px]" style={{ color: C.textMuted }} aria-hidden="true"></i>
                  <span className="text-[12.5px] flex-1 truncate" style={{ color: C.textPrimary }}>{t.title}</span>
                  <Pill small meta={TASK_PRIORITY[t.priority]} />
                </div>
              ))}
            </>
          )}
      </Card>

      {editing && <EventModal ev={editing} onClose={() => setEditing(null)}
        onSaved={(e) => { setEditing(null); setSelected(e.date); load(); onChange(); toast('Event saved') }}
        onDeleted={() => { setEditing(null); load(); onChange(); toast('Event deleted') }} />}
    </div>
  )
}

function EventModal({ ev, onClose, onSaved, onDeleted }) {
  const [f, setF] = useState({ title: '', kind: 'meeting', date: todayYmd(), start: '', end: '', location: '', ...ev })
  const [busy, setBusy] = useState(false)
  const set = (k, v) => setF(x => ({ ...x, [k]: v }))
  return (
    <Modal title={ev.id ? 'Edit event' : 'New event'} onClose={onClose} width={520}>
      <Field label="Title"><Input value={f.title} onChange={e => set('title', e.target.value)} autoFocus /></Field>
      <Field label="Type">
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(EVENT_KINDS).map(([k, m]) => (
            <button key={k} type="button" onClick={() => set('kind', k)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
              style={{ border: `1.5px solid ${f.kind === k ? m.color : C.border}`, background: f.kind === k ? m.color + '14' : C.surface, color: f.kind === k ? m.color : C.textSecondary }}>
              <i className={`ti ${m.icon}`} aria-hidden="true"></i>{m.label}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-3 gap-x-3">
        <Field label="Date"><Input type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
        <Field label="Start"><Input type="time" value={f.start} onChange={e => set('start', e.target.value)} /></Field>
        <Field label="End"><Input type="time" value={f.end} onChange={e => set('end', e.target.value)} /></Field>
      </div>
      <Field label="Location / link (optional)"><Input value={f.location} onChange={e => set('location', e.target.value)} placeholder="ISF Office, Google Meet…" /></Field>
      <div className="flex justify-between gap-2 pt-2">
        <div>{ev.id && <Btn variant="danger" icon="ti-trash" onClick={async () => { await deleteEvent(ev.id); onDeleted() }}>Delete</Btn>}</div>
        <div className="flex gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="accent" icon="ti-device-floppy" loading={busy} disabled={!f.title.trim() || !f.date} onClick={async () => { setBusy(true); onSaved(await saveEvent(f)) }}>Save event</Btn>
        </div>
      </div>
    </Modal>
  )
}
