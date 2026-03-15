interface WeekNavigatorProps {
  offset: number;
  onChange: (offset: number) => void;
}

function getWeekLabel(offset: number): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) =>
    `${d.getDate()}.${d.getMonth() + 1}.`;
  return `${fmt(monday)} - ${fmt(sunday)}`;
}

export default function WeekNavigator({ offset, onChange }: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <button
        onClick={() => onChange(offset - 1)}
        className="px-1.5 py-1 rounded hover:bg-gray-100 transition-colors font-bold"
      >
        ‹
      </button>
      <span className="w-28 text-center font-medium">{getWeekLabel(offset)}</span>
      <button
        onClick={() => onChange(offset + 1)}
        className="px-1.5 py-1 rounded hover:bg-gray-100 transition-colors font-bold"
      >
        ›
      </button>
    </div>
  );
}
