import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  Layers,
  Power,
  Calculator,
  CalendarClock,
  BarChart3,
  BellRing,
  Cpu,
  Settings,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Live Monitoring', path: '/monitoring', icon: Activity },
  { name: 'Farms & Fields', path: '/farms-fields', icon: Layers },
  { name: 'Irrigation Control', path: '/irrigation-control', icon: Power },
  { name: 'Water Predictions', path: '/water-predictions', icon: Calculator },
  { name: 'Irrigation Schedule', path: '/schedules', icon: CalendarClock },
  { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  { name: 'Alerts & Events', path: '/alerts', icon: BellRing },
  { name: 'Sensor Management', path: '/sensors', icon: Cpu },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-obsidian border-r border-border-gray transition-all duration-200 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border-gray">
        {!isCollapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded bg-cerulean/15 border border-cerulean/30 flex items-center justify-center text-cerulean">
              <Droplets className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-semibold tracking-tight text-pure-white">IrrigaSense</span>
              <span className="block text-[10px] text-slate-gray font-mono uppercase tracking-wider">Smart Water OS</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto w-8 h-8 rounded bg-cerulean/15 border border-cerulean/30 flex items-center justify-center text-cerulean">
            <Droplets className="w-4 h-4 stroke-[2.2]" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-gray hover:text-pure-white hover:bg-graphite transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center rounded text-xs font-medium transition-colors ${
                  isCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 space-x-3'
                } ${
                  isActive
                    ? 'bg-cerulean/15 text-cerulean border border-cerulean/30 font-semibold'
                    : 'text-slate-gray hover:text-pure-white hover:bg-graphite'
                }`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / System Status */}
      <div className="p-3 border-t border-border-gray bg-obsidian">
        {!isCollapsed ? (
          <div className="p-2.5 rounded bg-graphite border border-border-gray text-[11px]">
            <div className="flex items-center justify-between text-slate-gray mb-1">
              <span>System Telemetry</span>
              <span className="w-1.5 h-1.5 rounded-full bg-field-green inline-block animate-pulse"></span>
            </div>
            <div className="text-pure-white font-mono text-[10px]">Active Engine: v1.0.0</div>
            <div className="text-[10px] text-amber-alert mt-1 font-mono">SIMULATION ONLY</div>
          </div>
        ) : (
          <div className="flex justify-center" title="System Status: Normal (Simulated)">
            <span className="w-2 h-2 rounded-full bg-field-green"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
