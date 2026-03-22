import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useWebSocket } from '../hooks/useWebSocket';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { KitchenOrder, KitchenItem } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';

export default function Kitchen() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { getTablePrefix } = useRestaurantConfig();
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const res = await authFetch(`${getApiBase()}/api/orders/kitchen`);
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useWebSocket([
    {
      destination: `/topic/kitchen/${user?.restaurantId}`,
      callback: (data: KitchenOrder[]) => setOrders(data),
    },
  ]);

  const updateItemStatus = async (itemId: number, status: string) => {
    try {
      await authFetch(`${getApiBase()}/api/orders/items/${itemId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getElapsedMinutes = (dateStr: string) => {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  };

  const totalNewItems = orders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'NEW').length,
    0
  );
  const totalPreparing = orders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'PREPARING').length,
    0
  );
  const totalReady = orders.reduce(
    (sum, o) => sum + o.items.filter((i) => i.status === 'READY').length,
    0
  );

  const renderItemActions = (item: KitchenItem) => {
    switch (item.status) {
      case 'NEW':
        return (
          <button
            className="kitchen-status-btn start"
            onClick={() => updateItemStatus(item.id, 'PREPARING')}
          >
            {'\uD83C\uDF73'} Start
          </button>
        );
      case 'PREPARING':
        return (
          <>
            <span className="kitchen-status-current PREPARING">
              {'\uD83D\uDD25'} Cooking
            </span>
            <button
              className="kitchen-status-btn ready"
              onClick={() => updateItemStatus(item.id, 'READY')}
            >
              {'\u2705'} Ready
            </button>
          </>
        );
      case 'READY':
        return (
          <>
            <span className="kitchen-status-current READY">
              {'\u2705'} Ready
            </span>
            <button
              className="kitchen-status-btn served"
              onClick={() => updateItemStatus(item.id, 'SERVED')}
            >
              {'\uD83C\uDF7D\uFE0F'} Served
            </button>
          </>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading kitchen orders...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="kitchen-page">
        <div className="kitchen-header">
          <h1>{'\uD83D\uDC68\u200D\uD83C\uDF73'} Kitchen Display</h1>
          <div className="kitchen-stats">
            <div className="kitchen-stat">
              <span className="number" style={{ color: '#f59e0b' }}>
                {totalNewItems}
              </span>
              <span className="label">New</span>
            </div>
            <div className="kitchen-stat">
              <span className="number" style={{ color: '#8b5cf6' }}>
                {totalPreparing}
              </span>
              <span className="label">Cooking</span>
            </div>
            <div className="kitchen-stat">
              <span className="number" style={{ color: '#22c55e' }}>
                {totalReady}
              </span>
              <span className="label">Ready</span>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{'\uD83D\uDC68\u200D\uD83C\uDF73'}</div>
            <h3>No Active Orders</h3>
            <p>New orders will appear here in real time</p>
          </div>
        ) : (
          <div className="kitchen-orders-grid">
            {orders.map((order) => {
              const hasNew = order.items.some((i) => i.status === 'NEW');
              const elapsed = getElapsedMinutes(order.createdAt);
              const prefix = getTablePrefix(order.tableType);

              return (
                <div
                  key={order.orderId}
                  className={`kitchen-order-card ${hasNew ? 'has-new' : ''}`}
                >
                  <div className="kitchen-order-header">
                    <div className="kitchen-table-info">
                      <div className="kitchen-table-number">
                        {prefix}{order.tableNumber}
                      </div>
                      <div className="kitchen-table-meta">
                        <div>{order.tableType} Table</div>
                        {order.groupName && (
                          <div className="waiter" style={{ color: '#8b5cf6', fontWeight: 600 }}>
                            {order.groupName}
                          </div>
                        )}
                        {order.waiterName && (
                          <div className="waiter">
                            By: {order.waiterName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="kitchen-time">
                      {'\u23F1\uFE0F'} {elapsed}m ago {'\u2022'}{' '}
                      {formatTime(order.createdAt)}
                    </div>
                  </div>
                  <div className="kitchen-items-list">
                    {order.items.map((item) => (
                      <div key={item.id} className="kitchen-item">
                        <div className="kitchen-item-info">
                          <div className="kitchen-item-name">
                            <span className="kitchen-item-qty">
                              {item.quantity}
                            </span>
                            {item.itemName}
                          </div>
                          {item.specialInstructions && (
                            <div className="kitchen-item-note">
                              {'\uD83D\uDCDD'} {item.specialInstructions}
                            </div>
                          )}
                        </div>
                        <div className="kitchen-item-actions">
                          {renderItemActions(item)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
