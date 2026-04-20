/**
 * Thermal Printer Utility
 * 
 * Sends ESC/POS commands directly to thermal receipt printers via:
 * 1. Web Serial API (Chrome/Edge 89+) — for USB/Serial printers
 * 2. Fallback: silent window.print() with auto-close iframe
 * 
 * ESC/POS is the standard command language for thermal receipt printers.
 */

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;
const LF = 0x0A;

// Text encoder for converting strings to bytes
const encoder = new TextEncoder();

/**
 * Build ESC/POS binary command buffer for a receipt
 */
export const buildEscPosReceipt = ({
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
  const commands = [];

  const addText = (text) => commands.push(...encoder.encode(text));
  const addByte = (...bytes) => commands.push(...bytes);
  const newLine = () => addByte(LF);
  const addLine = (text) => { addText(text); newLine(); };

  // Initialize printer
  addByte(ESC, 0x40); // ESC @ - Initialize

  // Center alignment
  addByte(ESC, 0x61, 0x01);

  // Bold + Double size for shop name
  addByte(ESC, 0x45, 0x01); // Bold ON
  addByte(GS, 0x21, 0x11);  // Double width + height
  addLine(shopName);
  addByte(GS, 0x21, 0x00);  // Normal size
  addByte(ESC, 0x45, 0x00); // Bold OFF

  if (address) addLine(address);
  if (phone) addLine(`Tel: ${phone}`);

  // Divider
  addLine('--------------------------------');

  // Left alignment
  addByte(ESC, 0x61, 0x00);

  // Date & Time
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  addLine(`${dateStr}          ${timeStr}`);
  addLine(`Order: #${orderId.slice(-8).toUpperCase()}`);
  addLine(`Cashier: ${cashierName}`);
  if (customerName) addLine(`Customer: ${customerName}`);

  addLine('--------------------------------');

  // Column headers
  addByte(ESC, 0x45, 0x01); // Bold ON
  addLine(padColumns('Item', 'Qty', 'Total'));
  addByte(ESC, 0x45, 0x00); // Bold OFF
  addLine('--------------------------------');

  // Items
  for (const item of items) {
    const lineTotal = formatMoney(item.price * item.quantity);
    addLine(padColumns(
      item.name.substring(0, 16),
      String(item.quantity),
      lineTotal
    ));
  }

  addLine('--------------------------------');

  // Totals
  addLine(padRight('Subtotal:', formatMoney(subtotal)));
  addLine(padRight(`Tax (${(taxRate * 100).toFixed(1)}%):`, formatMoney(tax)));

  addLine('================================');
  addByte(ESC, 0x45, 0x01); // Bold ON
  addByte(GS, 0x21, 0x01);  // Double height
  addLine(padRight('TOTAL:', formatMoney(total)));
  addByte(GS, 0x21, 0x00);  // Normal size
  addByte(ESC, 0x45, 0x00); // Bold OFF
  addLine('================================');

  // Payment info
  addByte(ESC, 0x61, 0x01); // Center
  addLine(`[ ${paymentMethod.toUpperCase()} ]`);
  addByte(ESC, 0x61, 0x00); // Left

  if (paymentMethod === 'Cash') {
    addLine(padRight('Tendered:', formatMoney(amountTendered)));
    addLine(padRight('Change:', formatMoney(change)));
  }

  addLine('--------------------------------');

  // Footer
  addByte(ESC, 0x61, 0x01); // Center
  addLine('Thank you for your purchase!');
  addLine('Please come again');
  addLine('');
  addLine('Powered by SmartPOS');
  newLine();
  newLine();

  // Cut paper (partial cut)
  addByte(GS, 0x56, 0x01);

  return new Uint8Array(commands);
};

// Helper: pad columns for receipt (32 char width)
function padColumns(left, center, right) {
  const width = 32;
  const centerStr = ` ${center} `;
  const available = width - centerStr.length;
  const leftPad = Math.floor(available / 2);
  const rightPad = available - leftPad;
  
  const l = left.substring(0, leftPad).padEnd(leftPad);
  const r = right.substring(0, rightPad).padStart(rightPad);
  
  return l + centerStr + r;
}

function padRight(label, value) {
  const width = 32;
  const available = width - label.length;
  return label + value.padStart(available);
}

function formatMoney(amount) {
  return `Rs.${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ============================================================
// PRINTER CONNECTION & SENDING
// ============================================================

let serialPort = null;
let serialWriter = null;

/**
 * Check if Web Serial API is supported
 */
export const isSerialSupported = () => {
  return 'serial' in navigator;
};

/**
 * Connect to thermal printer via Web Serial API
 * @returns {Promise<boolean>} true if connected successfully
 */
export const connectPrinter = async () => {
  if (!isSerialSupported()) {
    throw new Error('Web Serial API not supported. Use Chrome or Edge browser.');
  }

  try {
    // Request port (shows browser picker)
    serialPort = await navigator.serial.requestPort();
    
    // Open with standard thermal printer baud rate
    await serialPort.open({ baudRate: 9600 });
    
    const writable = serialPort.writable;
    serialWriter = writable.getWriter();
    
    return true;
  } catch (error) {
    if (error.name === 'NotFoundError') {
      throw new Error('No printer selected. Please select your thermal printer.');
    }
    throw error;
  }
};

/**
 * Disconnect from printer
 */
export const disconnectPrinter = async () => {
  try {
    if (serialWriter) {
      serialWriter.releaseLock();
      serialWriter = null;
    }
    if (serialPort) {
      await serialPort.close();
      serialPort = null;
    }
  } catch {
    // Ignore close errors
  }
};

/**
 * Check if printer is connected
 */
export const isPrinterConnected = () => {
  return serialPort !== null && serialWriter !== null;
};

/**
 * Send ESC/POS data directly to the thermal printer (no dialog)
 * @param {Uint8Array} data - ESC/POS command buffer
 */
export const printDirect = async (data) => {
  if (!isPrinterConnected()) {
    throw new Error('Printer not connected. Please connect your thermal printer first.');
  }

  try {
    await serialWriter.write(data);
  } catch {
    // If write fails, try reconnecting
    serialWriter = null;
    serialPort = null;
    throw new Error('Print failed. Printer may be disconnected.');
  }
};

/**
 * Print receipt directly to thermal printer (no dialog)
 * Falls back to iframe printing if Serial API not available/connected
 */
export const printReceipt = async (orderData, receiptHTML) => {
  // Try direct thermal printing first
  if (isPrinterConnected()) {
    const escPosData = buildEscPosReceipt(orderData);
    await printDirect(escPosData);
    return 'direct';
  }

  // Fallback: use iframe + silent print
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHTML);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Clean up iframe after print dialog closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      resolve('iframe');
    }, 300);
  });
};
