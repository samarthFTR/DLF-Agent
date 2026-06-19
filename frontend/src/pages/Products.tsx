import React, { useState, useRef, useCallback } from 'react';
import { Plus, Package, Trash2, Image, Upload, X, Eye } from 'lucide-react';
import { api, type CreateProductInput, type Asset } from '../api';
import { useFetch, useTenant, useAction } from '../hooks';
import { Spinner, EmptyState, Alert, formatDate } from '../components/UI';
import Modal from '../components/Modal';

export default function Products() {
  const { tenantId } = useTenant();
  const { data, loading, error, refetch } = useFetch(
    () => api.products.list(tenantId), [tenantId]
  );
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ id: string; name: string } | null>(null);

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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-sm btn-secondary"
                          title="Manage images"
                          onClick={() => setSelectedProduct({ id: p.id, name: p.name })}
                        >
                          <Image size={13} /> Images
                        </button>
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
                      </div>
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
          onCreated={(productId, productName) => {
            setShowCreate(false);
            refetch();
            // Auto-open image manager after creation
            setSelectedProduct({ id: productId, name: productName });
          }}
        />
      )}

      {selectedProduct && (
        <ProductImagesModal
          tenantId={tenantId}
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

// ─── Create Product Modal ──────────────────────────────────────────────────────

function CreateProductModal({
  tenantId, onClose, onCreated,
}: {
  tenantId: string;
  onClose: () => void;
  onCreated: (productId: string, productName: string) => void;
}) {
  const [form, setForm] = useState<CreateProductInput>({
    name: '', description: '', features: [], category: '', targetAudience: '', brandGuidelines: '',
  });
  const [featuresText, setFeaturesText] = useState('');
  const { run, loading, error } = useAction(async () => {
    const res = await api.products.create(tenantId, {
      ...form,
      features: featuresText.split('\n').map(s => s.trim()).filter(Boolean),
    });
    onCreated(res.product.id, res.product.name);
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
            {loading ? 'Saving…' : 'Save & Add Images →'}
          </button>
        </>
      }
    >
      {error && <Alert type="error" message={error} />}

      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
        border: '1px solid rgba(124,58,237,0.15)',
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontSize: 12,
        color: 'var(--text-muted)',
      }}>
        <Image size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
        After saving, you'll be prompted to upload product images used in AI creative generation.
      </div>

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

// ─── Product Images Modal ──────────────────────────────────────────────────────

function ProductImagesModal({
  tenantId, productId, productName, onClose,
}: {
  tenantId: string;
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const { data, loading, error, refetch } = useFetch(
    () => api.assets.listProductImages(tenantId, productId),
    [tenantId, productId]
  );

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assets: Asset[] = data?.assets ?? [];

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are supported (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image must be under 10 MB.');
      return;
    }
    setUploadError('');
    setUploading(true);
    try {
      await api.assets.uploadProductImage(tenantId, productId, file);
      refetch();
    } catch (e: any) {
      setUploadError(e.message ?? 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [tenantId, productId, refetch]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = () => setIsDragging(false);

  const handleDelete = async (assetId: string) => {
    if (!confirm('Remove this image?')) return;
    try {
      await api.assets.deleteAsset(tenantId, assetId);
      refetch();
    } catch (e: any) {
      setUploadError(e.message ?? 'Delete failed');
    }
  };

  return (
    <>
      <Modal
        title={`Product Images — ${productName}`}
        onClose={onClose}
        wide
        footer={
          <button className="btn btn-ghost" onClick={onClose}>Done</button>
        }
      >
        {/* Hero info bar */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))',
          border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: 'var(--radius)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <Image size={15} style={{ color: 'var(--accent-light)', flexShrink: 0 }} />
          <span>
            These images are used as <strong style={{ color: 'var(--text-secondary)' }}>source references</strong> during campaign generation.
            The AI uses them to create platform-specific creative assets.
          </span>
        </div>

        {/* Upload zone */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? 'var(--accent)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            background: isDragging ? 'var(--accent-glow)' : 'var(--bg-elevated)',
            marginBottom: 20,
            position: 'relative',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={e => handleFiles(e.target.files)}
          />
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div className="spinner" />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Uploading…</span>
            </div>
          ) : (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--accent-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Upload size={22} color="var(--accent-light)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                {isDragging ? 'Drop your image here' : 'Drag & drop or click to upload'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                JPEG, PNG, or WebP · max 10 MB
              </div>
            </>
          )}
        </div>

        {uploadError && <Alert type="error" message={uploadError} />}

        {/* Image gallery */}
        {loading ? (
          <Spinner />
        ) : error ? (
          <Alert type="error" message={error} />
        ) : assets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: 13 }}>
            No images uploaded yet. Add at least one product image for AI creative generation.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {assets.map(asset => (
              <div key={asset.id} style={{
                position: 'relative',
                borderRadius: 'var(--radius)',
                overflow: 'hidden',
                border: '1px solid var(--border)',
                background: 'var(--bg-elevated)',
                aspectRatio: '1 / 1',
                cursor: 'pointer',
              }}
                onMouseEnter={e => {
                  (e.currentTarget.querySelector('.asset-overlay') as HTMLElement).style.opacity = '1';
                }}
                onMouseLeave={e => {
                  (e.currentTarget.querySelector('.asset-overlay') as HTMLElement).style.opacity = '0';
                }}
              >
                {asset.publicUrl ? (
                  <img
                    src={asset.publicUrl}
                    alt="Product image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Image size={32} style={{ opacity: 0.3 }} />
                  </div>
                )}

                {/* Hover overlay */}
                <div
                  className="asset-overlay"
                  style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.65)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 8, opacity: 0, transition: 'opacity 0.2s ease',
                  }}
                >
                  {asset.publicUrl && (
                    <button
                      className="btn btn-icon btn-secondary"
                      title="Preview"
                      style={{ width: 32, height: 32, padding: 0 }}
                      onClick={() => setPreview(asset.publicUrl!)}
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  <button
                    className="btn btn-icon btn-danger"
                    title="Delete"
                    style={{ width: 32, height: 32, padding: 0 }}
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Dimensions badge */}
                {asset.width && asset.height && (
                  <div style={{
                    position: 'absolute', bottom: 6, left: 6,
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: 4, padding: '2px 6px',
                    fontSize: 10, color: '#fff', fontWeight: 600,
                  }}>
                    {asset.width}×{asset.height}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {assets.length > 0 && (
          <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            {assets.length} image{assets.length !== 1 ? 's' : ''} ready for AI generation
          </div>
        )}
      </Modal>

      {/* Full-screen image preview */}
      {preview && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            cursor: 'zoom-out',
          }}
          onClick={() => setPreview(null)}
        >
          <button
            style={{
              position: 'absolute', top: 20, right: 20,
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => setPreview(null)}
          >
            <X size={18} color="#fff" />
          </button>
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
