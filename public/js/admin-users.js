(function ()
{
  const form = document.getElementById('admin-users-filter');
  const tableBody = document.getElementById('admin-users-table-body');
  const countLabel = document.getElementById('admin-users-count');
  const exportLink = document.getElementById('admin-users-export');

  if (!form || !tableBody)
  {
    return;
  }

  const searchInput = form.querySelector('[name="search"]');
  const statusSelect = form.querySelector('[name="status"]');
  const goalSelect = form.querySelector('[name="goal"]');
  const apiBase = form.dataset.adminUsersApi || '/api/panel/users';
  const adminPath = tableBody.dataset.adminPath || '/panel';
  const limit = Number(form.dataset.adminUsersLimit || 25);
  let debounceTimer = null;
  let activeController = null;

  [searchInput, statusSelect, goalSelect].forEach(function (field)
  {
    if (!field)
    {
      return;
    }

    const eventName = field === searchInput ? 'input' : 'change';
    field.addEventListener(eventName, function ()
    {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(loadUsers, field === searchInput ? 300 : 0);
    });
  });

  form.addEventListener('submit', function (event)
  {
    event.preventDefault();
    loadUsers();
  });

  async function loadUsers()
  {
    if (activeController)
    {
      activeController.abort();
    }

    activeController = new AbortController();
    setLoading(true);

    try
    {
      const params = new URLSearchParams(new FormData(form));
      params.set('limit', String(limit));
      params.set('offset', '0');

      const response = await fetch(`${apiBase}?${params.toString()}`, {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: activeController.signal
      });

      const payload = await response.json();

      if (!response.ok)
      {
        throw new Error(payload.error || 'Users could not be loaded.');
      }

      renderUsers(payload.users || []);
      updateCount(payload.total || 0, payload.users?.length || 0);
      updateUrl(params);
    }
    catch (error)
    {
      if (error.name !== 'AbortError')
      {
        renderError(error.message || 'Users could not be loaded.');
      }
    }
    finally
    {
      setLoading(false);
    }
  }

  function renderUsers(users)
  {
    tableBody.textContent = '';

    if (!users.length)
    {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 6;
      cell.innerHTML = '<p class="text-sm mb-0">No users found.</p>';
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    users.forEach(function (user)
    {
      tableBody.appendChild(buildUserRow(user));
    });
  }

  function buildUserRow(user)
  {
    const row = document.createElement('tr');

    row.appendChild(textCell(user.email || '-'));
    row.appendChild(statusCell(user.status));
    row.appendChild(textCell(user.profile?.goal || '-'));
    row.appendChild(textCell(formatDate(user.accessExpiresAt)));
    row.appendChild(textCell(formatDate(user.createdAt)));
    row.appendChild(actionCell(user));

    return row;
  }

  function textCell(value)
  {
    const cell = document.createElement('td');
    const text = document.createElement('p');
    text.className = 'text-sm mb-0';
    text.textContent = value || '-';
    cell.appendChild(text);
    return cell;
  }

  function statusCell(status)
  {
    const cell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `status-btn ${status === 'active' ? 'success-btn' : (status === 'suspended' ? 'close-btn' : 'warning-btn')}`;
    badge.textContent = status || 'pending';
    cell.appendChild(badge);
    return cell;
  }

  function actionCell(user)
  {
    const cell = document.createElement('td');
    const formElement = document.createElement('form');
    formElement.action = `${adminPath}/users/${encodeURIComponent(user.id)}/status`;
    formElement.method = 'POST';
    formElement.className = 'd-flex gap-2 align-items-center';
    formElement.dataset.ajax = 'false';

    const wrapper = document.createElement('div');
    wrapper.className = 'select-style-1 mb-0';
    wrapper.style.minWidth = '135px';

    const position = document.createElement('div');
    position.className = 'select-position';

    const select = document.createElement('select');
    select.name = 'status';
    select.setAttribute('aria-label', 'Account status');

    ['active', 'pending', 'suspended'].forEach(function (status)
    {
      const option = document.createElement('option');
      option.value = status;
      option.textContent = titleCase(status);
      option.selected = user.status === status;
      select.appendChild(option);
    });

    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'main-btn light-btn btn-hover btn-sm';
    button.textContent = 'Update';

    position.appendChild(select);
    wrapper.appendChild(position);
    formElement.appendChild(wrapper);
    formElement.appendChild(button);
    cell.appendChild(formElement);

    return cell;
  }

  function renderError(message)
  {
    tableBody.textContent = '';
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.innerHTML = `<p class="text-sm text-danger mb-0">${escapeHtml(message)}</p>`;
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  function updateCount(total, shown)
  {
    if (!countLabel)
    {
      return;
    }

    countLabel.textContent = total > shown ? `${shown} of ${total} users shown.` : `${shown} users shown.`;
  }

  function updateUrl(params)
  {
    const url = new URL(window.location.href);
    ['search', 'status', 'goal'].forEach(function (key)
    {
      const value = params.get(key);

      if (value)
      {
        url.searchParams.set(key, value);
      }
      else
      {
        url.searchParams.delete(key);
      }
    });

    window.history.replaceState({}, '', url.toString());
    updateExportLink(params);
  }

  function updateExportLink(params)
  {
    if (!exportLink)
    {
      return;
    }

    const url = new URL(exportLink.href, window.location.origin);
    ['search', 'status', 'goal'].forEach(function (key)
    {
      const value = params.get(key);

      if (value)
      {
        url.searchParams.set(key, value);
      }
      else
      {
        url.searchParams.delete(key);
      }
    });

    exportLink.href = url.toString();
  }

  function setLoading(isLoading)
  {
    tableBody.classList.toggle('is-loading', isLoading);
  }

  function formatDate(value)
  {
    if (!value)
    {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime()))
    {
      return '-';
    }

    return date.toLocaleDateString();
  }

  function titleCase(value)
  {
    return String(value || '').slice(0, 1).toUpperCase() + String(value || '').slice(1);
  }

  function escapeHtml(value)
  {
    return String(value || '').replace(/[&<>"']/g, function (character)
    {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[character];
    });
  }
})();
