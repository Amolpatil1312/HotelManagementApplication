import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useWebSocket } from '../hooks/useWebSocket';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { TableData } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';
import TableSeats from '../components/TableSeats';

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning',
  WAITING_FOR_BILL: 'Bill Due',
};

export default function Dashboard() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const navigate = useNavigate();
  const { tableTypes, getCurrencySymbol, getTablePrefix } = useRestaurantConfig();
  const { user } = useAuth();

  const cs = getCurrencySymbol();

  const fetchTables = useCallback(async () => {
    try {
      const res = await authFetch(`${getApiBase()}/api/tables`);
      setTables(await res.json());
    } catch (err) {
      console.error('Failed to fetch tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // Live clock tick every 30s to update elapsed times
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  useWebSocket([
    { destination: `/topic/tables/${user?.restaurantId}`, callback: (d: TableData[]) => setTables(d) },
  ]);

  const handleTableClick = async (table: TableData) => {
    if (table.status === 'CLEANING') {
      await authFetch(`${getApiBase()}/api/tables/${table.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'AVAILABLE' }),
      });
      return;
    }
    navigate(`/table/${table.id}`);
  };

  const elapsed = (since?: string) => {
    if (!since) return '';
    const m = Math.floor((now - new Date(since).getTime()) / 60000);
    return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const counts = {
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: tables.filter((t) => t.status === 'OCCUPIED').length,
    waiting: tables.filter((t) => t.status === 'WAITING_FOR_BILL').length,
  };

  // Group tables by type dynamically
  const tablesByType = tableTypes.map(tt => ({
    type: tt,
    tables: tables.filter(t => t.tableType === tt.name),
  })).filter(g => g.tables.length > 0);

  // Include tables with types not in config (fallback)
  const knownTypes = new Set(tableTypes.map(tt => tt.name));
  const unknownTables = tables.filter(t => !knownTypes.has(t.tableType));
  if (unknownTables.length > 0) {
    tablesByType.push({
      type: { id: 0, name: 'OTHER', labelPrefix: 'T', defaultCapacity: 4 },
      tables: unknownTables,
    });
  }

  if (loading) {
    return (
      <><Navbar /><div className="loading-container"><div className="loading-spinner" /><p>Loading...</p></div></>
    );
  }

  const renderCard = (table: TableData, idx: number) => {
    const prefix = getTablePrefix(table.tableType);
    const hasOrder = table.activeOrderId && (table.status === 'OCCUPIED' || table.status === 'WAITING_FOR_BILL');

    return (
      <div
        key={table.id}
        className={`tcard ${table.status}`}
        style={{ animationDelay: `${idx * 0.06}s` }}
        onClick={() => handleTableClick(table)}
      >
        {/* Glow bar */}
        <div className={`tcard-glow ${table.status}`} />

        <div className="tcard-top">
          <div className="tcard-num">
            {prefix}{table.tableNumber}
          </div>
          <div className={`tcard-badge ${table.status}`}>
            {STATUS_LABELS[table.status]}
          </div>
        </div>

        <TableSeats capacity={table.capacity} tableType={table.tableType} status={table.status} activeOrders={table.activeOrders} />

        <div className="tcard-cap">
          {table.capacity} seats {'\u00A0'} {table.tableType}
        </div>

        {hasOrder && (
          <div className="tcard-order">
            {(table.groupCount || 0) > 1 && (
              <div className="tcard-stat">
                <span className="tcard-stat-val" style={{ color: '#8b5cf6' }}>{table.groupCount}</span>
                <span className="tcard-stat-lbl">groups</span>
              </div>
            )}
            <div className="tcard-stat">
              <span className="tcard-stat-val">{table.totalItems || 0}</span>
              <span className="tcard-stat-lbl">items</span>
            </div>
            <div className="tcard-stat">
              <span className="tcard-stat-val accent">{cs}{table.totalAmount?.toFixed(0) || 0}</span>
              <span className="tcard-stat-lbl">total</span>
            </div>
            {table.status === 'OCCUPIED' && table.occupiedSince && (
              <div className="tcard-stat">
                <span className="tcard-stat-val muted">{elapsed(table.occupiedSince)}</span>
                <span className="tcard-stat-lbl">elapsed</span>
              </div>
            )}
          </div>
        )}

        {table.status === 'RESERVED' && table.reservedBy && (
          <div className="tcard-footer-msg">Reserved: {table.reservedBy}</div>
        )}
        {table.status === 'CLEANING' && (
          <div className="tcard-footer-msg blink">Tap to mark available</div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="dash">
        {/* Top bar */}
        <div className="dash-top">
          <div>
            <h1 className="dash-title">Table View</h1>
            <p className="dash-sub">Tap any table to take orders</p>
          </div>
          <div className="dash-pills">
            <div className="pill green">{counts.available} Free</div>
            <div className="pill red">{counts.occupied} Active</div>
            {counts.waiting > 0 && <div className="pill orange">{counts.waiting} Billing</div>}
            <div className="pill purple">{tables.length} Total</div>
          </div>
        </div>

        {/* Legend */}
        <div className="dash-legend">
          {['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'WAITING_FOR_BILL'].map((s) => (
            <span key={s} className="leg-item">
              <span className={`leg-dot ${s}`} />
              {STATUS_LABELS[s]}
            </span>
          ))}
        </div>

        {/* Floor split - dynamic by table type */}
        <div className="floor">
          {tablesByType.map((group, gIdx) => (
            <div key={group.type.name} style={{ display: 'contents' }}>
              {gIdx > 0 && <div className="floor-divider" />}
              <div className="floor-col">
                <div className="floor-label">{group.type.name} Section</div>
                <div className={`tgrid ${group.tables.length <= 5 ? 'family-grid' : 'general-grid'}`}>
                  {group.tables.map((t, i) => renderCard(t, i + gIdx * 10))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
