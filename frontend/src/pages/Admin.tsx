import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { RestaurantConfigType, CategoryType, TableTypeConfig } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';

interface TableRow {
  id: number;
  tableNumber: number;
  tableType: string;
  capacity: number;
  status: string;
}

interface MenuRow {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  imageEmoji: string;
  available: boolean;
}

const FOOD_EMOJIS = [
  '\uD83C\uDF5B', '\uD83C\uDF5A', '\uD83C\uDF57', '\uD83C\uDF56', '\uD83E\uDD69', '\uD83C\uDF72', '\uD83E\uDD58', '\uD83C\uDF5C', '\uD83E\uDD57', '\uD83E\uDD5A',
  '\uD83C\uDF73', '\uD83E\uDD53', '\uD83C\uDF2E', '\uD83C\uDF2F', '\uD83E\uDED4', '\uD83E\uDD59', '\uD83E\uDDC6', '\uD83E\uDD63', '\uD83E\uDD67', '\uD83C\uDF70',
  '\uD83C\uDF82', '\uD83C\uDF6E', '\uD83C\uDF69', '\uD83C\uDF6A', '\uD83C\uDF6B', '\uD83C\uDF6C', '\uD83C\uDF6D', '\uD83C\uDF61', '\uD83C\uDF62', '\uD83C\uDF7F',
  '\uD83E\uDD64', '\uD83E\uDDC3', '\uD83E\uDD5B', '\u2615', '\uD83C\uDF75', '\uD83E\uDDCB', '\uD83E\uDD42', '\uD83C\uDF77', '\uD83C\uDF7A', '\uD83C\uDF79',
  '\uD83E\uDDCA', '\uD83D\uDCA7', '\uD83C\uDF4B', '\uD83E\uDD6D', '\uD83C\uDF47', '\uD83C\uDF49', '\uD83E\uDED0', '\uD83C\uDF53', '\uD83C\uDF4C', '\uD83E\uDD5D',
  '\uD83C\uDF36\uFE0F', '\uD83E\uDDC5', '\uD83E\uDDC4', '\uD83E\uDD66', '\uD83E\uDD55', '\uD83C\uDF3D', '\uD83C\uDF45', '\uD83E\uDD51', '\uD83E\uDED1', '\uD83E\uDD52',
  '\uD83D\uDC1F', '\uD83E\uDD90', '\uD83E\uDD91', '\uD83E\uDD80', '\uD83D\uDC14', '\uD83D\uDC04', '\uD83D\uDC11', '\uD83D\uDC10', '\u2B50', '\uD83D\uDD25',
  '\uD83D\uDC51', '\uD83D\uDC8E', '\uD83C\uDFC6', '\uD83C\uDFAF', '\u2764\uFE0F', '\uD83C\uDF7D\uFE0F', '\uD83E\uDD44', '\uD83C\uDF74', '\uD83E\uDD62', '\uD83E\uDED5',
];

export default function Admin() {
  const { config, categories, tableTypes, getCurrencySymbol, refetch } = useRestaurantConfig();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const cs = getCurrencySymbol();
  const serverUrl = getApiBase();

  const [tab, setTab] = useState<'tables' | 'menu' | 'settings' | 'users'>('tables');
  const [tables, setTables] = useState<TableRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Table form
  const [showTableForm, setShowTableForm] = useState(false);
  const [editingTable, setEditingTable] = useState<TableRow | null>(null);
  const [tNum, setTNum] = useState('');
  const [tType, setTType] = useState('');
  const [tCap, setTCap] = useState('4');

  // Menu form
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuRow | null>(null);
  const [mName, setMName] = useState('');
  const [mCat, setMCat] = useState('');
  const [mPrice, setMPrice] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mEmoji, setMEmoji] = useState('\uD83C\uDF5B');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerFor, setEmojiPickerFor] = useState<number | null>(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState<RestaurantConfigType | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Categories management
  const [editCategories, setEditCategories] = useState<CategoryType[]>([]);
  const [catSaving, setCatSaving] = useState(false);

  // Table types management
  const [editTableTypes, setEditTableTypes] = useState<TableTypeConfig[]>([]);
  const [ttSaving, setTtSaving] = useState(false);

  // Users management
  interface UserRow { id: number; username: string; displayName: string; role: string; active: boolean; }
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newRole, setNewRole] = useState<'STAFF' | 'ADMIN'>('STAFF');
  const [newActive, setNewActive] = useState(true);
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  useEffect(() => {
    if (config) setSettingsForm({ ...config });
  }, [config]);

  useEffect(() => { setEditCategories([...categories]); }, [categories]);
  useEffect(() => { setEditTableTypes([...tableTypes]); }, [tableTypes]);

  useEffect(() => {
    if (tableTypes.length > 0 && !tType) setTType(tableTypes[0].name);
  }, [tableTypes, tType]);

  useEffect(() => {
    if (categories.length > 0 && !mCat) setMCat(categories[0].name);
  }, [categories, mCat]);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        authFetch(`${getApiBase()}/api/admin/tables`),
        authFetch(`${getApiBase()}/api/admin/menu`),
      ]);
      setTables(await tRes.json());
      setMenuItems(await mRes.json());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ===== TABLE ACTIONS =====
  const openTableForm = (table?: TableRow) => {
    if (table) {
      setEditingTable(table);
      setTNum(String(table.tableNumber));
      setTType(table.tableType);
      setTCap(String(table.capacity));
    } else {
      setEditingTable(null);
      const maxNum = tables.reduce((max, t) => Math.max(max, t.tableNumber), 0);
      setTNum(String(maxNum + 1));
      setTType(tableTypes.length > 0 ? tableTypes[0].name : 'GENERAL');
      setTCap(String(tableTypes.length > 0 ? tableTypes[0].defaultCapacity : 4));
    }
    setShowTableForm(true);
  };

  const saveTable = async () => {
    if (!tNum || !tCap) return;
    try {
      if (editingTable) {
        await authFetch(`${getApiBase()}/api/admin/tables/${editingTable.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNumber: parseInt(tNum), tableType: tType, capacity: parseInt(tCap) }),
        });
      } else {
        await authFetch(`${getApiBase()}/api/admin/tables`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableNumber: parseInt(tNum), tableType: tType, capacity: parseInt(tCap) }),
        });
      }
      setShowTableForm(false);
      fetchData();
    } catch (err) { console.error('Failed to save table:', err); }
  };

  const deleteTable = async (id: number) => {
    if (!confirm('Delete this table?')) return;
    try {
      const res = await authFetch(`${getApiBase()}/api/admin/tables/${id}`, { method: 'DELETE' });
      if (!res.ok) { const data = await res.json(); alert(data.error || 'Failed to delete'); return; }
      fetchData();
    } catch (err) { console.error('Failed to delete table:', err); }
  };

  // ===== MENU ACTIONS =====
  const openMenuForm = (item?: MenuRow) => {
    if (item) {
      setEditingMenu(item);
      setMName(item.name);
      setMCat(item.category);
      setMPrice(String(item.price));
      setMDesc(item.description || '');
      setMEmoji(item.imageEmoji || '\uD83C\uDF5B');
    } else {
      setEditingMenu(null);
      setMName('');
      setMCat(categories.length > 0 ? categories[0].name : '');
      setMPrice('');
      setMDesc('');
      setMEmoji('\uD83C\uDF5B');
    }
    setShowMenuForm(true);
    setShowEmojiPicker(false);
  };

  const saveMenu = async () => {
    if (!mName || !mPrice) return;
    try {
      if (editingMenu) {
        await authFetch(`${getApiBase()}/api/admin/menu/${editingMenu.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: mName, category: mCat, price: parseFloat(mPrice), description: mDesc, imageEmoji: mEmoji }),
        });
      } else {
        await authFetch(`${getApiBase()}/api/admin/menu`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: mName, category: mCat, price: parseFloat(mPrice), description: mDesc, imageEmoji: mEmoji }),
        });
      }
      setShowMenuForm(false);
      fetchData();
    } catch (err) { console.error('Failed to save menu item:', err); }
  };

  const deleteMenu = async (id: number) => {
    if (!confirm('Delete this menu item?')) return;
    try {
      await authFetch(`${getApiBase()}/api/admin/menu/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error('Failed to delete menu item:', err); }
  };

  const updateMenuEmoji = async (id: number, emoji: string) => {
    try {
      await authFetch(`${getApiBase()}/api/admin/menu/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageEmoji: emoji }),
      });
      setEmojiPickerFor(null);
      fetchData();
    } catch (err) { console.error('Failed to update emoji:', err); }
  };

  const toggleAvailable = async (item: MenuRow) => {
    try {
      await authFetch(`${getApiBase()}/api/admin/menu/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !item.available }),
      });
      fetchData();
    } catch (err) { console.error('Failed to toggle availability:', err); }
  };

  // ===== SETTINGS ACTIONS =====
  const saveSettings = async () => {
    if (!settingsForm) return;
    setSettingsSaving(true);
    setSettingsMsg('');
    try {
      await authFetch(`${getApiBase()}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm),
      });
      await refetch();
      setSettingsMsg('Settings saved!');
      setTimeout(() => setSettingsMsg(''), 3000);
    } catch (err) { console.error('Failed to save settings:', err); }
    finally { setSettingsSaving(false); }
  };

  const saveCategories = async () => {
    setCatSaving(true);
    try {
      // Delete old, create new
      const existing = await (await authFetch(`${getApiBase()}/api/config/categories`)).json();
      for (const c of existing) {
        await authFetch(`${getApiBase()}/api/config/categories/${c.id}`, { method: 'DELETE' });
      }
      for (const cat of editCategories) {
        await authFetch(`${getApiBase()}/api/config/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, emoji: cat.emoji, displayOrder: cat.displayOrder }),
        });
      }
      await refetch();
    } catch (err) { console.error('Failed to save categories:', err); }
    finally { setCatSaving(false); }
  };

  const saveTableTypes = async () => {
    setTtSaving(true);
    try {
      const existing = await (await authFetch(`${getApiBase()}/api/config/table-types`)).json();
      for (const tt of existing) {
        await authFetch(`${getApiBase()}/api/config/table-types/${tt.id}`, { method: 'DELETE' });
      }
      for (const tt of editTableTypes) {
        await authFetch(`${getApiBase()}/api/config/table-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tt.name, labelPrefix: tt.labelPrefix, defaultCapacity: tt.defaultCapacity }),
        });
      }
      await refetch();
    } catch (err) { console.error('Failed to save table types:', err); }
    finally { setTtSaving(false); }
  };

  // ===== USER ACTIONS =====
  const fetchUsers = useCallback(async () => {
    try {
      const res = await authFetch(`${getApiBase()}/api/auth/users`);
      if (res.ok) setUsers(await res.json());
    } catch (err) { console.error('Failed to fetch users:', err); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openUserForm = (user?: UserRow) => {
    setUserError('');
    setUserSuccess('');
    if (user) {
      setEditingUser(user);
      setNewDisplayName(user.displayName);
      setNewUsername(user.username);
      setNewPassword('');
      setNewRole(user.role as 'STAFF' | 'ADMIN');
      setNewActive(user.active);
    } else {
      setEditingUser(null);
      setNewDisplayName('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('STAFF');
      setNewActive(true);
    }
    setShowUserForm(true);
  };

  const saveUser = async () => {
    setUserError('');
    setUserSuccess('');

    if (editingUser) {
      // Update existing user
      if (!newDisplayName.trim()) {
        setUserError('Display name is required');
        return;
      }
      if (newPassword && newPassword.length < 4) {
        setUserError('Password must be at least 4 characters');
        return;
      }
      try {
        const body: Record<string, unknown> = {
          displayName: newDisplayName.trim(),
          role: newRole,
          active: newActive,
        };
        if (newPassword) body.password = newPassword;

        const res = await authFetch(`${getApiBase()}/api/auth/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUserError(data.error || 'Failed to update user');
          return;
        }
        setUserSuccess(`User "${editingUser.username}" updated successfully!`);
        setShowUserForm(false);
        fetchUsers();
        setTimeout(() => setUserSuccess(''), 3000);
      } catch (err) {
        setUserError('Failed to update user');
      }
    } else {
      // Create new user
      if (!newUsername.trim() || !newPassword.trim() || !newDisplayName.trim()) {
        setUserError('Please fill all fields');
        return;
      }
      if (newPassword.length < 4) {
        setUserError('Password must be at least 4 characters');
        return;
      }
      try {
        const res = await authFetch(`${getApiBase()}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: newUsername.trim(),
            password: newPassword,
            displayName: newDisplayName.trim(),
            role: newRole,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setUserError(data.error || 'Failed to create user');
          return;
        }
        setUserSuccess(`${newRole} account "${newUsername}" created successfully!`);
        setShowUserForm(false);
        fetchUsers();
        setTimeout(() => setUserSuccess(''), 3000);
      } catch (err) {
        setUserError('Failed to create user');
      }
    }
  };

  const deleteUser = async (user: UserRow) => {
    if (!confirm(`Delete user "${user.displayName}" (@${user.username})? This cannot be undone.`)) return;
    try {
      const res = await authFetch(`${getApiBase()}/api/auth/users/${user.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete user');
        return;
      }
      setUserSuccess(`User "${user.username}" deleted.`);
      fetchUsers();
      setTimeout(() => setUserSuccess(''), 3000);
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const getTablePrefix = (type: string) => {
    const tt = tableTypes.find(t => t.name === type);
    return tt?.labelPrefix || 'T';
  };

  const categoryNames = categories.map(c => c.name);

  if (loading) {
    return (
      <><Navbar /><div className="loading-container"><div className="loading-spinner" /><p>Loading...</p></div></>
    );
  }

  return (
    <>
      <Navbar />
      <div className="admin-page">
        <div className="admin-header">
          <h1 className="admin-title">Settings</h1>
          <div className="admin-tabs">
            <button className={`admin-tab ${tab === 'tables' ? 'active' : ''}`} onClick={() => setTab('tables')}>
              {'\uD83E\uDE91'} Tables & Seats
            </button>
            <button className={`admin-tab ${tab === 'menu' ? 'active' : ''}`} onClick={() => setTab('menu')}>
              {'\uD83D\uDCCB'} Menu Items
            </button>
            <button className={`admin-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
              {'\uD83D\uDC65'} Users
            </button>
            <button className={`admin-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
              {'\u2699\uFE0F'} Settings
            </button>
          </div>
        </div>

        {/* ===== TABLES TAB ===== */}
        {tab === 'tables' && (
          <div className="admin-section">
            <div className="admin-section-top">
              <h2>Manage Tables ({tables.length})</h2>
              <button className="admin-add-btn" onClick={() => openTableForm()}>+ Add Table</button>
            </div>
            <div className="admin-table">
              <div className="admin-table-head">
                <span>Table #</span><span>Type</span><span>Seats</span><span>Status</span><span>Actions</span>
              </div>
              {tables.map((t) => (
                <div key={t.id} className="admin-table-row">
                  <span className="admin-table-num">{getTablePrefix(t.tableType)}{t.tableNumber}</span>
                  <span>
                    <span className={`admin-type-badge ${t.tableType.toLowerCase()}`}>{t.tableType}</span>
                  </span>
                  <span className={`tcard-badge ${t.status}`}>
                    {t.status === 'WAITING_FOR_BILL' ? 'Bill Due' : t.status}
                  </span>
                  <span className="admin-seats-display">
                    {Array.from({ length: t.capacity }).map((_, i) => (
                      <span key={i} className="admin-seat-dot">{'\uD83E\uDE91'}</span>
                    ))}
                    <span className="admin-seat-count">{t.capacity} seats</span>
                  </span>
                  <span className="admin-actions">
                    <button className="admin-edit-btn" onClick={() => openTableForm(t)}>Edit</button>
                    <button className="admin-del-btn" onClick={() => deleteTable(t.id)}>Delete</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MENU TAB ===== */}
        {tab === 'menu' && (
          <div className="admin-section">
            <div className="admin-section-top">
              <h2>Manage Menu ({menuItems.length} items)</h2>
              <button className="admin-add-btn" onClick={() => openMenuForm()}>+ Add Item</button>
            </div>
            {categoryNames.map((cat) => {
              const items = menuItems.filter((m) => m.category === cat);
              if (items.length === 0) return null;
              return (
                <div key={cat} className="admin-menu-category">
                  <h3 className="admin-cat-label">{cat} ({items.length})</h3>
                  <div className="admin-menu-grid">
                    {items.map((item) => (
                      <div key={item.id} className={`admin-menu-card ${!item.available ? 'disabled' : ''}`}>
                        <div className="admin-menu-card-top">
                          <div className="admin-emoji-btn" onClick={() => setEmojiPickerFor(emojiPickerFor === item.id ? null : item.id)}>
                            <span className="admin-emoji">{item.imageEmoji}</span>
                            <span className="admin-emoji-edit">change</span>
                          </div>
                          <div className="admin-menu-info">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                          </div>
                          <div className="admin-menu-price">{cs}{item.price}</div>
                        </div>
                        {emojiPickerFor === item.id && (
                          <div className="emoji-picker">
                            {FOOD_EMOJIS.map((e) => (
                              <button key={e} className={`emoji-option ${e === item.imageEmoji ? 'selected' : ''}`}
                                onClick={() => updateMenuEmoji(item.id, e)}>{e}</button>
                            ))}
                          </div>
                        )}
                        <div className="admin-menu-card-actions">
                          <label className="admin-toggle">
                            <input type="checkbox" checked={item.available} onChange={() => toggleAvailable(item)} />
                            <span className="admin-toggle-slider" />
                            <span className="admin-toggle-label">{item.available ? 'Available' : 'Unavailable'}</span>
                          </label>
                          <div>
                            <button className="admin-edit-btn" onClick={() => openMenuForm(item)}>Edit</button>
                            <button className="admin-del-btn" onClick={() => deleteMenu(item.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Show uncategorized items */}
            {(() => {
              const uncategorized = menuItems.filter(m => !categoryNames.includes(m.category));
              if (uncategorized.length === 0) return null;
              return (
                <div className="admin-menu-category">
                  <h3 className="admin-cat-label">UNCATEGORIZED ({uncategorized.length})</h3>
                  <div className="admin-menu-grid">
                    {uncategorized.map((item) => (
                      <div key={item.id} className={`admin-menu-card ${!item.available ? 'disabled' : ''}`}>
                        <div className="admin-menu-card-top">
                          <div className="admin-emoji-btn" onClick={() => setEmojiPickerFor(emojiPickerFor === item.id ? null : item.id)}>
                            <span className="admin-emoji">{item.imageEmoji}</span>
                            <span className="admin-emoji-edit">change</span>
                          </div>
                          <div className="admin-menu-info">
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                          </div>
                          <div className="admin-menu-price">{cs}{item.price}</div>
                        </div>
                        <div className="admin-menu-card-actions">
                          <label className="admin-toggle">
                            <input type="checkbox" checked={item.available} onChange={() => toggleAvailable(item)} />
                            <span className="admin-toggle-slider" />
                            <span className="admin-toggle-label">{item.available ? 'Available' : 'Unavailable'}</span>
                          </label>
                          <div>
                            <button className="admin-edit-btn" onClick={() => openMenuForm(item)}>Edit</button>
                            <button className="admin-del-btn" onClick={() => deleteMenu(item.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ===== USERS TAB ===== */}
        {tab === 'users' && (
          <div className="admin-section">
            <div className="admin-section-top">
              <h2>{'\uD83D\uDC65'} Manage Users ({users.length})</h2>
              <button className="admin-add-btn" onClick={() => openUserForm()}>+ Add Staff</button>
            </div>

            {userSuccess && <div className="auth-success" style={{ marginBottom: '12px' }}>{userSuccess}</div>}

            <div className="admin-table">
              <div className="admin-table-head">
                <span>Name</span><span>Username</span><span>Role</span><span>Status</span><span>Actions</span>
              </div>
              {users.map((u) => (
                <div key={u.id} className="admin-table-row">
                  <span style={{ fontWeight: 600 }}>{u.displayName}</span>
                  <span style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
                  <span>
                    <span className={`nav-role-badge ${u.role}`}>{u.role}</span>
                  </span>
                  <span>
                    <span className={`tcard-badge ${u.active ? 'AVAILABLE' : 'CLEANING'}`}>
                      {u.active ? 'Active' : 'Inactive'}
                    </span>
                  </span>
                  <span className="admin-actions">
                    <button className="admin-edit-btn" onClick={() => openUserForm(u)}>Edit</button>
                  </span>
                </div>
              ))}
              {users.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===== SETTINGS TAB ===== */}
        {tab === 'settings' && settingsForm && (
          <div className="admin-section">
            {/* Branding */}
            <div className="settings-card">
              <h3>Branding</h3>
              <div className="form-row">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Restaurant Name</label>
                  <input className="form-input" value={settingsForm.restaurantName}
                    onChange={e => setSettingsForm({ ...settingsForm, restaurantName: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
                <div className="form-group">
                  <label>Currency</label>
                  <input className="form-input" value={settingsForm.currencySymbol} style={{ width: '80px' }}
                    onChange={e => setSettingsForm({ ...settingsForm, currencySymbol: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
              </div>
              <div className="form-group">
                <label>Subtitle / Tagline</label>
                <input className="form-input" value={settingsForm.subtitle}
                  onChange={e => setSettingsForm({ ...settingsForm, subtitle: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
              <div className="form-group">
                <label>Logo Emoji</label>
                <input className="form-input" value={settingsForm.logoEmoji} style={{ width: '80px' }}
                  onChange={e => setSettingsForm({ ...settingsForm, logoEmoji: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
            </div>

            {/* Contact */}
            <div className="settings-card">
              <h3>Contact & Legal</h3>
              <div className="form-group">
                <label>Owner Name</label>
                <input className="form-input" value={settingsForm.ownerName}
                  onChange={e => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input className="form-input" value={settingsForm.address}
                  onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input className="form-input" value={settingsForm.city}
                    onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-input" value={settingsForm.phone}
                    onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
              </div>
              <div className="form-group">
                <label>GSTIN / Tax ID</label>
                <input className="form-input" value={settingsForm.gstin}
                  onChange={e => setSettingsForm({ ...settingsForm, gstin: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
            </div>

            {/* Tax */}
            <div className="settings-card">
              <h3>Tax Configuration</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Tax 1 Label</label>
                  <input className="form-input" value={settingsForm.tax1Label}
                    onChange={e => setSettingsForm({ ...settingsForm, tax1Label: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
                <div className="form-group">
                  <label>Tax 1 Rate (%)</label>
                  <input type="number" step="0.1" className="form-input" value={settingsForm.tax1Rate}
                    onChange={e => setSettingsForm({ ...settingsForm, tax1Rate: parseFloat(e.target.value) || 0 })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tax 2 Label</label>
                  <input className="form-input" value={settingsForm.tax2Label}
                    onChange={e => setSettingsForm({ ...settingsForm, tax2Label: e.target.value })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
                <div className="form-group">
                  <label>Tax 2 Rate (%)</label>
                  <input type="number" step="0.1" className="form-input" value={settingsForm.tax2Rate}
                    onChange={e => setSettingsForm({ ...settingsForm, tax2Rate: parseFloat(e.target.value) || 0 })}
                    onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div className="settings-card">
              <h3>Receipt</h3>
              <div className="form-group">
                <label>Thank You Message</label>
                <input className="form-input" value={settingsForm.thankYouMessage}
                  onChange={e => setSettingsForm({ ...settingsForm, thankYouMessage: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
              <div className="form-group">
                <label>Receipt Footer</label>
                <input className="form-input" value={settingsForm.receiptFooter}
                  onChange={e => setSettingsForm({ ...settingsForm, receiptFooter: e.target.value })}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
              <button className="btn-primary" onClick={saveSettings} disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Settings'}
              </button>
              {settingsMsg && <span style={{ color: '#22c55e' }}>{settingsMsg}</span>}
            </div>

            {/* Categories Management */}
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Menu Categories</h3>
              {editCategories.map((cat, idx) => (
                <div key={cat.id} className="setup-list-item">
                  <div className="setup-field" style={{ width: '50px' }}>
                    <label className="setup-field-label">Icon</label>
                    <input className="form-input" style={{ width: '50px', textAlign: 'center' }} value={cat.emoji}
                      onChange={e => { const c = [...editCategories]; c[idx] = { ...c[idx], emoji: e.target.value }; setEditCategories(c); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <div className="setup-field" style={{ flex: 1 }}>
                    <label className="setup-field-label">Category Name</label>
                    <input className="form-input" value={cat.name}
                      onChange={e => { const c = [...editCategories]; c[idx] = { ...c[idx], name: e.target.value }; setEditCategories(c); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <div className="setup-field" style={{ width: '70px' }}>
                    <label className="setup-field-label">Order</label>
                    <input type="number" className="form-input" style={{ width: '70px' }} value={cat.displayOrder}
                      onChange={e => { const c = [...editCategories]; c[idx] = { ...c[idx], displayOrder: parseInt(e.target.value) || 0 }; setEditCategories(c); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <button className="admin-del-btn" onClick={() => setEditCategories(editCategories.filter((_, i) => i !== idx))}>Delete</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="admin-add-btn" onClick={() => {
                  const order = editCategories.length > 0 ? Math.max(...editCategories.map(c => c.displayOrder)) + 1 : 1;
                  setEditCategories([...editCategories, { id: Date.now(), name: '', emoji: '\uD83C\uDF7D\uFE0F', displayOrder: order }]);
                }}>+ Add Category</button>
                <button className="btn-primary" onClick={saveCategories} disabled={catSaving}>
                  {catSaving ? 'Saving...' : 'Save Categories'}
                </button>
              </div>
            </div>

            {/* Table Types Management */}
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Table Types</h3>
              {editTableTypes.map((tt, idx) => (
                <div key={tt.id} className="setup-list-item">
                  <div className="setup-field" style={{ flex: 1 }}>
                    <label className="setup-field-label">Name</label>
                    <input className="form-input" value={tt.name} placeholder="Type name"
                      onChange={e => { const t = [...editTableTypes]; t[idx] = { ...t[idx], name: e.target.value }; setEditTableTypes(t); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <div className="setup-field" style={{ width: '80px' }}>
                    <label className="setup-field-label">Prefix</label>
                    <input className="form-input" value={tt.labelPrefix} placeholder="Prefix"
                      onChange={e => { const t = [...editTableTypes]; t[idx] = { ...t[idx], labelPrefix: e.target.value }; setEditTableTypes(t); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <div className="setup-field" style={{ width: '90px' }}>
                    <label className="setup-field-label">Seats</label>
                    <input type="number" className="form-input" value={tt.defaultCapacity} placeholder="Seats"
                      onChange={e => { const t = [...editTableTypes]; t[idx] = { ...t[idx], defaultCapacity: parseInt(e.target.value) || 2 }; setEditTableTypes(t); }}
                      onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)} />
                  </div>
                  <button className="admin-del-btn" onClick={() => setEditTableTypes(editTableTypes.filter((_, i) => i !== idx))}>Delete</button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="admin-add-btn" onClick={() => {
                  setEditTableTypes([...editTableTypes, { id: Date.now(), name: '', labelPrefix: '', defaultCapacity: 4 }]);
                }}>+ Add Table Type</button>
                <button className="btn-primary" onClick={saveTableTypes} disabled={ttSaving}>
                  {ttSaving ? 'Saving...' : 'Save Table Types'}
                </button>
              </div>
            </div>

            {/* Account & Connection */}
            <div className="settings-card" style={{ marginTop: '24px' }}>
              <h3>Account & Connection</h3>
              {serverUrl && (
                <div style={{ marginBottom: '12px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Connected to: <strong style={{ color: 'var(--text-primary)' }}>{serverUrl}</strong>
                  </p>
                  <button
                    className="btn-secondary"
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                    onClick={() => {
                      if (confirm('Disconnect from server? You will need to enter the server address again.')) {
                        localStorage.removeItem('serverUrl');
                        window.location.reload();
                      }
                    }}
                  >
                    {'\uD83D\uDD17'} Disconnect from Server
                  </button>
                </div>
              )}
              <button
                style={{
                  width: '100%', padding: '12px', fontSize: '0.9rem',
                  background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600
                }}
                onClick={() => { logout(); navigate('/login'); }}
              >
                {'\uD83D\uDEAA'} Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ===== TABLE FORM MODAL ===== */}
      {showTableForm && (
        <div className="modal-overlay" onClick={() => setShowTableForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Table Number</label>
                <input type="number" className="form-input" value={tNum} onChange={(e) => setTNum(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <div className="form-toggle-group">
                  {tableTypes.map(tt => (
                    <button key={tt.name}
                      className={`form-toggle ${tType === tt.name ? 'active' : ''}`}
                      onClick={() => { setTType(tt.name); setTCap(String(tt.defaultCapacity)); }}>
                      {tt.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Number of Seats</label>
                <input type="number" className="form-input" value={tCap} onChange={(e) => setTCap(e.target.value)} min="1" max="20" />
                <div className="form-seats-preview">
                  {Array.from({ length: Math.min(parseInt(tCap) || 0, 20) }).map((_, i) => (
                    <span key={i} className="preview-seat">{'\uD83E\uDE91'}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowTableForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveTable}>{editingTable ? 'Save Changes' : 'Add Table'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MENU FORM MODAL ===== */}
      {showMenuForm && (
        <div className="modal-overlay" onClick={() => setShowMenuForm(false)}>
          <div className="modal-content modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMenu ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group" style={{ flex: 0 }}>
                  <label>Icon</label>
                  <button className="form-emoji-select" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <span className="form-emoji-big">{mEmoji}</span>
                    <span className="form-emoji-hint">Tap to change</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="emoji-picker form-emoji-picker">
                      {FOOD_EMOJIS.map((e) => (
                        <button key={e} className={`emoji-option ${e === mEmoji ? 'selected' : ''}`}
                          onClick={() => { setMEmoji(e); setShowEmojiPicker(false); }}>{e}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label>Name</label>
                    <input className="form-input" value={mName} onChange={(e) => setMName(e.target.value)} placeholder="e.g. Chicken Biryani" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <select className="form-input" value={mCat} onChange={(e) => setMCat(e.target.value)}>
                        {categoryNames.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Price ({cs})</label>
                      <input type="number" className="form-input" value={mPrice} onChange={(e) => setMPrice(e.target.value)} placeholder="250" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={mDesc} onChange={(e) => setMDesc(e.target.value)} placeholder="Short description of the item..." />
              </div>
              <div className="form-preview">
                <span className="form-preview-label">Preview</span>
                <div className="menu-item-card" style={{ margin: 0 }}>
                  <div className="menu-item-header">
                    <div className="menu-item-name">
                      <span className="emoji">{mEmoji}</span>
                      <h3>{mName || 'Item Name'}</h3>
                    </div>
                    <span className="menu-item-price">{cs}{mPrice || '0'}</span>
                  </div>
                  <p className="menu-item-desc">{mDesc || 'Item description'}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowMenuForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveMenu}>{editingMenu ? 'Save Changes' : 'Add Item'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== USER FORM MODAL ===== */}
      {showUserForm && (
        <div className="modal-overlay" onClick={() => setShowUserForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? '\u270F\uFE0F Edit User' : '\uD83D\uDC65 Create New User'}</h2>
            </div>
            <div className="modal-body">
              {userError && <div className="auth-error" style={{ marginBottom: '12px' }}>{userError}</div>}
              <div className="form-group">
                <label>Display Name</label>
                <input
                  className="form-input"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Waiter Raju"
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-input"
                  value={newUsername}
                  onChange={e => { setNewUsername(e.target.value); setUserError(''); }}
                  placeholder="e.g. raju"
                  autoComplete="off"
                  disabled={!!editingUser}
                  style={editingUser ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                />
                {editingUser && <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>Username cannot be changed</p>}
              </div>
              <div className="form-group">
                <label>{editingUser ? 'New Password (leave empty to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={editingUser ? 'Leave empty to keep current' : 'Min 4 characters'}
                  autoComplete="new-password"
                  onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300)}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <div className="auth-role-selector">
                  <button className={`auth-role-btn ${newRole === 'STAFF' ? 'active' : ''}`} onClick={() => setNewRole('STAFF')}>
                    {'\uD83D\uDC68\u200D\uD83C\uDF73'} Staff
                  </button>
                  <button className={`auth-role-btn ${newRole === 'ADMIN' ? 'active' : ''}`} onClick={() => setNewRole('ADMIN')}>
                    {'\uD83D\uDD10'} Admin
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                  {newRole === 'STAFF' ? 'Staff can take orders and view kitchen. Cannot access settings.' : 'Admin has full access including settings and user management.'}
                </p>
              </div>
              {editingUser && (
                <div className="form-group">
                  <label>Status</label>
                  <div className="auth-role-selector">
                    <button className={`auth-role-btn ${newActive ? 'active' : ''}`} onClick={() => setNewActive(true)}>
                      Active
                    </button>
                    <button className={`auth-role-btn ${!newActive ? 'active' : ''}`} style={!newActive ? { background: '#ef4444', borderColor: '#ef4444' } : {}} onClick={() => setNewActive(false)}>
                      Inactive
                    </button>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px' }}>
                    Inactive users cannot log in.
                  </p>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: editingUser ? 'space-between' : 'flex-end' }}>
              {editingUser && (
                <button className="admin-del-btn" onClick={() => { setShowUserForm(false); deleteUser(editingUser); }}>Delete User</button>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                <button className="btn-primary" onClick={saveUser}>{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
