import { Settings, MessageCircle, Folder, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    { icon: Folder, label: 'Knowledge Bases', path: '/knowledge-bases' },
    { icon: Wrench, label: 'Tools', path: '/tools' },
    { icon: Settings, label: 'Agents', path: '/agents' },

  ];

  const handleNavigation = (item: any) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="  w-full md:w-64 min-h-screen bg-[#1f232e]  rounded-2xl shadow-xl p-2 flex flex-col gap-6" style={{ border: '1.5px solid #dbeafe' }}>
      {/* Header */}
      {/* <div className="flex flex-col gap-3 px-2 pt-2 pb-4">
        <button className="btn-primary">
          Linker
        </button>

      </div> */}

      {/* Navigation */}
      <nav className="flex flex-col gap-2 px-2">
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.path === location.pathname;
          return (
            <div
              key={index}
              className={`text-[14px] flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200 text-lg font-medium shadow-sm ${isActive
                ? 'bg-[#1677FF] text-white'
                : 'text-white hover:text-[#1677FF]'
                }`}

              onClick={() => handleNavigation(item)}
            >
              <Icon className="w-6 h-6" />
              <span className="ml-2">{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {/* <div className="mt-auto pt-6">
        <button className="btn-secondary shadow-md flex items-center gap-3 px-5 py-4 w-full">
          <div className="w-9 h-9 flex items-center justify-center">
            <span className="text-base font-bold">U</span>
          </div>
          <div className="flex flex-col items-start">
            <div className="text-base font-semibold">User</div>
            <div className="text-xs text-blue-500">user@example.com</div>
          </div>
        </button>
      </div> */}
    </aside>
  );
};

export default Sidebar;
