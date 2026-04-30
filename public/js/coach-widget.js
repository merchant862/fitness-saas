(function ()
{
  const widget = document.querySelector('[data-coach-widget]');

  if (!widget)
  {
    return;
  }

  const toggle = widget.querySelector('[data-coach-toggle]');
  const close = widget.querySelector('[data-coach-close]');
  const panel = widget.querySelector('[data-coach-panel]');
  const form = widget.querySelector('[data-coach-form]');
  const input = widget.querySelector('[data-coach-input]');
  const messages = widget.querySelector('[data-coach-messages]');
  const error = widget.querySelector('[data-coach-error]');
  const prompts = widget.querySelectorAll('[data-coach-prompt]');

  toggle.addEventListener('click', function ()
  {
    widget.classList.toggle('open');
    panel.setAttribute('aria-hidden', widget.classList.contains('open') ? 'false' : 'true');

    if (widget.classList.contains('open'))
    {
      input.focus();
    }
  });

  close.addEventListener('click', function ()
  {
    widget.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
  });

  prompts.forEach(function (button)
  {
    button.addEventListener('click', function ()
    {
      input.value = button.getAttribute('data-coach-prompt') || '';
      input.focus();
    });
  });

  form.addEventListener('submit', async function (event)
  {
    event.preventDefault();

    const message = normalizeInput(input.value);

    if (!message)
    {
      showError('Ask AI about workouts, meals, exercises, macros, hydration, or consistency.');
      return;
    }

    showError('');
    appendMessage('user', message);
    input.value = '';
    setBusy(true);

    try
    {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const payload = await response.json().catch(function ()
      {
        return {};
      });

      if (!response.ok)
      {
        throw new Error(payload.error || 'AI Coach is unavailable right now.');
      }

      appendMessage('assistant', payload.reply || 'Ask me about your workout, meals, or progress.');
    }
    catch (requestError)
    {
      showError(requestError.message || 'AI Coach is unavailable right now.');
    }
    finally
    {
      setBusy(false);
    }
  });

  function appendMessage(type, text)
  {
    const node = document.createElement('div');
    node.className = `coach-message coach-message-${type}`;
    node.textContent = text;
    messages.appendChild(node);
    messages.scrollTop = messages.scrollHeight;
  }

  function normalizeInput(value)
  {
    return String(value || '')
      .replace(/[<>`{}[\]\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  }

  function showError(message)
  {
    error.textContent = message || '';
  }

  function setBusy(isBusy)
  {
    input.disabled = isBusy;
    form.querySelector('button[type="submit"]').disabled = isBusy;
  }
})();
