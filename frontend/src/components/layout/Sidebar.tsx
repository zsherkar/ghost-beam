import {
  Activity,
  Bell,
  Cpu,
  Database,
  FileText,
  Gauge,
  GitBranch,
  Home,
  Lock,
  Radio,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TerminalSquare,
  Workflow,
} from 'lucide-react'

interface Props {
  status: string
  activePanel: string
  onNavigate: (item: string) => void
}

const groups = [
  {
    title: 'Beamline',
    items: [
      ['Beamline', Home],
      ['Lattice', GitBranch],
      ['Devices', Cpu],
      ['Interlocks', Bell],
      ['Vacuum', Gauge],
      ['Diagnostics', Radio],
    ],
  },
  {
    title: 'Trust & Memory',
    items: [
      ['Trust Gate', ShieldCheck],
      ['Twin State', Activity],
      ['Policy', Lock],
    ],
  },
  {
    title: 'Logbook',
    items: [
      ['eLog', FileText],
      ['Evidence', Database],
    ],
  },
  {
    title: 'System',
    items: [
      ['Agents', Workflow],
      ['Simulations', TerminalSquare],
      ['Settings', Settings],
    ],
  },
] as const

function Sidebar({ status, activePanel, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <button className="sidebar-brand" type="button" onClick={() => onNavigate('Overview')}>
        <Home size={18} />
        <strong>Overview</strong>
      </button>

      {groups.map((group) => (
        <section className="nav-group" key={group.title}>
          <h2>{group.title}</h2>
          {group.items.map(([item, Icon]) => (
            <button
              className={item === activePanel || (item === 'Beamline' && activePanel === 'Overview') ? 'active' : ''}
              key={item}
              type="button"
              onClick={() => onNavigate(item)}
            >
              <Icon size={16} />
              <span>{item}</span>
              {(item === activePanel || (item === 'Beamline' && activePanel === 'Overview')) && <i />}
            </button>
          ))}
        </section>
      ))}

      <div className="local-control">
        <span className="live-dot" />
        <strong>Local Control</strong>
        <div className="operator-line">
          <SlidersHorizontal size={13} />
          <span>Operator</span>
          <em>Shift A</em>
        </div>
        <p>{status}</p>
      </div>
    </aside>
  )
}

export default Sidebar
