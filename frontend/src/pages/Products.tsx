import React, { useState } from 'react';
import { Plus, Package, Trash2, ChevronRight } from 'lucide-react';
import { api, type CreateProductInput } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, EmptyState, Alert, formatDate } from '../components/UI';
import Modal from '../components/Modal';

export default function Products() {
  const { tenantId } = useTenant();
  const { data, loading, error, refetch } = useFetch(
    () => api.products.list(tenantId), [tenantId]
  );
  const [showCreate, setShowCreate] = useState(false);
  const deleteAction = useAction(async (id: string) => {
    await api.products.delete(tenantId, id);
    refetch();
  });

  const products = data?.products ?? [];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Products</h1>
          <p>Manage your product catalogue for campaign generation</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {error && <Alert type="error" message={error} />}

      <div className="card">
        {loading ? <Spinner /> : products.length === 0 ? (
          <EmptyState
            icon={<Package size={48} />}
            title="No products yet"
            description="Add your first product to start generating campaigns"
            action={
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Add Product
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Target Audience</th>
                  <th>Features</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-main">{p.name}</div>
                      <div className="cell-sub" style={{ maxWidth: 260 }}>
                        {p.description.slice(0, 80)}{p.description.length > 80 ? '…' : ''}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-draft">{p.category}</span>
                    </td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.targetAudience}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(Array.isArray(p.features) ? p.features : []).slice(0, 2).map((f, i) => (
                          <span key={i} className="badge badge-draft" style={{ fontSize: 10 }}>
                            {String(f).slice(0, 20)}
                          </span>
                        ))}
                        {(Array.isArray(p.features) ? p.features : []).length > 2 && (
                          <span className="badge badge-draft" style={{ fontSize: 10 }}>
                            +{(Array.isArray(p.features) ? p.features : []).length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td>
                      <button
                        className="btn btn-icon btn-danger"
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete "${p.name}"?`)) {
                            deleteAction.run(p.id);
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProductModal
          tenantId={tenantId}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch(); }}
        />
      )}
    </div>
  );
}

function CreateProductModal({
  tenantId, onClose, onCreated,
}: {
  tenantId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<CreateProductInput>({
    name: '', description: '', features: [], category: '', targetAudience: '', brandGuidelines: '',
  });
  const [featuresText, setFeaturesText] = useState('');
  const { run, loading, error } = useAction(async () => {
    await api.products.create(tenantId, {
      ...form,
      features: featuresText.split('\n').map(s => s.trim()).filter(Boolean),
    });
    onCreated();
  });

  const set = (k: keyof CreateProductInput, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <Modal
      title="Add Product"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={loading || !form.name} onClick={() => run()}>
            {loading ? 'Saving…' : 'Save Product'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}
      <div className="form-group">
        <label>Product Name *</label>
        <input type="text" placeholder="e.g. Premium Insulated Bottle"
          value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Description *</label>
        <textarea placeholder="Describe the product…"
          value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Category *</label>
          <input type="text" placeholder="e.g. Drinkware"
            value={form.category} onChange={e => set('category', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Target Audience *</label>
          <input type="text" placeholder="e.g. Urban professionals"
            value={form.targetAudience} onChange={e => set('targetAudience', e.target.value)} />
        </div>
      </div>
      <div className="form-group">
        <label>Key Features (one per line)</label>
        <textarea placeholder={"Keeps drinks cold 24h\nLeakproof lid\nBPA-free"}
          rows={4}
          value={featuresText} onChange={e => setFeaturesText(e.target.value)} />
      </div>
      <div className="form-group">
        <label>Brand Guidelines (optional)</label>
        <textarea placeholder="Tone, colors, do's and don'ts…" rows={3}
          value={form.brandGuidelines ?? ''}
          onChange={e => set('brandGuidelines', e.target.value)} />
      </div>
    </Modal>
  );
}
