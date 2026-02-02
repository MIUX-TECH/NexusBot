import React from 'react';
import { 
  Activity, 
  Settings, 
  Cpu, 
  BarChart2, 
  Shield, 
  Terminal,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isOpen: boolean; // Mobile toggle state
  isCollapsed: boolean; // Desktop collapse state
  onToggleMobile: () => void;
  onToggleDesktop: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  onNavigate, 
  isOpen, 
  isCollapsed,
  onToggleMobile,
  onToggleDesktop
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={onToggleMobile}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 h-full z-50 bg-gray-950/95 border-r border-gray-800 transition-all duration-300 ease-in-out shadow-2xl flex flex-col justify-between
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 
        ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-72
      `}>
        {/* Header */}
        <div>
          <div className={`h-16 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between px-6'} border-b border-gray-800 bg-gray-900/50`}>
            <div className="flex items-center gap-3 overflow-hidden">
               <Cpu className="w-8 h-8 text-primary-500 shrink-0" />
               <span className={`font-mono font-bold text-xl tracking-tighter text-white transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
                NEXUS<span className="text-primary-500">.AI</span>
               </span>
            </div>
            {/* Mobile Close Button */}
            <button onClick={onToggleMobile} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="mt-6 flex flex-col gap-2 px-3">
            <NavItem 
              icon={<Activity />} 
              label="Dasbor Utama" 
              id="dashboard"
              active={activeTab === 'dashboard'} 
              onClick={(id) => { onNavigate(id); if(window.innerWidth < 1024) onToggleMobile(); }}
              collapsed={isCollapsed}
            />
            <NavItem 
              icon={<BarChart2 />} 
              label="Strategi" 
              id="strategies"
              active={activeTab === 'strategies'} 
              onClick={(id) => { onNavigate(id); if(window.innerWidth < 1024) onToggleMobile(); }}
              collapsed={isCollapsed}
            />
            <NavItem 
              icon={<Terminal />} 
              label="Log Sistem" 
              id="logs"
              active={activeTab === 'logs'} 
              onClick={(id) => { onNavigate(id); if(window.innerWidth < 1024) onToggleMobile(); }}
              collapsed={isCollapsed}
            />
            <NavItem 
              icon={<Shield />} 
              label="Koneksi API" 
              id="settings"
              active={activeTab === 'settings'} 
              onClick={(id) => { onNavigate(id); if(window.innerWidth < 1024) onToggleMobile(); }}
              collapsed={isCollapsed}
            />
          </nav>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-800 bg-gray-900/30">
          
          {/* Desktop Collapse Toggle */}
          <button 
             onClick={onToggleDesktop}
             className="hidden lg:flex w-full items-center justify-center p-2 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors border-b border-gray-800"
          >
             {isCollapsed ? <ChevronRight size={16} /> : <div className="flex items-center gap-2 text-xs font-mono uppercase"><ChevronLeft size={14} /> Collapse Menu</div>}
          </button>

          <div className={`p-4 transition-opacity duration-300 ${isCollapsed ? 'lg:opacity-0 lg:pointer-events-none' : 'opacity-100'}`}>
            <div className="text-xs text-gray-500 font-mono text-center opacity-60">
                v2.1.0 • TRADING TERMINAL
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

interface NavItemProps { 
  icon: React.ReactNode; 
  label: string; 
  id: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: (id: string) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, id, active, collapsed, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center w-full p-3 rounded-xl transition-all duration-200 group relative
    ${active 
      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }
    ${collapsed ? 'lg:justify-center' : 'justify-start'}
    `}
  >
    <div className="shrink-0">{React.cloneElement(icon as React.ReactElement, { size: 20 })}</div>
    
    <span className={`ml-3 text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden
        ${collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}
    `}>
        {label}
    </span>
    
    {/* Tooltip for collapsed state */}
    {collapsed && (
        <div className="hidden lg:block absolute left-14 bg-gray-900 text-white text-xs px-2 py-1.5 rounded border border-gray-800 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
          {label}
        </div>
    )}
  </button>
);

export default Sidebar;