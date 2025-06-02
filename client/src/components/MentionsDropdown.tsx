
interface Mention {
  id: string;
  name: string;
  type: 'agent' | 'knowledge-base' | 'tool';
  icon: string;
}

interface MentionsDropdownProps {
  filteredMentions: Mention[];
  onMentionClick: (mention: Mention) => void;
}

const MentionsDropdown = ({ filteredMentions, onMentionClick }: MentionsDropdownProps) => {
  const getMentionTypeColor = (type: string) => {
    switch (type) {
      case 'agent': return 'text-blue-600';
      case 'knowledge-base': return 'text-green-600';
      case 'tool': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-3 bg-white border-2 border-gray-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-10">
      <div className="p-4">
        <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Mention</div>
        <div className="space-y-1">
          {filteredMentions.map((mention) => (
            <button
              key={mention.id}
              onClick={() => onMentionClick(mention)}
              className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
            >
              <span className="text-xl">{mention.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{mention.name}</div>
                <div className={`text-xs font-medium capitalize ${getMentionTypeColor(mention.type)}`}>
                  {mention.type.replace('-', ' ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentionsDropdown;
