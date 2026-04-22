/* =========================
   js/products.js
   Product Management Module
   ========================= */

(function() {
    'use strict';

    function escapeHtml(text) {
        if (!text) return '';
        return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProductsModule);
    } else {
        initProductsModule();
    }

    function initProductsModule() {
        if (!app.data.products) app.data.products = [];
    }

    // ─── Render Products Page ─────────────────────────────────────────────────

    function renderProductsPage() {
        const container = document.getElementById('products-list');
        if (!container) return;

        const products = app.data.products || [];

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon"></div>
                    <p>No products yet. Add your first product to start tracking CI opportunities by product.</p>
                </div>`;
            return;
        }

        container.innerHTML = products.map(product => {
            const issueCount = (app.data.issues || []).filter(i => (i.productIds || []).includes(product.id) && i.status !== 'Closed').length;
            const projectCount = (app.data.projects || []).filter(p => (p.productIds || []).includes(product.id) && p.status !== 'Closed').length;
            const closedIssues = (app.data.issues || []).filter(i => (i.productIds || []).includes(product.id) && i.status === 'Closed').length;
            const closedProjects = (app.data.projects || []).filter(p => (p.productIds || []).includes(product.id) && p.status === 'Closed').length;

            return `
                <div class="product-card">
                    <div class="product-card-header">
                        <div>
                            <div class="product-name">${escapeHtml(product.name)}</div>
                            ${product.code ? `<div class="product-code">${escapeHtml(product.code)}</div>` : ''}
                        </div>
                        <div class="product-actions">
                            <button class="btn btn-secondary btn-small" onclick="editProduct('${product.id}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteProduct('${product.id}')">Delete</button>
                        </div>
                    </div>
                    ${product.description ? `<div class="product-description">${escapeHtml(product.description)}</div>` : ''}
                    <div class="product-stats">
                        <div class="product-stat">
                            <span class="stat-value">${issueCount}</span>
                            <span class="stat-label">Open Issues</span>
                        </div>
                        <div class="product-stat">
                            <span class="stat-value">${projectCount}</span>
                            <span class="stat-label">Active Projects</span>
                        </div>
                        <div class="product-stat">
                            <span class="stat-value">${closedIssues + closedProjects}</span>
                            <span class="stat-label">Closed</span>
                        </div>
                    </div>
                    <div class="product-links">
                        ${issueCount > 0 ? `<button class="btn btn-secondary btn-small" onclick="filterIssuesByProduct('${product.id}')">View Issues</button>` : ''}
                        ${projectCount > 0 ? `<button class="btn btn-secondary btn-small" onclick="filterProjectsByProduct('${product.id}')">View Projects</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ─── Product Modal ────────────────────────────────────────────────────────

    function showCreateProductModal(prefillData = {}) {
        const existing = document.getElementById('productModal');
        if (existing) existing.remove();

        const modalHtml = `
            <div class="modal-overlay" id="productModal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>${prefillData.id ? 'Edit Product' : 'Add Product'}</h2>
                        <button class="modal-close" onclick="closeProductModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="productForm">
                            <input type="hidden" id="productId" value="${prefillData.id || ''}">

                            <div class="form-group">
                                <label>Product Name *</label>
                                <input type="text" id="productName" class="form-control" required
                                    value="${escapeHtml(prefillData.name || '')}"
                                    placeholder="e.g. Widget A, Model X-100">
                            </div>

                            <div class="form-group">
                                <label>Product Code / SKU</label>
                                <input type="text" id="productCode" class="form-control"
                                    value="${escapeHtml(prefillData.code || '')}"
                                    placeholder="e.g. WGT-A, X100">
                            </div>

                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="productDescription" class="form-control" rows="3"
                                    placeholder="Brief description of this product">${escapeHtml(prefillData.description || '')}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeProductModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="saveProduct()">${prefillData.id ? 'Update' : 'Add'} Product</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.getElementById('productName').focus();
    }

    function closeProductModal() {
        const modal = document.getElementById('productModal');
        if (modal) modal.remove();
    }

    function saveProduct() {
        const id = document.getElementById('productId').value;
        const name = document.getElementById('productName').value.trim();
        const code = document.getElementById('productCode').value.trim();
        const description = document.getElementById('productDescription').value.trim();

        if (!name) {
            showToast('Product name is required', 'error');
            return;
        }

        if (!app.data.products) app.data.products = [];

        if (id) {
            const index = app.data.products.findIndex(p => p.id === id);
            if (index !== -1) {
                app.data.products[index] = { ...app.data.products[index], name, code, description };
                if (typeof logAudit === 'function') logAudit('update', 'product', `Updated product: ${name}`);
            }
        } else {
            app.data.products.push({ id: generateId(), name, code, description });
            if (typeof logAudit === 'function') logAudit('create', 'product', `Created product: ${name}`);
        }

        saveData();
        closeProductModal();
        renderProductsPage();
        refreshProductFilters();
        showToast(`Product ${id ? 'updated' : 'added'} successfully`, 'success');
    }

    function editProduct(productId) {
        const product = (app.data.products || []).find(p => p.id === productId);
        if (!product) return;
        showCreateProductModal(product);
    }

    function deleteProduct(productId) {
        const product = (app.data.products || []).find(p => p.id === productId);
        if (!product) return;

        // Check if used
        const usedInIssues = (app.data.issues || []).some(i => (i.productIds || []).includes(productId));
        const usedInProjects = (app.data.projects || []).some(p => (p.productIds || []).includes(productId));

        let warning = '';
        if (usedInIssues || usedInProjects) {
            warning = '\n\nThis product is referenced in existing issues/projects. The link will be removed.';
        }

        if (!confirm(`Delete product "${product.name}"?${warning}`)) return;

        // Remove from issues and projects
        (app.data.issues || []).forEach(issue => {
            if (issue.productIds) issue.productIds = issue.productIds.filter(id => id !== productId);
        });
        (app.data.projects || []).forEach(proj => {
            if (proj.productIds) proj.productIds = proj.productIds.filter(id => id !== productId);
        });

        app.data.products = (app.data.products || []).filter(p => p.id !== productId);
        saveData();
        if (typeof logAudit === 'function') logAudit('delete', 'product', `Deleted product: ${product.name}`);
        renderProductsPage();
        refreshProductFilters();
        showToast('Product deleted', 'success');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function refreshProductFilters() {
        // Refresh the product filter dropdowns on Issues and Projects pages
        const issueFilter = document.getElementById('issue-product-filter');
        if (issueFilter) {
            const current = issueFilter.value;
            issueFilter.innerHTML = '<option value="">All Products</option>';
            (app.data.products || []).forEach(p => {
                issueFilter.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.code ? ' (' + escapeHtml(p.code) + ')' : ''}</option>`;
            });
            issueFilter.value = current;
        }

        const projectFilter = document.getElementById('project-product-filter');
        if (projectFilter) {
            const current = projectFilter.value;
            projectFilter.innerHTML = '<option value="">All Products</option>';
            (app.data.products || []).forEach(p => {
                projectFilter.innerHTML += `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.code ? ' (' + escapeHtml(p.code) + ')' : ''}</option>`;
            });
            projectFilter.value = current;
        }
    }

    function filterIssuesByProduct(productId) {
        navigateToPage('issues');
        setTimeout(() => {
            const filter = document.getElementById('issue-product-filter');
            if (filter) {
                filter.value = productId;
                filter.dispatchEvent(new Event('change'));
            }
        }, 100);
    }

    function filterProjectsByProduct(productId) {
        navigateToPage('projects');
        setTimeout(() => {
            const filter = document.getElementById('project-product-filter');
            if (filter) {
                filter.value = productId;
                filter.dispatchEvent(new Event('change'));
            }
        }, 100);
    }

    // ─── Expose to global scope ───────────────────────────────────────────────

    window.renderProductsPage = renderProductsPage;
    window.showCreateProductModal = showCreateProductModal;
    window.closeProductModal = closeProductModal;
    window.saveProduct = saveProduct;
    window.editProduct = editProduct;
    window.deleteProduct = deleteProduct;
    window.filterIssuesByProduct = filterIssuesByProduct;
    window.filterProjectsByProduct = filterProjectsByProduct;

})();
