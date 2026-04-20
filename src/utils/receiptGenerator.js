/**
 * Receipt Generator Utility
 * Generates a thermal-style HTML receipt for printing via browser Print API.
 */

export const generateReceiptHTML = ({
  shopName = 'SmartPOS',
  address = '',
  phone = '',
  orderId = '',
  cashierName = 'Staff',
  customerName = '',
  items = [],
  subtotal = 0,
  taxRate = 0,
  tax = 0,
  total = 0,
  paymentMethod = 'Cash',
  amountTendered = 0,
  change = 0,
  date = new Date()
}) => {
  const dateStr = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formatMoney = (amount) => {
    return `Rs. ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 2px 0; font-size: 12px;">${item.name}</td>
      <td style="padding: 2px 4px; text-align: center; font-size: 12px;">${item.quantity}</td>
      <td style="padding: 2px 0; text-align: right; font-size: 12px;">${formatMoney(item.price)}</td>
      <td style="padding: 2px 0; text-align: right; font-size: 12px; font-weight: bold;">${formatMoney(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Receipt - ${orderId}</title>
  <style>
    @media print {
      @page {
        margin: 0;
        size: 80mm auto;
      }
      body { margin: 0; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      max-width: 300px;
      margin: 0 auto;
      padding: 12px;
      color: #111;
      background: #fff;
    }
    .divider {
      border: none;
      border-top: 1px dashed #999;
      margin: 8px 0;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .shop-name {
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 1px;
      text-align: center;
      margin-bottom: 2px;
    }
    .shop-info {
      font-size: 10px;
      color: #555;
      text-align: center;
      line-height: 1.4;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #444;
    }
    table { width: 100%; border-collapse: collapse; }
    th {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #888;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      padding: 2px 0;
    }
    .grand-total {
      font-size: 18px;
      font-weight: 900;
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-top: 2px solid #111;
      border-bottom: 2px solid #111;
      margin: 4px 0;
    }
    .footer {
      text-align: center;
      font-size: 10px;
      color: #888;
      margin-top: 12px;
      line-height: 1.6;
    }
    .payment-badge {
      display: inline-block;
      background: #111;
      color: #fff;
      padding: 2px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="shop-name">${shopName}</div>
  <div class="shop-info">
    ${address ? `${address}<br>` : ''}
    ${phone ? `Tel: ${phone}` : ''}
  </div>

  <hr class="divider">

  <div class="meta-row">
    <span>${dateStr}</span>
    <span>${timeStr}</span>
  </div>
  <div class="meta-row">
    <span>Order: #${orderId.slice(-8).toUpperCase()}</span>
    <span>Cashier: ${cashierName}</span>
  </div>
  ${customerName ? `<div class="meta-row"><span>Customer: ${customerName}</span></div>` : ''}

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th style="text-align: left;">Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Price</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <hr class="divider">

  <div class="total-row">
    <span>Subtotal</span>
    <span class="bold">${formatMoney(subtotal)}</span>
  </div>
  <div class="total-row">
    <span>Tax (${(taxRate * 100).toFixed(1)}%)</span>
    <span>${formatMoney(tax)}</span>
  </div>

  <div class="grand-total">
    <span>TOTAL</span>
    <span>${formatMoney(total)}</span>
  </div>

  <div class="center" style="margin: 8px 0;">
    <span class="payment-badge">${paymentMethod}</span>
  </div>

  ${paymentMethod === 'Cash' ? `
    <div class="total-row">
      <span>Tendered</span>
      <span class="bold">${formatMoney(amountTendered)}</span>
    </div>
    <div class="total-row">
      <span>Change</span>
      <span class="bold">${formatMoney(change)}</span>
    </div>
  ` : ''}

  <hr class="divider">

  <div class="footer">
    Thank you for your purchase!<br>
    Please come again ★<br>
    <span style="font-size: 9px; color: #bbb;">Powered by SmartPOS</span>
  </div>
</body>
</html>`;
};
