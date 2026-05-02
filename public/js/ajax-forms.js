(function ()
{
  const forms = document.querySelectorAll('form');

  forms.forEach(function (form)
  {
    const method = String(form.getAttribute('method') || 'GET').toUpperCase();

    if (method === 'GET' || form.dataset.ajax === 'false' || form.hasAttribute('data-coach-form'))
    {
      return;
    }

    form.addEventListener('submit', function (event)
    {
      event.preventDefault();
      submitAjaxForm(form, method);
    });
  });

  async function submitAjaxForm(form, method)
  {
    const submitButton = form.querySelector('[type="submit"]');
    const messageBox = ensureMessageBox(form);
    const originalText = submitButton ? submitButton.textContent : '';

    setMessage(messageBox, '', '');
    setBusy(submitButton, true, originalText);

    try
    {
      const response = await fetch(form.action, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams(new FormData(form)).toString()
      });

      const payload = await response.json().catch(function ()
      {
        return {};
      });

      if (!response.ok || payload.ok === false)
      {
        if (payload.redirectTo)
        {
          setMessage(messageBox, '', '');
          setTimeout(function ()
          {
            window.location.assign(new URL(payload.redirectTo, window.location.origin).toString());
          }, 250);
          return;
        }

        throw new Error(payload.error || payload.message || 'Please check the form and try again.');
      }

      setMessage(messageBox, payload.message || 'Saved successfully.', 'success');

      if (form.dataset.successRedirect)
      {
        const delay = Number(form.dataset.successRedirectDelay || 3000);

        setTimeout(function ()
        {
          window.location.assign(new URL(form.dataset.successRedirect, window.location.origin).toString());
        }, Number.isFinite(delay) ? delay : 3000);
        return;
      }

      if (payload.redirectTo)
      {
        const nextUrl = new URL(payload.redirectTo, window.location.origin);

        if (nextUrl.pathname === window.location.pathname && nextUrl.search === window.location.search)
        {
          return;
        }

        setTimeout(function ()
        {
          window.location.assign(nextUrl.toString());
        }, 450);
        return;
      }

      if (payload.refreshPage)
      {
        setTimeout(function ()
        {
          window.location.reload();
        }, 450);
      }
    }
    catch (error)
    {
      setMessage(messageBox, error.message || 'Please check the form and try again.', 'error');
    }
    finally
    {
      setBusy(submitButton, false, originalText);
    }
  }

  function ensureMessageBox(form)
  {
    const existing = form.querySelector('.ajax-form-message');

    if (existing)
    {
      return existing;
    }

    const box = document.createElement('div');
    box.className = 'ajax-form-message';
    form.insertBefore(box, form.firstElementChild);
    return box;
  }

  function setMessage(box, message, type)
  {
    box.textContent = message;
    box.className = 'ajax-form-message';

    if (message)
    {
      box.classList.add('is-visible', type === 'error' ? 'is-error' : 'is-success');
    }
  }

  function setBusy(button, isBusy, originalText)
  {
    if (!button)
    {
      return;
    }

    button.disabled = isBusy;
    button.textContent = isBusy ? 'Please wait...' : originalText;
  }
})();
