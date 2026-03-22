import { ActiveOrderSummary } from '../types/types';

const GROUP_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

interface TableSeatsProps {
  capacity: number;
  tableType: string;
  status: string;
  activeOrders?: ActiveOrderSummary[];
}

export default function TableSeats({ capacity, tableType, status, activeOrders }: TableSeatsProps) {
  const statusClass = status.toLowerCase().replace('_', '-');
  const totalSeats = capacity;
  const seatColors: (string | null)[] = new Array(totalSeats).fill(null);

  if (activeOrders && activeOrders.length > 0 && (status === 'OCCUPIED' || status === 'WAITING_FOR_BILL')) {
    let seatIndex = 0;
    activeOrders.forEach((group, groupIdx) => {
      const color = GROUP_COLORS[groupIdx % GROUP_COLORS.length];
      const people = Math.max(1, group.numberOfPeople);
      for (let i = 0; i < people && seatIndex < totalSeats; i++) {
        seatColors[seatIndex] = color;
        seatIndex++;
      }
    });
  }

  const renderSeat = (index: number) => {
    const color = seatColors[index];
    if (color) {
      return (
        <div
          key={index}
          className={`seat occupied`}
          style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
        />
      );
    }
    return <div key={index} className={`seat ${statusClass}`} />;
  };

  // Large tables (6+ seats): 3-column layout
  if (totalSeats >= 6) {
    const topCount = Math.ceil(totalSeats / 3);
    const bottomCount = Math.ceil((totalSeats - topCount) / 2);
    const leftCount = Math.floor((totalSeats - topCount - bottomCount) / 2);
    const rightCount = totalSeats - topCount - bottomCount - leftCount;

    let seatIdx = 0;
    const topSeats = Array.from({ length: topCount }, () => renderSeat(seatIdx++));
    const leftSeats = Array.from({ length: leftCount }, () => renderSeat(seatIdx++));
    const rightSeats = Array.from({ length: rightCount }, () => renderSeat(seatIdx++));
    const bottomSeats = Array.from({ length: bottomCount }, () => renderSeat(seatIdx++));

    return (
      <div className="seats-layout family-seats">
        <div className="seats-row top">{topSeats}</div>
        <div className="seats-middle">
          <div className="seats-col">{leftSeats}</div>
          <div className={`table-surface family-surface ${statusClass}`}>
            <span className="table-label">{totalSeats}</span>
          </div>
          <div className="seats-col">{rightSeats}</div>
        </div>
        <div className="seats-row bottom">{bottomSeats}</div>
      </div>
    );
  }

  // Small tables (2-5 seats): compact layout
  const topCount = Math.ceil(totalSeats / 3);
  const sideAndBottom = totalSeats - topCount;
  const leftCount = Math.floor(sideAndBottom / 2);
  const rightCount = Math.ceil(sideAndBottom / 2);

  let seatIdx = 0;
  const topSeats = Array.from({ length: topCount }, () => renderSeat(seatIdx++));
  const leftSeats = Array.from({ length: leftCount }, () => renderSeat(seatIdx++));
  const rightSeats = Array.from({ length: rightCount }, () => renderSeat(seatIdx++));

  return (
    <div className="seats-layout general-seats">
      <div className="seats-row top">{topSeats}</div>
      <div className="seats-middle">
        <div className="seats-col">{leftSeats}</div>
        <div className={`table-surface general-surface ${statusClass}`}>
          <span className="table-label">{totalSeats}</span>
        </div>
        <div className="seats-col">{rightSeats}</div>
      </div>
    </div>
  );
}
