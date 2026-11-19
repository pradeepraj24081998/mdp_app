import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { numberToWords } from './generatePurchasePdf';

export interface SalesOrderItemData {
  id?: string;
  product?: string;
  product_name?: string;
  product_code?: string;
  quantity: number | string;
  rate: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
}

export interface SalesOrderInvoiceData {
  id: string;
  sales_order_number: string;
  invoice_number?: string;
  customer?: string;
  customer_name?: string;
  customer_code?: string;
  order_date: string;
  delivery_date?: string;
  payment_type?: string;
  status: string;
  subtotal: number | string;
  discount?: number | string;
  tax?: number | string;
  grand_total: number | string;
  notes?: string;
  items?: SalesOrderItemData[];
}

export const generateInvoicePdf = (order: SalesOrderInvoiceData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const invoiceNumber = order.invoice_number || `INV-${order.sales_order_number?.replace('SO-', '') || '000124'}`;
  const invoiceDate = order.order_date || new Date().toISOString().split('T')[0];

  // 1. Executive Top Header Banner (Corporate Deep Forest Green with Gold Accent)
  doc.setFillColor(20, 83, 45); // Deep Forest Green (#14532D)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Thin Warm Gold Accent Bar
  doc.setFillColor(180, 83, 9); // Warm Gold (#B45309)
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Company Branding Left
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('MDP AROMA', 14, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240);
  doc.text('Premium Incense, Agarbatti & Fragrance Manufacturing ERP', 14, 18);
  doc.setTextColor(203, 213, 225);
  doc.text('Plot 42, Fragrance Industrial Zone, Bangalore - 560099 | GSTIN: 29ABCDE1234F1Z5', 14, 23);

  // Document Title & Metadata Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - 14, 12.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138); // Soft Gold
  doc.text(`INV #: ${invoiceNumber}`, pageWidth - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(241, 245, 249);
  doc.text(`Date: ${invoiceDate}`, pageWidth - 14, 23, { align: 'right' });

  // 2. Structured Customer & Dispatch Information Block
  const startY = 34;
  const blockHeight = 28;
  const halfWidth = (pageWidth - 28) / 2;

  // Outer border with crisp hairline, clean white background
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(14, startY, pageWidth - 28, blockHeight, 'D');

  // Center vertical dividing line
  doc.line(14 + halfWidth, startY, 14 + halfWidth, startY + blockHeight);

  // Column 1: BILLED TO / CUSTOMER
  doc.setFillColor(248, 250, 252);
  doc.rect(14.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('BILLED TO / CUSTOMER DETAILS', 18, startY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Customer:', 18, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.customer_name || 'Commercial Dealer', 44, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Customer Code:', 18, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(order.customer_code || 'CUST-REG', 44, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Terms:', 18, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(order.payment_type || 'Advance / Net 30', 44, startY + 21.5);

  // Column 2: INVOICE & DISPATCH DETAILS
  doc.setFillColor(248, 250, 252);
  doc.rect(14 + halfWidth + 0.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('INVOICE & DISPATCH DETAILS', 14 + halfWidth + 5, startY + 4.5);

  const col2LabelX = 14 + halfWidth + 5;
  const col2ValueX = col2LabelX + 32;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Order Ref:', col2LabelX, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(order.sales_order_number || 'Direct', col2ValueX, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Delivery Date:', col2LabelX, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text(order.delivery_date || order.order_date || 'N/A', col2ValueX, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Invoice Status:', col2LabelX, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('ISSUED / CONFIRMED', col2ValueX, startY + 21.5);

  // 3. Line Items Commercial Table
  const tableData = (order.items || []).map((it, idx) => {
    const qty = Number(it.quantity || 0);
    const rate = Number(it.rate || 0);
    const disc = Number(it.discount || 0);
    const tax = Number(it.tax || 0);
    const lineTotal = Number(it.total || qty * rate - disc + tax);

    return [
      idx + 1,
      it.product_code || `FG-${String(idx + 1).padStart(3, '0')}`,
      it.product_name || 'Finished Goods Product',
      qty.toLocaleString('en-IN') + ' Units',
      rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      disc.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      tax.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ];
  });

  autoTable(doc, {
    startY: startY + 32,
    head: [['#', 'PRODUCT CODE', 'DESCRIPTION', 'QUANTITY', 'RATE (Rs.)', 'DISC (Rs.)', 'TAX (Rs.)', 'TOTAL (Rs.)']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [20, 83, 45],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 26, fontStyle: 'bold', textColor: [37, 99, 235] },
      2: { cellWidth: 'auto', fontStyle: 'bold' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
    },
    margin: { left: 14, right: 14 },
  });

  let finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : 140;

  if (finalY + 45 > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }

  // 4. Amount in Words Banner
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.setFillColor(248, 250, 252);
  doc.rect(14, finalY, pageWidth - 28, 7.5, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Amount in Words:', 17, finalY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(numberToWords(Number(order.grand_total || 0)), 46, finalY + 5);

  // 5. Commercial Closing Block
  const lowerY = finalY + 11.5;
  const summaryWidth = 74;
  const summaryX = pageWidth - 14 - summaryWidth;

  // Invoice Declarations Left
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DECLARATION & TERMS:', 14, lowerY + 3.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, lowerY + 5.5, 14 + 55, lowerY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('1. We declare that this invoice shows the actual price of the goods described.', 14, lowerY + 10);
  doc.text('2. Goods once sold will not be accepted back after 7 days of verified dispatch.', 14, lowerY + 14.5);
  doc.text('3. Interest @ 18% p.a. will be levied on overdue payments beyond credit term.', 14, lowerY + 19);
  doc.text('4. All disputes are subject to Bangalore jurisdiction only.', 14, lowerY + 23.5);

  // Financial Totals Table Right
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(summaryX, lowerY, summaryWidth, 27, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', summaryX + 4, lowerY + 5.5);
  doc.text(`Rs. ${Number(order.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 5.5, { align: 'right' });

  doc.text('Taxes / GST:', summaryX + 4, lowerY + 10.5);
  doc.text(`Rs. ${Number(order.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 10.5, { align: 'right' });

  doc.text('Discounts:', summaryX + 4, lowerY + 15.5);
  doc.text(`Rs. ${Number(order.discount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 15.5, { align: 'right' });

  // Grand Total Highlight Ribbon inside Summary Box
  doc.setFillColor(20, 83, 45); // Deep Forest Green
  doc.rect(summaryX, lowerY + 19, summaryWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Invoice Total:', summaryX + 4, lowerY + 24.5);
  doc.text(`Rs. ${Number(order.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 24.5, { align: 'right' });

  // 6. Sign-off Authorization Block
  let signY = lowerY + 36;
  if (signY + 25 > pageHeight - 15) {
    doc.addPage();
    signY = 20;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);

  // Three signature lines
  doc.line(16, signY + 10, 62, signY + 10);
  doc.line(pageWidth / 2 - 23, signY + 10, pageWidth / 2 + 23, signY + 10);
  doc.line(pageWidth - 62, signY + 10, pageWidth - 16, signY + 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PREPARED BY', 39, signY + 14.5, { align: 'center' });
  doc.text('DISPATCH OFFICER', pageWidth / 2, signY + 14.5, { align: 'center' });
  doc.text('AUTHORIZED SIGNATORY', pageWidth - 39, signY + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Accounts Department)', 39, signY + 18, { align: 'center' });
  doc.text('(Finished Goods Store)', pageWidth / 2, signY + 18, { align: 'center' });
  doc.text('(For MDP Aroma)', pageWidth - 39, signY + 18, { align: 'center' });

  // 7. Clean Document Footer
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const printTimestamp = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.text(`Generated on ${printTimestamp} • MDP Aroma Enterprise Resource Planning`, 14, pageHeight - 6);
  doc.text(`Invoice Ref: ${invoiceNumber} • Computer Generated Tax Invoice`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  // 8. Direct Download
  doc.save(`${invoiceNumber}_TaxInvoice.pdf`);
};
