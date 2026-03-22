import { useState, useEffect } from 'react';
import { useRestaurantConfig } from '../hooks/useRestaurantConfig';
import { useAuth } from '../hooks/useAuth';
import { CategoryType, TableTypeConfig } from '../types/types';
import { getApiBase } from '../config';
import { authFetch } from '../utils/api';

const LOGO_EMOJIS = [
  '\uD83C\uDF7D\uFE0F', '\uD83C\uDF5B', '\uD83C\uDF54', '\uD83C\uDF55', '\uD83C\uDF2E', '\uD83C\uDF63',
  '\uD83C\uDF5C', '\uD83E\uDD58', '\uD83E\uDD69', '\uD83C\uDF73', '\u2615', '\uD83C\uDF70',
  '\uD83C\uDF5E', '\uD83E\uDD57', '\uD83C\uDF56', '\uD83C\uDF57', '\uD83E\uDD6B', '\uD83C\uDF5F',
  '\uD83C\uDF2F', '\uD83E\uDDC1', '\uD83C\uDF69', '\uD83C\uDF82', '\uD83C\uDF53', '\uD83C\uDF4D',
];

const FOOD_EMOJIS = [
  '\uD83C\uDF5B', '\uD83C\uDF5C', '\uD83C\uDF54', '\uD83C\uDF55', '\uD83C\uDF2E', '\uD83C\uDF2F',
  '\uD83C\uDF63', '\uD83C\uDF5F', '\uD83C\uDF57', '\uD83C\uDF56', '\uD83E\uDD69', '\uD83C\uDF73',
  '\uD83E\uDD58', '\uD83E\uDD57', '\uD83C\uDF72', '\uD83C\uDF5E', '\uD83E\uDDC1', '\uD83C\uDF70',
  '\uD83C\uDF69', '\uD83C\uDF82', '\u2615', '\uD83E\uDD64', '\uD83C\uDF7A', '\uD83E\uDD5A',
];

interface MenuItemSetup {
  id: number;
  name: string;
  category: string;
  price: string;
  description: string;
  emoji: string;
}

const TOTAL_STEPS = 6;

export default function SetupWizard() {
  const { config, categories: initCategories, tableTypes: initTableTypes, refetch } = useRestaurantConfig();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Restaurant Info
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [logoEmoji, setLogoEmoji] = useState('\uD83C\uDF7D\uFE0F');
  const [currency, setCurrency] = useState('\u20B9');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [gstin, setGstin] = useState('');

  // Step 2: Tax
  const [tax1Label, setTax1Label] = useState('CGST');
  const [tax1Rate, setTax1Rate] = useState('2.5');
  const [tax2Label, setTax2Label] = useState('SGST');
  const [tax2Rate, setTax2Rate] = useState('2.5');
  const [thankYouMsg, setThankYouMsg] = useState('Thank you! Visit again \uD83D\uDE4F');
  const [receiptFooter, setReceiptFooter] = useState('');

  // Step 3: Categories
  const [categories, setCategories] = useState<CategoryType[]>([]);

  // Step 4: Menu Items
  const [menuItems, setMenuItems] = useState<MenuItemSetup[]>([]);

  // Step 5: Table Types + counts
  const [tableTypes, setTableTypes] = useState<TableTypeConfig[]>([]);
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});

  // Step 6: Confirm
  const [keepSampleData, setKeepSampleData] = useState(true);

  useEffect(() => {
    if (config) {
      setName(config.restaurantName || '');
      setSubtitle(config.subtitle || '');
      setLogoEmoji(config.logoEmoji || '\uD83C\uDF7D\uFE0F');
      setCurrency(config.currencySymbol || '\u20B9');
      setAddress(config.address || '');
      setCity(config.city || '');
      setPhone(config.phone || '');
      setOwnerName(config.ownerName || '');
      setGstin(config.gstin || '');
      setTax1Label(config.tax1Label || 'CGST');
      setTax1Rate(String(config.tax1Rate || 2.5));
      setTax2Label(config.tax2Label || 'SGST');
      setTax2Rate(String(config.tax2Rate || 2.5));
      setThankYouMsg(config.thankYouMessage || '');
      setReceiptFooter(config.receiptFooter || '');
    }
  }, [config]);

  useEffect(() => { setCategories(initCategories); }, [initCategories]);
  useEffect(() => {
    setTableTypes(initTableTypes);
    const counts: Record<string, number> = {};
    initTableTypes.forEach(tt => { counts[tt.name] = tt.name === 'FAMILY' ? 5 : 10; });
    setTableCounts(counts);
  }, [initTableTypes]);

  // Generate default menu items when moving to step 4
  useEffect(() => {
    if (step === 4 && menuItems.length === 0 && categories.length > 0) {
      const defaults: MenuItemSetup[] = [];
      const sampleItems: Record<string, { name: string; price: string; desc: string; emoji: string }[]> = {
        'STARTERS': [
          { name: 'Paneer Tikka', price: '220', desc: 'Grilled cottage cheese', emoji: '\uD83E\uDDC0' },
          { name: 'Veg Spring Roll', price: '180', desc: 'Crispy rolls with veggie filling', emoji: '\uD83C\uDF2F' },
          { name: 'Chicken 65', price: '280', desc: 'Spicy deep-fried chicken', emoji: '\uD83C\uDF57' },
        ],
        'MAIN COURSE': [
          { name: 'Butter Chicken', price: '350', desc: 'Creamy tomato chicken curry', emoji: '\uD83C\uDF5B' },
          { name: 'Veg Biryani', price: '250', desc: 'Fragrant rice with vegetables', emoji: '\uD83C\uDF5A' },
          { name: 'Dal Makhani', price: '220', desc: 'Creamy black lentils', emoji: '\uD83C\uDF72' },
        ],
        'BEVERAGES': [
          { name: 'Masala Chai', price: '60', desc: 'Indian spiced tea', emoji: '\u2615' },
          { name: 'Mango Lassi', price: '120', desc: 'Sweet yogurt drink', emoji: '\uD83E\uDD64' },
          { name: 'Fresh Lime Soda', price: '80', desc: 'Lime with soda water', emoji: '\uD83C\uDF4B' },
        ],
        'DESSERTS': [
          { name: 'Gulab Jamun', price: '120', desc: 'Sweet milk dumplings', emoji: '\uD83C\uDF6A' },
          { name: 'Rasmalai', price: '150', desc: 'Soft paneer in sweet milk', emoji: '\uD83C\uDF70' },
        ],
      };

      let id = 1;
      for (const cat of categories) {
        const items = sampleItems[cat.name] || [
          { name: `${cat.name} Item 1`, price: '200', desc: 'Delicious dish', emoji: '\uD83C\uDF7D\uFE0F' },
        ];
        for (const item of items) {
          defaults.push({ id: id++, name: item.name, category: cat.name, price: item.price, description: item.desc, emoji: item.emoji });
        }
      }
      setMenuItems(defaults);
    }
  }, [step, categories]);

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Save config
      await authFetch(`${getApiBase()}/api/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: name,
          subtitle,
          logoEmoji,
          currencySymbol: currency,
          address,
          city,
          phone,
          ownerName,
          gstin,
          tax1Label,
          tax1Rate: parseFloat(tax1Rate),
          tax2Label,
          tax2Rate: parseFloat(tax2Rate),
          thankYouMessage: thankYouMsg,
          receiptFooter: receiptFooter || `Powered by ${name} POS`,
          setupComplete: true,
        }),
      });

      // Save categories
      const existingCats = await (await authFetch(`${getApiBase()}/api/config/categories`)).json();
      for (const c of existingCats) {
        await authFetch(`${getApiBase()}/api/config/categories/${c.id}`, { method: 'DELETE' });
      }
      for (const cat of categories) {
        await authFetch(`${getApiBase()}/api/config/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: cat.name, emoji: cat.emoji, displayOrder: cat.displayOrder }),
        });
      }

      // Save table types
      const existingTTs = await (await authFetch(`${getApiBase()}/api/config/table-types`)).json();
      for (const tt of existingTTs) {
        await authFetch(`${getApiBase()}/api/config/table-types/${tt.id}`, { method: 'DELETE' });
      }
      for (const tt of tableTypes) {
        await authFetch(`${getApiBase()}/api/config/table-types`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tt.name, labelPrefix: tt.labelPrefix, defaultCapacity: tt.defaultCapacity }),
        });
      }

      // Delete existing tables and create new
      const existingTables = await (await authFetch(`${getApiBase()}/api/admin/tables`)).json();
      for (const t of existingTables) {
        try { await authFetch(`${getApiBase()}/api/admin/tables/${t.id}`, { method: 'DELETE' }); } catch {}
      }
      let tableNum = 1;
      for (const tt of tableTypes) {
        const count = tableCounts[tt.name] || 0;
        for (let i = 0; i < count; i++) {
          await authFetch(`${getApiBase()}/api/admin/tables`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNumber: tableNum, tableType: tt.name, capacity: tt.defaultCapacity }),
          });
          tableNum++;
        }
      }

      // Delete existing menu items and create from setup
      const existingMenu = await (await authFetch(`${getApiBase()}/api/admin/menu`)).json();
      for (const m of existingMenu) {
        try { await authFetch(`${getApiBase()}/api/admin/menu/${m.id}`, { method: 'DELETE' }); } catch {}
      }

      if (keepSampleData) {
        for (const item of menuItems) {
          if (item.name.trim()) {
            await authFetch(`${getApiBase()}/api/admin/menu`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: item.name,
                category: item.category,
                price: parseFloat(item.price) || 0,
                description: item.description,
                imageEmoji: item.emoji,
              }),
            });
          }
        }
      }

      await refetch();
    } catch (err) {
      console.error('Setup failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const order = categories.length > 0 ? Math.max(...categories.map(c => c.displayOrder)) + 1 : 1;
    setCategories([...categories, { id: Date.now(), name: '', emoji: '\uD83C\uDF7D\uFE0F', displayOrder: order }]);
  };

  const updateCategory = (idx: number, field: string, value: string | number) => {
    setCategories(categories.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const removeCategory = (idx: number) => {
    setCategories(categories.filter((_, i) => i !== idx));
  };

  const addMenuItem = () => {
    const cat = categories.length > 0 ? categories[0].name : '';
    setMenuItems([...menuItems, { id: Date.now(), name: '', category: cat, price: '', description: '', emoji: '\uD83C\uDF7D\uFE0F' }]);
  };

  const updateMenuItem = (idx: number, field: string, value: string) => {
    setMenuItems(menuItems.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const removeMenuItem = (idx: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== idx));
  };

  const addTableType = () => {
    setTableTypes([...tableTypes, { id: Date.now(), name: '', labelPrefix: '', defaultCapacity: 4 }]);
  };

  const updateTableType = (idx: number, field: string, value: string | number) => {
    setTableTypes(tableTypes.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const removeTableType = (idx: number) => {
    setTableTypes(tableTypes.filter((_, i) => i !== idx));
  };

  return (
    <div className="setup-wizard">
      <div className="setup-container">
        <div className="setup-header">
          <div className="setup-logo">{logoEmoji}</div>
          <h1>Restaurant Setup</h1>
          <p>Configure your restaurant in a few simple steps</p>
          <div className="setup-steps">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(s => (
              <div key={s} className={`setup-step-dot ${step === s ? 'active' : step > s ? 'done' : ''}`}>
                {step > s ? '\u2713' : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Restaurant Info */}
        {step === 1 && (
          <div className="setup-step-content">
            <h2>Restaurant Information</h2>
            <div className="form-group">
              <label>Restaurant Name *</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Biryani House" />
            </div>
            <div className="form-group">
              <label>Subtitle / Tagline</label>
              <input className="form-input" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Restaurant Management System" />
            </div>
            <div className="form-group">
              <label>Logo Emoji</label>
              <div className="emoji-picker-inline">
                {LOGO_EMOJIS.map(e => (
                  <button key={e} className={`emoji-option ${e === logoEmoji ? 'selected' : ''}`} onClick={() => setLogoEmoji(e)}>{e}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Currency Symbol</label>
              <input className="form-input" value={currency} onChange={e => setCurrency(e.target.value)} placeholder="e.g. ₹, $, €" />
            </div>
            <div className="form-group">
              <label>Owner Name</label>
              <input className="form-input" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner's name" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
              </div>
            </div>
            <div className="form-group">
              <label>GSTIN / Tax ID</label>
              <input className="form-input" value={gstin} onChange={e => setGstin(e.target.value)} placeholder="e.g. 36XXXXX1234A1Z5" />
            </div>
          </div>
        )}

        {/* Step 2: Tax Setup */}
        {step === 2 && (
          <div className="setup-step-content">
            <h2>Tax & Receipt Configuration</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Tax 1 Label</label>
                <input className="form-input" value={tax1Label} onChange={e => setTax1Label(e.target.value)} placeholder="e.g. CGST" />
              </div>
              <div className="form-group">
                <label>Tax 1 Rate (%)</label>
                <input type="number" step="0.1" className="form-input" value={tax1Rate} onChange={e => setTax1Rate(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tax 2 Label</label>
                <input className="form-input" value={tax2Label} onChange={e => setTax2Label(e.target.value)} placeholder="e.g. SGST" />
              </div>
              <div className="form-group">
                <label>Tax 2 Rate (%)</label>
                <input type="number" step="0.1" className="form-input" value={tax2Rate} onChange={e => setTax2Rate(e.target.value)} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: '#aaa' }}>Preview: On a {currency}1000 order</div>
              <div style={{ fontSize: '14px', marginTop: '4px' }}>{tax1Label} ({tax1Rate}%): {currency}{(1000 * parseFloat(tax1Rate || '0') / 100).toFixed(2)}</div>
              <div style={{ fontSize: '14px' }}>{tax2Label} ({tax2Rate}%): {currency}{(1000 * parseFloat(tax2Rate || '0') / 100).toFixed(2)}</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '4px', color: '#f59e0b' }}>
                Total: {currency}{(1000 + 1000 * parseFloat(tax1Rate || '0') / 100 + 1000 * parseFloat(tax2Rate || '0') / 100).toFixed(2)}
              </div>
            </div>
            <div className="form-group">
              <label>Thank You Message</label>
              <input className="form-input" value={thankYouMsg} onChange={e => setThankYouMsg(e.target.value)} placeholder="Thank you! Visit again" />
            </div>
            <div className="form-group">
              <label>Receipt Footer</label>
              <input className="form-input" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} placeholder="Powered by Restaurant POS" />
            </div>
          </div>
        )}

        {/* Step 3: Categories */}
        {step === 3 && (
          <div className="setup-step-content">
            <h2>Menu Categories</h2>
            <p style={{ color: '#aaa', marginBottom: '16px', fontSize: '13px' }}>Define the categories for your menu items</p>
            {categories.map((cat, idx) => (
              <div key={cat.id} className="setup-cat-card">
                <div className="setup-cat-top">
                  <input className="form-input setup-cat-emoji" value={cat.emoji}
                    onChange={e => updateCategory(idx, 'emoji', e.target.value)} />
                  <input className="form-input setup-cat-name" value={cat.name}
                    onChange={e => updateCategory(idx, 'name', e.target.value)} placeholder="Category name" />
                  <input type="number" className="form-input setup-cat-order" value={cat.displayOrder}
                    onChange={e => updateCategory(idx, 'displayOrder', parseInt(e.target.value) || 0)} placeholder="#" />
                  <button className="admin-del-btn setup-cat-del" onClick={() => removeCategory(idx)}>X</button>
                </div>
              </div>
            ))}
            <button className="admin-add-btn" onClick={addCategory} style={{ marginTop: '12px' }}>+ Add Category</button>
          </div>
        )}

        {/* Step 4: Menu Items */}
        {step === 4 && (
          <div className="setup-step-content">
            <h2>Menu Items</h2>
            <p style={{ color: '#aaa', marginBottom: '12px', fontSize: '13px' }}>
              Add your menu items. Default items are pre-filled — edit or remove as needed.
            </p>
            {categories.map(cat => {
              const catItems = menuItems.filter(m => m.category === cat.name);
              if (catItems.length === 0) return null;
              return (
                <div key={cat.name} style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#f59e0b', marginBottom: '8px' }}>
                    {cat.emoji} {cat.name}
                  </div>
                  {catItems.map(item => {
                    const idx = menuItems.findIndex(m => m.id === item.id);
                    return (
                      <div key={item.id} className="setup-menu-card">
                        <div className="setup-menu-top">
                          <select className="form-input setup-menu-emoji"
                            value={item.emoji}
                            onChange={e => updateMenuItem(idx, 'emoji', e.target.value)}>
                            {FOOD_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                          </select>
                          <input className="form-input setup-menu-name" value={item.name}
                            onChange={e => updateMenuItem(idx, 'name', e.target.value)} placeholder="Item name" />
                          <input type="number" className="form-input setup-menu-price" value={item.price}
                            onChange={e => updateMenuItem(idx, 'price', e.target.value)} placeholder={currency} />
                          <button className="admin-del-btn setup-menu-del" onClick={() => removeMenuItem(idx)}>X</button>
                        </div>
                        <input className="form-input setup-menu-desc" value={item.description}
                          onChange={e => updateMenuItem(idx, 'description', e.target.value)} placeholder="Short description" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {/* Items without a matching category */}
            {menuItems.filter(m => !categories.find(c => c.name === m.category)).length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#888', marginBottom: '8px' }}>Other</div>
                {menuItems.filter(m => !categories.find(c => c.name === m.category)).map(item => {
                  const idx = menuItems.findIndex(m => m.id === item.id);
                  return (
                    <div key={item.id} className="setup-menu-card">
                      <div className="setup-menu-top">
                        <select className="form-input setup-menu-emoji"
                          value={item.emoji}
                          onChange={e => updateMenuItem(idx, 'emoji', e.target.value)}>
                          {FOOD_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
                        </select>
                        <input className="form-input setup-menu-name" value={item.name}
                          onChange={e => updateMenuItem(idx, 'name', e.target.value)} placeholder="Item name" />
                        <input type="number" className="form-input setup-menu-price" value={item.price}
                          onChange={e => updateMenuItem(idx, 'price', e.target.value)} placeholder={currency} />
                        <button className="admin-del-btn setup-menu-del" onClick={() => removeMenuItem(idx)}>X</button>
                      </div>
                      <input className="form-input setup-menu-desc" value={item.description}
                        onChange={e => updateMenuItem(idx, 'description', e.target.value)} placeholder="Short description" />
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="form-input" id="newMenuCat" style={{ flex: 1 }}>
                {categories.map(c => <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>)}
              </select>
              <button className="admin-add-btn" onClick={() => {
                const sel = (document.getElementById('newMenuCat') as HTMLSelectElement)?.value || (categories[0]?.name || '');
                setMenuItems([...menuItems, { id: Date.now(), name: '', category: sel, price: '', description: '', emoji: '\uD83C\uDF7D\uFE0F' }]);
              }} style={{ whiteSpace: 'nowrap' }}>+ Add Item</button>
            </div>
            <p style={{ color: '#888', fontSize: '12px', marginTop: '8px' }}>
              {menuItems.length} items total. You can always add more from Settings later.
            </p>
          </div>
        )}

        {/* Step 5: Table Types */}
        {step === 5 && (
          <div className="setup-step-content">
            <h2>Table Types & Count</h2>
            <p style={{ color: '#aaa', marginBottom: '16px', fontSize: '13px' }}>Define your table types and how many of each to create</p>
            {tableTypes.map((tt, idx) => (
              <div key={tt.id} className="setup-table-type-card">
                <div className="setup-tt-top">
                  <input className="form-input setup-tt-name" value={tt.name}
                    onChange={e => {
                      const oldName = tt.name;
                      updateTableType(idx, 'name', e.target.value);
                      setTableCounts(prev => {
                        const next = { ...prev };
                        next[e.target.value] = next[oldName] || 0;
                        if (oldName !== e.target.value) delete next[oldName];
                        return next;
                      });
                    }} placeholder="Type name" />
                  <input className="form-input setup-tt-prefix" value={tt.labelPrefix}
                    onChange={e => updateTableType(idx, 'labelPrefix', e.target.value)} placeholder="Prefix" />
                  <input type="number" className="form-input setup-tt-seats" value={tt.defaultCapacity}
                    onChange={e => updateTableType(idx, 'defaultCapacity', parseInt(e.target.value) || 2)} placeholder="Seats" />
                  <button className="admin-del-btn setup-tt-del" onClick={() => {
                    setTableCounts(prev => { const next = { ...prev }; delete next[tt.name]; return next; });
                    removeTableType(idx);
                  }}>X</button>
                </div>
                <div className="setup-table-count">
                  <label>Tables:</label>
                  <div className="people-control">
                    <button onClick={() => setTableCounts(prev => ({ ...prev, [tt.name]: Math.max(0, (prev[tt.name] || 0) - 1) }))}>
                      {'\u2212'}
                    </button>
                    <span>{tableCounts[tt.name] || 0}</span>
                    <button onClick={() => setTableCounts(prev => ({ ...prev, [tt.name]: Math.min(50, (prev[tt.name] || 0) + 1) }))}>
                      +
                    </button>
                  </div>
                  <span className="setup-tt-summary">
                    {tableCounts[tt.name] || 0} {'\u00D7'} {tt.defaultCapacity} = {(tableCounts[tt.name] || 0) * tt.defaultCapacity} seats
                  </span>
                </div>
              </div>
            ))}
            <button className="admin-add-btn" onClick={() => { addTableType(); }} style={{ marginTop: '12px' }}>+ Add Table Type</button>

            {tableTypes.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600 }}>
                  Total: {tableTypes.reduce((sum, tt) => sum + (tableCounts[tt.name] || 0), 0)} tables,{' '}
                  {tableTypes.reduce((sum, tt) => sum + (tableCounts[tt.name] || 0) * tt.defaultCapacity, 0)} seats
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Confirm */}
        {step === 6 && (
          <div className="setup-step-content">
            <h2>Ready to Launch!</h2>
            <div className="setup-summary">
              <div className="setup-summary-item">
                <span className="setup-summary-label">Restaurant</span>
                <span>{logoEmoji} {name}</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Location</span>
                <span>{city || 'Not set'}</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Currency</span>
                <span>{currency}</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Tax</span>
                <span>{tax1Label} {tax1Rate}% + {tax2Label} {tax2Rate}%</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Categories</span>
                <span>{categories.map(c => `${c.emoji} ${c.name}`).join(', ')}</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Menu Items</span>
                <span>{menuItems.filter(m => m.name.trim()).length} items</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Tables</span>
                <span>{tableTypes.map(t => `${tableCounts[t.name] || 0} ${t.name}`).join(', ')}</span>
              </div>
              <div className="setup-summary-item">
                <span className="setup-summary-label">Admin</span>
                <span>{'\uD83D\uDD10'} {user?.displayName} ({user?.username})</span>
              </div>
            </div>
            <div className="setup-sample-data">
              <label className="admin-toggle">
                <input type="checkbox" checked={keepSampleData} onChange={e => setKeepSampleData(e.target.checked)} />
                <span className="admin-toggle-slider" />
                <span className="admin-toggle-label">Save menu items from Step 4</span>
              </label>
              <p style={{ color: '#aaa', fontSize: '13px', marginTop: '4px' }}>
                {keepSampleData ? `${menuItems.filter(m => m.name.trim()).length} menu items will be created.` : 'No menu items will be created. You can add from Settings later.'}
              </p>
            </div>
          </div>
        )}

        <div className="setup-footer">
          {step > 1 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < TOTAL_STEPS ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}
              disabled={step === 1 && !name.trim()}>
              Next
            </button>
          ) : (
            <button className="btn-primary" onClick={handleFinish} disabled={saving}>
              {saving ? 'Setting up...' : 'Launch Restaurant'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
