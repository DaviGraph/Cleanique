import React, { useState, useEffect } from 'react';
import {
  getSettings,
  updateSetting,
  getAdminPackages,
  updatePackage,
  createPackage,
  deletePackage,
} from '../lib/adminApi';
import type { CleaniqueSetting, AdminPackage } from '../lib/adminApi';
import { CreditCardIcon, PackageIcon, XIcon, PlusIcon, TrashIcon } from '../../booking/components/Icons';

export const AdminSettingsPage: React.FC = () => {
  // ─── Settings (bank details) ───────────────────────────────────────
  const [settings, setSettings] = useState<CleaniqueSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});

  // ─── Packages ──────────────────────────────────────────────────────
  const [packages, setPackages] = useState<AdminPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [packagesSuccess, setPackagesSuccess] = useState<string | null>(null);
  const [editingPkg, setEditingPkg] = useState<string | null>(null); // package id being edited
  const [pkgEdits, setPkgEdits] = useState<Partial<AdminPackage>>({});
  const [savingPkg, setSavingPkg] = useState<string | null>(null);
  const [showNewPkgForm, setShowNewPkgForm] = useState(false);
  const [deletingPkgId, setDeletingPkgId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [newPkg, setNewPkg] = useState<Omit<AdminPackage, 'id'>>({
    name: '',
    description: '',
    price: 0,
    features: [],
    recommended_for: '',
    popular: false,
    sort_order: 100,
    active: true,
  });

  useEffect(() => {
    loadSettings();
    loadPackages();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();
      setSettings(data);
      const map: Record<string, string> = {};
      data.forEach((s) => { map[s.key] = s.value; });
      setEditedSettings(map);
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Failed to load settings.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadPackages() {
    try {
      const data = await getAdminPackages();
      setPackages(data);
    } catch (err) {
      setPackagesError(err instanceof Error ? err.message : 'Failed to load packages.');
    } finally {
      setPackagesLoading(false);
    }
  }

  const handleSaveSetting = async (key: string) => {
    setSavingKey(key);
    setSettingsError(null);
    setSettingsSuccess(null);
    try {
      await updateSetting(key, editedSettings[key] || '');
      setSettingsSuccess(`"${key.replace(/_/g, ' ')}" updated successfully.`);
      await loadSettings();
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleStartEditPkg = (pkg: AdminPackage) => {
    setEditingPkg(pkg.id);
    setPkgEdits({ ...pkg });
    setPackagesError(null);
    setPackagesSuccess(null);
  };

  const handleSavePkg = async (pkgId: string) => {
    setSavingPkg(pkgId);
    setPackagesError(null);
    setPackagesSuccess(null);
    try {
      const updates = { ...pkgEdits };
      if (typeof updates.features === 'string') {
        updates.features = (updates.features as unknown as string)
          .split('\n')
          .map((f: string) => f.trim())
          .filter(Boolean);
      }
      await updatePackage(pkgId, updates);
      setPackagesSuccess(`Package updated successfully.`);
      setEditingPkg(null);
      await loadPackages();
    } catch (err) {
      setPackagesError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSavingPkg(null);
    }
  };

  const handleDeletePkg = async (id: string, name: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingPkgId(id);
    setConfirmDeleteId(null);
    setPackagesError(null);
    setPackagesSuccess(null);
    try {
      await deletePackage(id);
      setPackagesSuccess(`Package "${name}" deleted successfully.`);
      await loadPackages();
    } catch (err) {
      setPackagesError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeletingPkgId(null);
    }
  };

  const handleCreatePkg = async () => {
    if (!newPkg.name.trim()) {
      setPackagesError('Please enter a package name.');
      return;
    }
    if (!newPkg.price || newPkg.price <= 0) {
      setPackagesError('Please enter a valid price greater than ₦0.');
      return;
    }

    setSavingPkg('new');
    setPackagesError(null);
    try {
      const pkg = {
        ...newPkg,
        name: newPkg.name.trim(),
        features: typeof newPkg.features === 'string'
          ? (newPkg.features as unknown as string).split('\n').map((f: string) => f.trim()).filter(Boolean)
          : newPkg.features,
      };
      await createPackage(pkg);
      setPackagesSuccess('New package created successfully.');
      setShowNewPkgForm(false);
      setNewPkg({
        name: '', description: '', price: 0, features: [], recommended_for: '',
        popular: false, sort_order: 100, active: true,
      });
      await loadPackages();
    } catch (err) {
      setPackagesError(err instanceof Error ? err.message : 'Failed to create package.');
    } finally {
      setSavingPkg(null);
    }
  };

  const settingLabels: Record<string, string> = {
    bank_name: 'Bank Name',
    account_name: 'Account Name',
    account_number: 'Account Number',
  };

  return (
    <div className="cq-container cq-admin-container">
      <div className="cq-admin-page-header">
        <div>
          <span className="cq-badge cq-badge-turquoise">Settings</span>
          <h1 className="cq-admin-page-title">Manage Settings & Packages</h1>
          <p className="cq-admin-page-sub">
            Update payment account details and residential cleaning packages. Changes take effect immediately for all customers.
          </p>
        </div>
      </div>

      {/* ─── Bank Details ─────────────────────────────────────────────── */}
      <section className="cq-admin-card" style={{ marginBottom: '32px' }}>
        <h2 className="cq-admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CreditCardIcon size={20} color="#2ECDBF" /> Payment Account Details
        </h2>
        <p className="cq-admin-card-desc">
          These details are shown to customers on the payment instructions page. Keep them accurate and up to date.
        </p>

        {settingsSuccess && (
          <div className="cq-admin-alert-banner is-success" role="alert">
            <span>{settingsSuccess}</span>
            <button type="button" onClick={() => setSettingsSuccess(null)} className="cq-alert-close" aria-label="Close">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {settingsError && (
          <div className="cq-admin-alert-banner is-error" role="alert">
            <span>{settingsError}</span>
            <button type="button" onClick={() => setSettingsError(null)} className="cq-alert-close" aria-label="Close">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {settingsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cq-spinner-sm" /> <span>Loading settings...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '520px' }}>
            {settings
              .filter(s => ['bank_name', 'account_name', 'account_number'].includes(s.key))
              .map((setting) => (
                <div key={setting.key} className="cq-form-group">
                  <label className="cq-form-label">{settingLabels[setting.key] || setting.key}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={editedSettings[setting.key] || ''}
                      onChange={(e) =>
                        setEditedSettings((prev) => ({ ...prev, [setting.key]: e.target.value }))
                      }
                      className="cq-input"
                      placeholder={settingLabels[setting.key]}
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveSetting(setting.key)}
                      disabled={savingKey === setting.key}
                      className="cq-btn cq-btn-primary"
                      style={{ whiteSpace: 'nowrap', minWidth: '80px' }}
                    >
                      {savingKey === setting.key ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px', display: 'block' }}>
                    Last updated: {new Date(setting.updated_at).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* ─── Packages ─────────────────────────────────────────────────── */}
      <section className="cq-admin-card">
        <div className="cq-admin-card-header-row" style={{ marginBottom: '16px' }}>
          <h2 className="cq-admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageIcon size={20} color="#2ECDBF" /> Residential Cleaning Packages
          </h2>
          <button
            type="button"
            onClick={() => setShowNewPkgForm(!showNewPkgForm)}
            className="cq-btn cq-btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {showNewPkgForm ? 'Cancel New' : <><PlusIcon size={14} /> Add Package</>}
          </button>
        </div>
        <p className="cq-admin-card-desc">
          Prices set here are used for all booking calculations. Customers never submit prices — they're always computed from this table.
        </p>

        {packagesSuccess && (
          <div className="cq-admin-alert-banner is-success" role="alert">
            <span>{packagesSuccess}</span>
            <button type="button" onClick={() => setPackagesSuccess(null)} className="cq-alert-close" aria-label="Close">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {packagesError && (
          <div className="cq-admin-alert-banner is-error" role="alert">
            <span>{packagesError}</span>
            <button type="button" onClick={() => setPackagesError(null)} className="cq-alert-close" aria-label="Close">
              <XIcon size={14} />
            </button>
          </div>
        )}

        {/* New Package Form */}
        {showNewPkgForm && (
          <div className="cq-admin-card" style={{ background: 'rgba(46,205,191,0.06)', marginBottom: '24px', borderColor: '#2ECDBF' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', color: '#102A29' }}>New Package</h3>
            <PackageForm
              value={{ ...newPkg, features: newPkg.features as string[] }}
              onChange={(updates) => setNewPkg((prev) => ({ ...prev, ...updates }))}
            />
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleCreatePkg}
                disabled={savingPkg === 'new'}
                className="cq-btn cq-btn-primary"
              >
                {savingPkg === 'new' ? 'Creating...' : 'Create Package'}
              </button>
              <button type="button" onClick={() => setShowNewPkgForm(false)} className="cq-btn cq-btn-outline">
                Cancel
              </button>
            </div>
          </div>
        )}

        {packagesLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="cq-spinner-sm" /> <span>Loading packages...</span>
          </div>
        ) : packages.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.9rem' }}>No packages found. Add one above.</p>
        ) : (
          <div className="cq-admin-packages-list">
            {packages.map((pkg) => (
              <div key={pkg.id} className="cq-admin-package-item">
                {editingPkg === pkg.id ? (
                  <div>
                    <PackageForm
                      value={{ ...(pkgEdits as AdminPackage), features: (pkgEdits.features || []) as string[] }}
                      onChange={(updates) => setPkgEdits((prev) => ({ ...prev, ...updates }))}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        onClick={() => handleSavePkg(pkg.id)}
                        disabled={savingPkg === pkg.id}
                        className="cq-btn cq-btn-primary"
                      >
                        {savingPkg === pkg.id ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPkg(null)}
                        className="cq-btn cq-btn-outline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cq-admin-package-row">
                    <div className="cq-admin-package-info">
                      <div className="cq-admin-package-name">
                        {pkg.name}
                        {pkg.popular && <span className="cq-badge cq-badge-turquoise" style={{ marginLeft: '8px', fontSize: '0.65rem' }}>Popular</span>}
                        {!pkg.active && <span className="cq-badge" style={{ marginLeft: '8px', fontSize: '0.65rem', background: '#ddd', color: '#666' }}>Inactive</span>}
                      </div>
                      <div className="cq-admin-package-price">₦{pkg.price.toLocaleString()}</div>
                      <div className="cq-admin-package-desc">{pkg.description}</div>
                      <div className="cq-admin-package-recommended">For: {pkg.recommended_for}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleStartEditPkg(pkg)}
                        className="cq-btn cq-btn-secondary cq-btn-sm"
                      >
                        Edit
                      </button>
                      {confirmDeleteId === pkg.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: '#c0392b', whiteSpace: 'nowrap' }}>Confirm?</span>
                          <button
                            type="button"
                            onClick={() => handleDeletePkg(pkg.id, pkg.name)}
                            disabled={deletingPkgId === pkg.id}
                            className="cq-btn cq-btn-sm"
                            style={{ background: '#c0392b', color: '#fff', border: 'none' }}
                          >
                            {deletingPkgId === pkg.id ? 'Deleting...' : 'Yes, Delete'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="cq-btn cq-btn-outline cq-btn-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeletePkg(pkg.id, pkg.name)}
                          disabled={deletingPkgId === pkg.id}
                          className="cq-btn cq-btn-sm"
                          title={`Delete ${pkg.name}`}
                          style={{
                            background: 'rgba(192,57,43,0.08)',
                            color: '#c0392b',
                            border: '1px solid rgba(192,57,43,0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <TrashIcon size={14} color="#c0392b" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

// ─── Package form sub-component ────────────────────────────────────────────────

interface PackageFormProps {
  value: Omit<AdminPackage, 'id'>;
  onChange: (updates: Partial<AdminPackage>) => void;
}

const PackageForm: React.FC<PackageFormProps> = ({ value, onChange }) => {
  const [featuresText, setFeaturesText] = useState<string>(() =>
    Array.isArray(value.features) ? value.features.join('\n') : (value.features || '')
  );
  const [prevName, setPrevName] = useState(value.name);

  if (value.name !== prevName) {
    setPrevName(value.name);
    setFeaturesText(Array.isArray(value.features) ? value.features.join('\n') : (value.features || ''));
  }

  return (
    <div className="cq-pkg-form-grid">
      <div className="cq-form-group">
        <label className="cq-form-label">Package Name <span className="cq-req">*</span></label>
        <input
          type="text"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Self-Contained"
          className="cq-input"
        />
      </div>

      <div className="cq-form-group">
        <label className="cq-form-label">Price (₦) <span className="cq-req">*</span></label>
        <input
          type="number"
          min="0"
          step="1000"
          value={value.price}
          onChange={(e) => onChange({ price: parseInt(e.target.value, 10) || 0 })}
          className="cq-input"
        />
      </div>

      <div className="cq-form-group" style={{ gridColumn: 'span 2' }}>
        <label className="cq-form-label">Description</label>
        <textarea
          rows={2}
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          className="cq-textarea"
          placeholder="Short description of what's included..."
        />
      </div>

      <div className="cq-form-group">
        <label className="cq-form-label">Recommended For</label>
        <input
          type="text"
          value={value.recommended_for}
          onChange={(e) => onChange({ recommended_for: e.target.value })}
          placeholder="e.g. 1 Room / Compact Space"
          className="cq-input"
        />
      </div>

      <div className="cq-form-group">
        <label className="cq-form-label">Sort Order</label>
        <input
          type="number"
          min="0"
          value={value.sort_order}
          onChange={(e) => onChange({ sort_order: parseInt(e.target.value, 10) || 0 })}
          className="cq-input"
        />
      </div>

      <div className="cq-form-group" style={{ gridColumn: 'span 2' }}>
        <label className="cq-form-label">Features (one per line)</label>
        <textarea
          rows={5}
          value={featuresText}
          onChange={(e) => {
            setFeaturesText(e.target.value);
            onChange({
              features: e.target.value.split('\n').map((f) => f.trim()).filter(Boolean),
            } as Partial<AdminPackage>);
          }}
          className="cq-textarea"
          placeholder="Comprehensive floor sweep & deep mop&#10;Surface dusting, wipe down & polish&#10;Trash removal & bin relining"
        />
        <span style={{ fontSize: '0.75rem', color: '#888' }}>Each line becomes a bullet point.</span>
      </div>

      <div className="cq-form-group" style={{ display: 'flex', gap: '24px', gridColumn: 'span 2' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={value.popular}
            onChange={(e) => onChange({ popular: e.target.checked })}
          />
          Mark as Popular
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input
            type="checkbox"
            checked={value.active}
            onChange={(e) => onChange({ active: e.target.checked })}
          />
          Active (shown to customers)
        </label>
      </div>
    </div>
  );
};
