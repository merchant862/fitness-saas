(function ()
{
  const forms = document.querySelectorAll('form[action="/billing/payment-method"], form[action="/api/billing/payment-method"]');

  forms.forEach(function (form)
  {
    const cardInput = form.querySelector('[name="cardNumber"]');
    const monthInput = form.querySelector('[name="expiryMonth"]');
    const yearInput = form.querySelector('[name="expiryYear"]');
    const cvvInput = form.querySelector('[name="cvv"]');
    const nameInput = form.querySelector('[name="cardHolderName"]');
    const brandOutput = createBrandOutput(cardInput);

    [cardInput, monthInput, yearInput, cvvInput].forEach(function (input)
    {
      if (!input)
      {
        return;
      }

      input.addEventListener('input', function ()
      {
        input.value = formatInput(input);
        updateBrand(cardInput, brandOutput);
      });
    });

    form.addEventListener('submit', function (event)
    {
      const validationError = validatePaymentForm({ cardInput, monthInput, yearInput, cvvInput, nameInput });

      if (validationError)
      {
        event.preventDefault();
        event.stopImmediatePropagation();
        showFormError(form, validationError);
      }
    }, true);
  });

  function validatePaymentForm({ cardInput, monthInput, yearInput, cvvInput, nameInput })
  {
    const cardNumber = digits(cardInput?.value);
    const brand = detectCardBrand(cardNumber);
    const month = Number(digits(monthInput?.value));
    const year = normalizeYear(digits(yearInput?.value));
    const cvv = digits(cvvInput?.value);

    if (!String(nameInput?.value || '').trim())
    {
      return 'Name on card is required.';
    }

    if (!brand)
    {
      return 'Enter a supported card number.';
    }

    if (!brand.lengths.includes(cardNumber.length))
    {
      return `${brand.label} card number must be ${brand.lengths.join(' or ')} digits.`;
    }

    if (!luhnValid(cardNumber))
    {
      return 'Card number is not valid. Please check the digits.';
    }

    if (!Number.isInteger(month) || month < 1 || month > 12)
    {
      return 'Expiry month must be between 01 and 12.';
    }

    if (!Number.isInteger(year) || String(year).length !== 4)
    {
      return 'Expiry year must be four digits.';
    }

    const now = new Date();
    const expiryCutoff = new Date(year, month, 1);

    if (expiryCutoff <= new Date(now.getFullYear(), now.getMonth(), 1))
    {
      return 'Card expiry must be a future month.';
    }

    if (!new RegExp(`^\\d{${brand.cvvLength}}$`).test(cvv))
    {
      return `${brand.label} security code must be ${brand.cvvLength} digits.`;
    }

    return null;
  }

  function createBrandOutput(cardInput)
  {
    if (!cardInput)
    {
      return null;
    }

    const output = document.createElement('p');
    output.className = 'payment-brand-hint';
    cardInput.insertAdjacentElement('afterend', output);
    return output;
  }

  function updateBrand(cardInput, output)
  {
    if (!output)
    {
      return;
    }

    const cardNumber = digits(cardInput.value);
    const brand = detectCardBrand(cardNumber);

    output.innerHTML = '';

    if (!cardNumber)
    {
      output.appendChild(brandText('Start typing your card number'));
      return;
    }

    if (!brand)
    {
      output.appendChild(brandText('Detecting card brand'));
      return;
    }

    const img = document.createElement('img');
    img.src = `/images/payment-brands/${brand.asset}.svg`;
    img.alt = brand.label;
    img.loading = 'lazy';

    output.appendChild(img);
    output.appendChild(brandText(`${brand.label} detected`));
  }

  function brandText(text)
  {
    const span = document.createElement('span');
    span.textContent = text;
    return span;
  }

  function showFormError(form, message)
  {
    let box = form.querySelector('.ajax-form-message');

    if (!box)
    {
      box = document.createElement('div');
      box.className = 'ajax-form-message';
      form.insertBefore(box, form.firstElementChild);
    }

    box.textContent = message;
    box.className = 'ajax-form-message is-visible is-error';
  }

  function formatInput(input)
  {
    const value = digits(input.value);

    if (input.name === 'cardNumber')
    {
      return value.slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
    }

    if (input.name === 'expiryYear')
    {
      return value.slice(0, 4);
    }

    if (input.name === 'cvv')
    {
      return value.slice(0, 4);
    }

    return value.slice(0, 2);
  }

  function detectCardBrand(cardNumber)
  {
    if (/^4/.test(cardNumber))
    {
      return brand('visa', 'Visa', [13, 16, 19], 3);
    }

    if (/^(5[1-5]|2[2-7])/.test(cardNumber) && mastercardInRange(cardNumber))
    {
      return brand('mastercard', 'Mastercard', [16], 3);
    }

    if (/^3[47]/.test(cardNumber))
    {
      return brand('amex', 'American Express', [15], 4);
    }

    if (jcbInRange(cardNumber))
    {
      return brand('jcb', 'JCB', [16, 17, 18, 19], 3);
    }

    if (dinersInRange(cardNumber))
    {
      return brand('diners', 'Diners Club', [14, 16, 19], 3);
    }

    if (eloInRange(cardNumber))
    {
      return brand('elo', 'Elo', [16], 3);
    }

    if (/^(606282|3841)/.test(cardNumber))
    {
      return brand('hipercard', 'Hipercard', [13, 16, 19], 3);
    }

    if (/^62/.test(cardNumber))
    {
      return brand('unionpay', 'UnionPay', [16, 17, 18, 19], 3);
    }

    if (discoverInRange(cardNumber))
    {
      return brand('discover', 'Discover', [16, 19], 3);
    }

    if (maestroInRange(cardNumber))
    {
      return brand('maestro', 'Maestro', [12, 13, 14, 15, 16, 17, 18, 19], 3);
    }

    return null;
  }

  function brand(asset, label, lengths, cvvLength)
  {
    return { asset, label, lengths, cvvLength };
  }

  function mastercardInRange(cardNumber)
  {
    const firstTwo = Number(cardNumber.slice(0, 2));
    const firstSix = Number(cardNumber.slice(0, 6));

    return (firstTwo >= 51 && firstTwo <= 55) || (firstSix >= 222100 && firstSix <= 272099);
  }

  function discoverInRange(cardNumber)
  {
    const firstTwo = Number(cardNumber.slice(0, 2));
    const firstThree = Number(cardNumber.slice(0, 3));
    const firstFour = Number(cardNumber.slice(0, 4));
    const firstSix = Number(cardNumber.slice(0, 6));

    return firstFour === 6011 ||
      firstTwo === 65 ||
      (firstThree >= 644 && firstThree <= 649) ||
      (firstSix >= 622126 && firstSix <= 622925);
  }

  function jcbInRange(cardNumber)
  {
    const firstFour = Number(cardNumber.slice(0, 4));
    return firstFour >= 3528 && firstFour <= 3589;
  }

  function dinersInRange(cardNumber)
  {
    const firstTwo = Number(cardNumber.slice(0, 2));
    const firstThree = Number(cardNumber.slice(0, 3));
    const firstFour = Number(cardNumber.slice(0, 4));

    return (firstThree >= 300 && firstThree <= 305) ||
      firstTwo === 36 ||
      firstTwo === 38 ||
      firstTwo === 39 ||
      firstFour === 3095;
  }

  function maestroInRange(cardNumber)
  {
    return /^(50|5[6-9]|6[0-9])/.test(cardNumber);
  }

  function eloInRange(cardNumber)
  {
    return /^(401178|401179|431274|438935|451416|457393|457631|457632|504175|5067|5090|627780|636297|636368|6500|6504|6505|6507|6509|6516|6550)/.test(cardNumber);
  }

  function luhnValid(cardNumber)
  {
    let sum = 0;
    let doubleDigit = false;

    for (let index = cardNumber.length - 1; index >= 0; index -= 1)
    {
      let digit = Number(cardNumber[index]);

      if (doubleDigit)
      {
        digit *= 2;

        if (digit > 9)
        {
          digit -= 9;
        }
      }

      sum += digit;
      doubleDigit = !doubleDigit;
    }

    return sum > 0 && sum % 10 === 0;
  }

  function normalizeYear(value)
  {
    if (value.length === 2)
    {
      return Number(`20${value}`);
    }

    return Number(value);
  }

  function digits(value)
  {
    return String(value || '').replace(/\D/g, '');
  }
})();
