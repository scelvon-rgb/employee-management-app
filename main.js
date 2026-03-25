
const STORAGE_KEY = 'ems_contacts';

function getContacts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (e) {
        console.error('Failed to parse contacts from storage', e);
        return [];
    }
}

function saveContacts(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addContact(contact) {
    const list = getContacts();
    list.push(contact);
    saveContacts(list);
}

function updateContact(id, updater) {
    const list = getContacts();
    const idx = list.findIndex(c => c.id === id);
    if (idx === -1) return false;
    list[idx] = Object.assign({}, list[idx], updater);
    saveContacts(list);
    return true;
}

function deleteContact(id) {
    let list = getContacts();
    list = list.filter(c => c.id !== id);
    saveContacts(list);
    return true;
}

function validateContact(contact) {
    if (!contact.fullName || contact.fullName.length < 2) return { ok: false, message: 'Full name is required (min 2 characters).' };
    if (!contact.email || !/\S+@\S+\.\S+/.test(contact.email)) return { ok: false, message: 'A valid email address is required.' };
    if (!contact.phone || contact.phone.length < 6) return { ok: false, message: 'A valid phone number is required.' };
    return { ok: true };
}

// Rendering (for view-contacts.html)
function renderContactsTable(filter = '') {
    const tableBody = document.querySelector('#contacts-table tbody');
    const emptyState = document.getElementById('empty-state');
    if (!tableBody) return;

    const list = getContacts();
    let filtered = list;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = list.filter(c =>
            (c.fullName || '').toLowerCase().includes(q) ||
            (c.email || '').toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q) ||
            (c.department || '').toLowerCase().includes(q) ||
            (c.position || '').toLowerCase().includes(q)
        );
    }

    tableBody.innerHTML = '';
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
        return;
    } else {
        emptyState.style.display = 'none';
    }

    filtered.forEach((c, index) => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(c.fullName || '')}</td>
      <td>${escapeHtml(c.email || '')}</td>
      <td>${escapeHtml(c.phone || '')}</td>
      <td>${escapeHtml(c.department || '')}</td>
      <td>${escapeHtml(c.position || '')}</td>
      <td class="actions">
        <button class="action-btn details" data-id="${c.id}">Details</button>
        <button class="action-btn edit" data-id="${c.id}">Edit</button>
        <button class="action-btn delete" data-id="${c.id}">Delete</button>
      </td>
    `;

        tableBody.appendChild(tr);
    });

    // attach events (event delegation would be more efficient but this is straightforward)
    tableBody.querySelectorAll('.action-btn.details').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            showDetails(id);
        });
    });

    tableBody.querySelectorAll('.action-btn.edit').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            // placeholder: edit behavior (per assignment: pop up Edit Alert using JS)
            const contact = getContacts().find(c => c.id === id);
            if (!contact) {
                alert('Contact not found.');
                return;
            }
            alert('Edit (placeholder)\n\nImplement edit UI to update this contact.\n\nContact: ' + contact.fullName);
        });
    });

    tableBody.querySelectorAll('.action-btn.delete').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            const contact = getContacts().find(c => c.id === id);
            if (!contact) {
                alert('Contact not found.');
                return;
            }
            const ok = confirm('Are you sure you want to delete?');
            if (!ok) return;
            deleteContact(id);
            renderContactsTable(document.getElementById('search') ? document.getElementById('search').value.trim() : '');
            // update home total if present
            updateHomeTotal();
        });
    });
}

// Details modal
function showDetails(id) {
    const contact = getContacts().find(c => c.id === id);
    if (!contact) {
        alert('Contact not found.');
        return;
    }

    const modal = document.getElementById('modal');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');

    title.textContent = contact.fullName || 'Contact Details';
    body.innerHTML = `
    <dl>
      <dt>Name</dt><dd>${escapeHtml(contact.fullName || '')}</dd>
      <dt>Email</dt><dd>${escapeHtml(contact.email || '')}</dd>
      <dt>Phone</dt><dd>${escapeHtml(contact.phone || '')}</dd>
      <dt>Department</dt><dd>${escapeHtml(contact.department || '')}</dd>
      <dt>Position</dt><dd>${escapeHtml(contact.position || '')}</dd>
      <dt>Created</dt><dd>${new Date(contact.createdAt || Date.now()).toLocaleString()}</dd>
    </dl>
  `;

    modal.setAttribute('aria-hidden', 'false');
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.style.display = 'none';
}

// small helper to avoid XSS when injecting strings into HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// Utility to update home page total if present
function updateHomeTotal() {
    try {
        const el = document.getElementById('total-contacts');
        if (el) el.textContent = getContacts().length;
    } catch (e) { }
}

// Expose some functions to global scope for inline scripts in HTML
window.getContacts = getContacts;
window.addContact = addContact;
window.renderContactsTable = renderContactsTable;
window.validateContact = validateContact;
window.updateContact = updateContact;
window.deleteContact = deleteContact;
window.showDetails = showDetails;
window.closeModal = closeModal;
window.updateHomeTotal = updateHomeTotal;