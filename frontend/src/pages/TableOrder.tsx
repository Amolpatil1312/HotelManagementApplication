import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useWebSocket } from '../hooks/useWebSocket';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { MenuItemType, OrderType, CartItem, TableData } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';

export default function TableOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { config, categories, getCurrencySymbol, getTablePrefix } = useRestaurantConfig();
  const { user } = useAuth();

  const cs = getCurrencySymbol();

  const [table, setTable] = useState<TableData | null>(null);
  const [menu, setMenu] = useState<Record<string, MenuItemType[]>>({});
  const [activeCategory, setActiveCategory] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<OrderType[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);
  const [isNewGroup, setIsNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPeople, setNewGroupPeople] = useState(1);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [instructions, setInstructions] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [billOrder, setBillOrder] = useState<OrderType | null>(null);
  const [mobileTab, setMobileTab] = useState<'menu' | 'cart'>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItemType | null>(null);
  const [modalQty, setModalQty] = useState(1);
  const [modalInstructions, setModalInstructions] = useState('');

  const selectedOrder = !isNewGroup && existingOrders.length > 0 ? existingOrders[selectedGroupIndex] : null;

  // Set initial active category from config
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].name);
    }
  }, [categories, activeCategory]);

  const fetchData = useCallback(async () => {
    try {
      const [tablesRes, menuRes, orderRes] = await Promise.all([
        authFetch(`${getApiBase()}/api/tables`),
        authFetch(`${getApiBase()}/api/menu/grouped`),
        authFetch(`${getApiBase()}/api/orders/table/${tableId}/active`),
      ]);

      const tablesData: TableData[] = await tablesRes.json();
      const tableData = tablesData.find((t) => t.id === Number(tableId));
      setTable(tableData || null);

      const menuData = await menuRes.json();
      setMenu(menuData);

      const orderData: OrderType[] = await orderRes.json();
      if (Array.isArray(orderData) && orderData.length > 0) {
        setExistingOrders(orderData);
        setSelectedGroupIndex(0);
        setIsNewGroup(false);
      } else {
        setExistingOrders([]);
        setIsNewGroup(true);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, [tableId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useWebSocket([
    {
      destination: `/topic/tables/${user?.restaurantId}`,
      callback: (data: TableData[]) => {
        const t = data.find((t) => t.id === Number(tableId));
        if (t) setTable(t);
      },
    },
  ]);

  const handleQuantityChange = (menuItemId: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[menuItemId] || 0;
      const next = Math.max(0, Math.min(20, current + delta));
      return { ...prev, [menuItemId]: next };
    });
  };

  const openAddItemModal = (item: MenuItemType) => {
    setSelectedMenuItem(item);
    setModalQty(1);
    setModalInstructions('');
    setShowAddItemModal(true);
  };

  const addFromModal = () => {
    if (!selectedMenuItem || modalQty === 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === selectedMenuItem.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === selectedMenuItem.id
            ? {
                ...c,
                quantity: c.quantity + modalQty,
                specialInstructions: modalInstructions || c.specialInstructions,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: selectedMenuItem.id,
          name: selectedMenuItem.name,
          price: selectedMenuItem.price,
          quantity: modalQty,
          specialInstructions: modalInstructions,
          emoji: selectedMenuItem.imageEmoji,
        },
      ];
    });
    setShowAddItemModal(false);
    setSelectedMenuItem(null);
  };

  const addToCart = (item: MenuItemType) => {
    const qty = quantities[item.id] || 1;
    if (qty === 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id
            ? {
                ...c,
                quantity: c.quantity + qty,
                specialInstructions:
                  instructions[item.id] || c.specialInstructions,
              }
            : c
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          quantity: qty,
          specialInstructions: instructions[item.id] || '',
          emoji: item.imageEmoji,
        },
      ];
    });
    setQuantities((prev) => ({ ...prev, [item.id]: 0 }));
    setInstructions((prev) => ({ ...prev, [item.id]: '' }));
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    try {
      const items = cart.map((c) => ({
        menuItemId: c.menuItemId,
        quantity: c.quantity,
        specialInstructions: c.specialInstructions || null,
      }));

      if (selectedOrder && !isNewGroup) {
        const res = await authFetch(`${getApiBase()}/api/orders/${selectedOrder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data: OrderType = await res.json();
        setExistingOrders((prev) =>
          prev.map((o) => (o.id === data.id ? data : o))
        );
      } else {
        const groupName = newGroupName.trim() || `Group ${existingOrders.length + 1}`;
        const res = await authFetch(`${getApiBase()}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableId: Number(tableId),
            waiterName: 'Staff',
            groupName,
            numberOfPeople: newGroupPeople,
            items,
          }),
        });
        const data: OrderType = await res.json();
        setExistingOrders((prev) => [...prev, data]);
        setSelectedGroupIndex(existingOrders.length);
        setIsNewGroup(false);
        setNewGroupName('');
      }

      setCart([]);
      setMobileTab('menu');
    } catch (err) {
      console.error('Failed to submit order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOrder = async (order: OrderType) => {
    try {
      await authFetch(`${getApiBase()}/api/orders/${order.id}/complete`, {
        method: 'POST',
      });
      const remaining = existingOrders.filter((o) => o.id !== order.id);
      if (remaining.length === 0) {
        navigate('/');
      } else {
        setExistingOrders(remaining);
        setSelectedGroupIndex(0);
        setShowBill(false);
        setBillOrder(null);
      }
    } catch (err) {
      console.error('Failed to complete order:', err);
    }
  };

  const handleShowBill = (order: OrderType) => {
    setBillOrder(order);
    setShowBill(true);
  };

  // Use categories from config, sorted by displayOrder
  const categoryOrder = categories.map(c => c.name);
  const categoryEmojis: Record<string, string> = {};
  categories.forEach(c => { categoryEmojis[c.name] = c.emoji; });

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Loading menu...</p>
        </div>
      </>
    );
  }

  const tablePrefix = getTablePrefix(table?.tableType || '');

  // Flatten all menu items for search
  const allMenuItems: MenuItemType[] = Object.values(menu).flat();

  // Search results — filter across all categories
  const searchTerm = searchQuery.trim().toLowerCase();
  const searchResults = searchTerm.length >= 1
    ? allMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      )
    : [];

  const isSearching = searchTerm.length >= 1;

  // Items to display in menu grid
  const displayItems = isSearching ? searchResults : (menu[activeCategory] || []);

  const handleGroupNameFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  // New group setup section (reused in both positions)
  const newGroupSetup = isNewGroup ? (
    <div className="new-group-setup">
      <div className="new-group-setup-title">Add New Group</div>
      <div className="new-group-fields">
        <div className="new-group-field">
          <label>Group Name</label>
          <input
            type="text"
            placeholder={`Group ${existingOrders.length + 1}`}
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onFocus={handleGroupNameFocus}
          />
          {newGroupName && (
            <div className="group-name-preview">
              {'\uD83D\uDC65'} {newGroupName}
            </div>
          )}
        </div>
        <div className="new-group-field">
          <label>People</label>
          <div className="people-control">
            <button onClick={() => setNewGroupPeople(Math.max(1, newGroupPeople - 1))}>{'\u2212'}</button>
            <span>{newGroupPeople}</span>
            <button onClick={() => setNewGroupPeople(Math.min(20, newGroupPeople + 1))}>+</button>
          </div>
        </div>
      </div>
      {isNewGroup && existingOrders.length > 0 && (
        <button
          className="btn-cancel-group"
          onClick={() => { setIsNewGroup(false); setNewGroupName(''); setNewGroupPeople(1); }}
        >
          {'\u2715'} Cancel New Group
        </button>
      )}
    </div>
  ) : null;

  // Shared sidebar content (used in both desktop sidebar and mobile cart tab)
  const sidebarContent = (
    <>
      <div className="table-info-header">
        <h2>
          Table {tablePrefix}{table?.tableNumber}{' '}
          <span style={{ fontSize: '0.75em', opacity: 0.7 }}>{table?.tableType}</span>
        </h2>
        <div className="table-meta">
          <span>{table?.capacity} Seats</span>
          <span>{'\u2022'}</span>
          <span className={`status-badge ${table?.status}`}>
            {table?.status}
          </span>
        </div>
      </div>

      {/* Group Tabs */}
      {existingOrders.length > 0 && (
        <div className="group-tabs">
          {existingOrders.map((order, idx) => (
            <button
              key={order.id}
              className={`group-tab ${!isNewGroup && selectedGroupIndex === idx ? 'active' : ''}`}
              onClick={() => {
                setSelectedGroupIndex(idx);
                setIsNewGroup(false);
              }}
            >
              <span className="group-tab-dot" style={{ background: ['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899'][idx % 6] }} />
              {order.groupName || `Group ${idx + 1}`}
              <span className="group-tab-amount">({order.numberOfPeople}p) {cs}{order.totalAmount?.toFixed(0)}</span>
            </button>
          ))}
        </div>
      )}

      {/* New Group Setup - at the top, visible immediately */}
      {newGroupSetup}

      {/* Existing Order Items */}
      {selectedOrder && !isNewGroup && selectedOrder.items.length > 0 && (
        <div className="existing-orders">
          <h4>
            {selectedOrder.groupName} — Order #{selectedOrder.id} — {cs}
            {selectedOrder.totalAmount?.toFixed(0)}
          </h4>
          {selectedOrder.items.map((item) => (
            <div key={item.id} className="existing-item">
              <span>
                {item.itemName} {'\u00D7'} {item.quantity}
              </span>
              <span className={`existing-item-status ${item.status}`}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cart */}
      <div className="cart-header">
        <h3>{'\uD83D\uDED2'} New Items {isNewGroup && existingOrders.length > 0 ? `(${newGroupName || `Group ${existingOrders.length + 1}`})` : ''}</h3>
        {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
      </div>

      <div className="cart-items">
        {cart.length === 0 ? (
          <div className="cart-empty">
            <div className="empty-icon">{'\uD83D\uDCCB'}</div>
            <p>Add items from the menu</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.menuItemId} className="cart-item">
              <div className="cart-item-info">
                <h4>
                  {item.emoji} {item.name}
                </h4>
                <div className="cart-item-detail">
                  {cs}{item.price} {'\u00D7'} {item.quantity}
                </div>
                {item.specialInstructions && (
                  <div className="cart-item-note">
                    {'\uD83D\uDCDD'} {item.specialInstructions}
                  </div>
                )}
              </div>
              <div className="cart-item-right">
                <span className="cart-item-price">
                  {cs}{(item.price * item.quantity).toFixed(0)}
                </span>
                <button
                  className="cart-remove-btn"
                  onClick={() => removeFromCart(item.menuItemId)}
                >
                  {'\u2715'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        {cart.length > 0 && (
          <div className="cart-total">
            <span className="total-label">New Items Total</span>
            <span className="total-amount">{cs}{cartTotal.toFixed(0)}</span>
          </div>
        )}
        {selectedOrder && !isNewGroup && (
          <div
            className="cart-total"
            style={{ marginBottom: '8px' }}
          >
            <span className="total-label">{selectedOrder.groupName} Total</span>
            <span className="total-amount">
              {cs}
              {(
                (selectedOrder.totalAmount || 0) + cartTotal
              ).toFixed(0)}
            </span>
          </div>
        )}
        <div className="cart-actions">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            {'\u2190'} Back
          </button>
          {!isNewGroup && (
            <button
              className="btn-add-group"
              onClick={() => setIsNewGroup(true)}
            >
              {'\uD83D\uDC65'} Add Group
            </button>
          )}
          {cart.length > 0 && (
            <button
              className="btn-primary"
              onClick={handleSubmitOrder}
              disabled={submitting}
            >
              {submitting
                ? 'Sending...'
                : isNewGroup
                  ? '\uD83D\uDD25 Send to Kitchen'
                  : '\u2795 Add Items'}
            </button>
          )}
          {selectedOrder && !isNewGroup && cart.length === 0 && (
            <button
              className="btn-success"
              onClick={() => handleShowBill(selectedOrder)}
            >
              {'\uD83D\uDCB5'} Generate Bill
            </button>
          )}
        </div>
      </div>
    </>
  );

  const menuContent = (
    <div className="menu-section">
      {/* Search Bar */}
      <div className="menu-search">
        <span className="menu-search-icon">{'\uD83D\uDD0D'}</span>
        <input
          type="text"
          className="menu-search-input"
          placeholder="Search menu items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            className="menu-search-clear"
            onClick={() => setSearchQuery('')}
          >
            {'\u2715'}
          </button>
        )}
      </div>

      {/* Search suggestions dropdown */}
      {isSearching && searchResults.length > 0 && searchTerm.length <= 3 && (
        <div className="menu-suggestions">
          {searchResults.slice(0, 5).map(item => (
            <button
              key={item.id}
              className="suggestion-item"
              onClick={() => {
                setSearchQuery(item.name);
              }}
            >
              <span className="suggestion-emoji">{item.imageEmoji}</span>
              <span className="suggestion-name">{item.name}</span>
              <span className="suggestion-cat">{item.category}</span>
              <span className="suggestion-price">{cs}{item.price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Category tabs - hidden when searching */}
      {!isSearching && (
        <div className="menu-categories">
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {categoryEmojis[cat]} {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search status */}
      {isSearching && (
        <div className="search-status">
          {searchResults.length > 0
            ? `${searchResults.length} item${searchResults.length > 1 ? 's' : ''} found for "${searchQuery}"`
            : `No items found for "${searchQuery}"`
          }
        </div>
      )}

      {/* Desktop menu grid - with inline controls */}
      <div className="menu-grid desktop-menu-grid">
        {displayItems.map((item) => (
          <div key={item.id} className="menu-item-card">
            <div className="menu-item-header">
              <div className="menu-item-name">
                <span className="emoji">{item.imageEmoji}</span>
                <h3>{item.name}</h3>
              </div>
              <span className="menu-item-price">{cs}{item.price}</span>
            </div>
            {isSearching && (
              <span className="menu-item-category-tag">{item.category}</span>
            )}
            <p className="menu-item-desc">{item.description}</p>
            <div className="menu-item-actions">
              <div className="qty-control">
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(item.id, -1)}
                >
                  {'\u2212'}
                </button>
                <span className="qty-value">
                  {quantities[item.id] || 0}
                </span>
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(item.id, 1)}
                >
                  +
                </button>
              </div>
              <button
                className="add-to-order-btn"
                onClick={() => addToCart(item)}
                disabled={!quantities[item.id]}
              >
                Add
              </button>
            </div>
            <input
              className="special-input"
              placeholder="Special instructions..."
              value={instructions[item.id] || ''}
              onChange={(e) =>
                setInstructions((prev) => ({
                  ...prev,
                  [item.id]: e.target.value,
                }))
              }
            />
          </div>
        ))}
      </div>

      {/* Mobile menu grid - compact tappable cards */}
      <div className="menu-grid mobile-menu-grid">
        {displayItems.map((item) => {
          const inCart = cart.find(c => c.menuItemId === item.id);
          return (
            <div
              key={item.id}
              className={`mobile-menu-card ${inCart ? 'in-cart' : ''}`}
              onClick={() => openAddItemModal(item)}
            >
              <span className="mobile-menu-emoji">{item.imageEmoji}</span>
              <div className="mobile-menu-details">
                <span className="mobile-menu-name">{item.name}</span>
                <span className="mobile-menu-price">{cs}{item.price}</span>
              </div>
              {isSearching && (
                <span className="mobile-menu-cat-tag">{item.category}</span>
              )}
              {inCart && (
                <span className="mobile-menu-cart-qty">{inCart.quantity}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Navbar />

      {/* Mobile Tab Bar - only visible on mobile */}
      <div className="mobile-order-tabs">
        <button
          className={`mobile-order-tab ${mobileTab === 'menu' ? 'active' : ''}`}
          onClick={() => setMobileTab('menu')}
        >
          {'\uD83C\uDF7D\uFE0F'} Menu
        </button>
        <button
          className={`mobile-order-tab ${mobileTab === 'cart' ? 'active' : ''}`}
          onClick={() => setMobileTab('cart')}
        >
          {'\uD83D\uDED2'} Cart
          {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
        </button>
      </div>

      {/* Desktop Layout - grid with sidebar */}
      <div className="order-page desktop-order">
        {menuContent}
        <div className="order-sidebar">
          {sidebarContent}
        </div>
      </div>

      {/* Mobile Layout - tab-based full screen views */}
      <div className="order-page mobile-order">
        {mobileTab === 'menu' ? (
          <>
            {menuContent}
            {/* Floating cart button on menu tab */}
            {cartCount > 0 && (
              <button
                className="mobile-floating-cart"
                onClick={() => setMobileTab('cart')}
              >
                <span>{'\uD83D\uDED2'} View Cart</span>
                <span className="floating-cart-info">{cartCount} items {'\u2022'} {cs}{cartTotal.toFixed(0)}</span>
              </button>
            )}
          </>
        ) : (
          <div className="mobile-cart-view">
            {sidebarContent}
          </div>
        )}
      </div>

      {/* Add Item Popup Modal (mobile) */}
      {showAddItemModal && selectedMenuItem && (
        <div className="modal-overlay add-item-modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="add-item-modal" onClick={(e) => e.stopPropagation()}>
            <div className="add-item-modal-header">
              <div className="add-item-modal-emoji">{selectedMenuItem.imageEmoji}</div>
              <div className="add-item-modal-info">
                <h3>{selectedMenuItem.name}</h3>
                <p className="add-item-modal-desc">{selectedMenuItem.description}</p>
                <span className="add-item-modal-category">{selectedMenuItem.category}</span>
              </div>
              <button className="add-item-modal-close" onClick={() => setShowAddItemModal(false)}>{'\u2715'}</button>
            </div>
            <div className="add-item-modal-price-row">
              <span className="add-item-modal-price">{cs}{selectedMenuItem.price}</span>
              <span className="add-item-modal-total">Total: {cs}{(selectedMenuItem.price * modalQty).toFixed(0)}</span>
            </div>
            <div className="add-item-modal-qty">
              <span className="add-item-modal-qty-label">Quantity</span>
              <div className="add-item-modal-qty-controls">
                <button onClick={() => setModalQty(Math.max(1, modalQty - 1))}>{'\u2212'}</button>
                <span>{modalQty}</span>
                <button onClick={() => setModalQty(Math.min(20, modalQty + 1))}>+</button>
              </div>
            </div>
            <div className="add-item-modal-instructions">
              <label>Special Instructions</label>
              <input
                type="text"
                placeholder="e.g. No onions, extra spicy..."
                value={modalInstructions}
                onChange={(e) => setModalInstructions(e.target.value)}
              />
            </div>
            <button className="add-item-modal-btn" onClick={addFromModal}>
              Add {modalQty} to Cart &mdash; {cs}{(selectedMenuItem.price * modalQty).toFixed(0)}
            </button>
          </div>
        </div>
      )}

      {/* Bill / Receipt Modal */}
      {showBill && billOrder && (() => {
        const subtotal = billOrder.totalAmount || 0;
        const tax1 = subtotal * (config?.tax1Rate || 0) / 100;
        const tax2 = subtotal * (config?.tax2Rate || 0) / 100;
        const grandTotal = subtotal + tax1 + tax2;
        const orderDate = new Date(billOrder.createdAt);

        const handlePrint = () => {
          const printArea = document.getElementById('receipt-print');
          if (!printArea) return;
          const win = window.open('', '_blank', 'width=400,height=700');
          if (!win) return;
          win.document.write(`
            <html><head><title>Bill - Table ${table?.tableNumber} - ${billOrder.groupName}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 350px; margin: 0 auto; color: #000; }
              .r-center { text-align: center; }
              .r-brand { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
              .r-sub { font-size: 10px; color: #555; margin-bottom: 4px; }
              .r-line { border-top: 1px dashed #999; margin: 8px 0; }
              .r-line-bold { border-top: 2px solid #000; margin: 8px 0; }
              .r-row { display: flex; justify-content: space-between; font-size: 12px; padding: 3px 0; }
              .r-row.head { font-weight: bold; font-size: 11px; text-transform: uppercase; color: #555; }
              .r-row .r-name { flex: 1; }
              .r-row .r-qty { width: 40px; text-align: center; }
              .r-row .r-price { width: 60px; text-align: right; }
              .r-row .r-total { width: 70px; text-align: right; }
              .r-total-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
              .r-total-row.grand { font-size: 16px; font-weight: bold; padding: 6px 0; }
              .r-total-row .label { color: #555; }
              .r-info { font-size: 10px; color: #555; padding: 2px 0; }
              .r-thanks { font-size: 12px; font-weight: bold; margin-top: 12px; }
              @media print { body { padding: 10px; } }
            </style></head><body>
            ${printArea.innerHTML}
            <script>window.onload=function(){window.print();window.close();}<\/script>
            </body></html>
          `);
          win.document.close();
        };

        return (
          <div className="modal-overlay" onClick={() => setShowBill(false)}>
            <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>

              {/* Receipt content (for print) */}
              <div id="receipt-print" className="receipt">
                <div className="receipt-header">
                  <div className="r-center">
                    <div className="r-brand">{config?.logoEmoji} {config?.restaurantName || 'Restaurant'}</div>
                    <div className="r-sub">{config?.subtitle || ''}</div>
                    {(config?.address || config?.city) && (
                      <div className="r-sub">{[config?.address, config?.city].filter(Boolean).join(', ')}</div>
                    )}
                    {config?.gstin && <div className="r-sub">GSTIN: {config.gstin}</div>}
                    {config?.phone && <div className="r-sub">Ph: {config.phone}</div>}
                  </div>
                  <div className="r-line" />
                  <div className="r-row">
                    <span>Order #{billOrder.id}</span>
                    <span>Table {tablePrefix}{table?.tableNumber}</span>
                  </div>
                  <div className="r-row" style={{ fontWeight: 'bold', fontSize: '14px', padding: '6px 0' }}>
                    <span>Customer: {billOrder.groupName}</span>
                  </div>
                  <div className="r-row">
                    <span className="r-info">
                      {orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="r-info">
                      {orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {billOrder.waiterName && (
                    <div className="r-info">Staff: {billOrder.waiterName}</div>
                  )}
                  <div className="r-info">People: {billOrder.numberOfPeople}</div>
                  <div className="r-line" />
                </div>

                <div className="receipt-items">
                  <div className="r-row head">
                    <span className="r-name">Item</span>
                    <span className="r-qty">Qty</span>
                    <span className="r-price">Rate</span>
                    <span className="r-total">Amount</span>
                  </div>
                  <div className="r-line" />
                  {billOrder.items.map((item, idx) => (
                    <div key={item.id} className="r-row">
                      <span className="r-name">{idx + 1}. {item.itemName}</span>
                      <span className="r-qty">{item.quantity}</span>
                      <span className="r-price">{cs}{item.price}</span>
                      <span className="r-total">{cs}{(item.price * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                <div className="receipt-totals">
                  <div className="r-line" />
                  <div className="r-total-row">
                    <span className="label">Subtotal</span>
                    <span>{cs}{subtotal.toFixed(2)}</span>
                  </div>
                  {config?.tax1Rate ? (
                    <div className="r-total-row">
                      <span className="label">{config.tax1Label} ({config.tax1Rate}%)</span>
                      <span>{cs}{tax1.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {config?.tax2Rate ? (
                    <div className="r-total-row">
                      <span className="label">{config.tax2Label} ({config.tax2Rate}%)</span>
                      <span>{cs}{tax2.toFixed(2)}</span>
                    </div>
                  ) : null}
                  <div className="r-line-bold" />
                  <div className="r-total-row grand">
                    <span>GRAND TOTAL</span>
                    <span>{cs}{grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="r-line-bold" />
                  <div className="r-center" style={{ marginTop: '10px' }}>
                    <div className="r-info">Items: {billOrder.totalItems} | {table?.tableType} Table | {billOrder.groupName}</div>
                    <div className="r-thanks">{config?.thankYouMessage || 'Thank you!'}</div>
                    <div className="r-sub" style={{ marginTop: '6px' }}>--- {config?.receiptFooter || 'Powered by Restaurant POS'} ---</div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="receipt-actions">
                <button className="btn-secondary" onClick={() => setShowBill(false)}>
                  Close
                </button>
                <button className="btn-print" onClick={handlePrint}>
                  {'\uD83D\uDDA8\uFE0F'} Print Bill
                </button>
                <button className="btn-primary" onClick={() => handleCompleteOrder(billOrder)}>
                  {'\u2705'} Paid & Close {billOrder.groupName}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
