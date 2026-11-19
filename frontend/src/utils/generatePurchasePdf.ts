import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PurchaseOrderItemData {
  id?: string;
  material?: string;
  material_name?: string;
  material_code?: string;
  unit?: string;
  unit_code?: string;
  quantity: number | string;
  unit_price: number | string;
  discount?: number | string;
  tax?: number | string;
  total?: number | string;
}

export interface PurchaseOrderData {
  id: string;
  purchase_number: string;
  planning_number?: string;
  vendor?: string;
  vendor_name?: string;
  vendor_code?: string;
  purchase_date: string;
  expected_date: string;
  payment_terms?: string;
  status: string;
  currency?: string;
  subtotal: number | string;
  discount?: number | string;
  tax?: number | string;
  freight?: number | string;
  grand_total: number | string;
  notes?: string;
  approved_by_name?: string;
  approved_at?: string;
  items?: PurchaseOrderItemData[];
}

// Convert numeric amount to words (standard Indian numbering format: Lakhs/Crores)
export const numberToWords = (num: number): string => {
  if (!num || isNaN(num) || num === 0) return 'Rupees Zero Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertChunk = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      str += b[ten] + (unit > 0 ? '-' + a[unit] : '') + ' ';
      n = 0;
    } else if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - integerPart) * 100);

  let result = '';
  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const hundred = rem;

  if (crore > 0) result += convertChunk(crore) + ' Crore ';
  if (lakh > 0) result += convertChunk(lakh) + ' Lakh ';
  if (thousand > 0) result += convertChunk(thousand) + ' Thousand ';
  if (hundred > 0) result += convertChunk(hundred) + ' ';

  result = result.trim();
  if (!result) result = 'Zero';

  let finalStr = `Rupees ${result}`;
  if (paise > 0) {
    finalStr += ` and ${convertChunk(paise)} Paise`;
  }
  return `${finalStr} Only`;
};

export const generatePurchasePdf = (po: PurchaseOrderData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Executive Top Header Banner (Corporate Deep Forest Green with Gold Accent)
  doc.setFillColor(20, 83, 45); // Forest Green (#14532D)
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
  doc.text('PURCHASE ORDER', pageWidth - 14, 12.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138); // Soft Gold
  doc.text(`PO #: ${po.purchase_number}`, pageWidth - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(241, 245, 249);
  doc.text(`PO Date: ${po.purchase_date}`, pageWidth - 14, 23, { align: 'right' });

  // 2. Structured Vendor & Order Information Block (Seamless Architectural Frame, No Grey Patch)
  const startY = 34;
  const blockHeight = 28;
  const halfWidth = (pageWidth - 28) / 2;

  // Outer border with crisp hairline, clean white background
  doc.setDrawColor(203, 213, 225); // #CBD5E1
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(14, startY, pageWidth - 28, blockHeight, 'D');

  // Center vertical dividing line
  doc.line(14 + halfWidth, startY, 14 + halfWidth, startY + blockHeight);

  // Column 1: VENDOR / SUPPLIER
  doc.setFillColor(248, 250, 252); // #F8FAFC header strip
  doc.rect(14.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('VENDOR / SUPPLIER DETAILS', 18, startY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Vendor Name:', 18, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(po.vendor_name || 'Commercial Vendor', 44, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Vendor Code:', 18, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(po.vendor_code || 'VEN-REG', 44, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Payment Terms:', 18, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235); // Blue
  doc.text(po.payment_terms || 'Net 30 Days', 44, startY + 21.5);

  // Column 2: ORDER & DELIVERY
  doc.setFillColor(248, 250, 252);
  doc.rect(14 + halfWidth + 0.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('ORDER & SHIPMENT DETAILS', 14 + halfWidth + 5, startY + 4.5);

  const col2LabelX = 14 + halfWidth + 5;
  const col2ValueX = col2LabelX + 32;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Order Status:', col2LabelX, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  const statusColor = po.status === 'COMPLETED' ? [13, 148, 136] : po.status === 'APPROVED' ? [22, 163, 74] : [37, 99, 235];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(po.status.replace(/_/g, ' '), col2ValueX, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Expected Delivery:', col2LabelX, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(po.expected_date || 'N/A', col2ValueX, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Origin Requisition:', col2LabelX, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(po.planning_number || 'Direct Purchase Requisition', col2ValueX, startY + 21.5);

  // 3. Line Items Commercial Table (Clean, Proper Header Currency, No Broken Unicode)
  const tableData = (po.items || []).map((it, idx) => {
    const qty = Number(it.quantity || 0);
    const rate = Number(it.unit_price || 0);
    const disc = Number(it.discount || 0);
    const tax = Number(it.tax || 0);
    const lineTotal = Number(it.total || qty * rate - disc + tax);

    return [
      idx + 1,
      it.material_code || `MAT-${String(idx + 1).padStart(3, '0')}`,
      it.material_name || 'Raw Material',
      qty.toLocaleString('en-IN') + ' ' + (it.unit_code || ''),
      rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      disc.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      tax.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ];
  });

  autoTable(doc, {
    startY: startY + 32,
    head: [['#', 'ITEM CODE', 'MATERIAL DESCRIPTION', 'QUANTITY', 'RATE (Rs.)', 'DISC (Rs.)', 'TAX (Rs.)', 'TOTAL (Rs.)']],
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

  // Page Overflow Guard for Amount in Words and Summary Block
  if (finalY + 45 > pageHeight - 20) {
    doc.addPage();
    finalY = 20;
  }

  // 4. Amount in Words Banner (Clean Seamless Band Across Page)
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
  doc.text(numberToWords(Number(po.grand_total || 0)), 46, finalY + 5);

  // 5. Commercial Closing Block (Terms on Left, Financial Summary on Right)
  const lowerY = finalY + 11.5;
  const summaryWidth = 74;
  const summaryX = pageWidth - 14 - summaryWidth;

  // Commercial Terms Left (Clean Typography, No Shaded Patch Box)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('COMMERCIAL TERMS & CONDITIONS:', 14, lowerY + 3.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, lowerY + 5.5, 14 + 65, lowerY + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Goods must strictly match approved technical quality and fragrance grade standards.', 14, lowerY + 10);
  doc.text('2. Please state PO Number on all invoices, delivery challans, and packing slips.', 14, lowerY + 14.5);
  doc.text('3. Material delivery must be fulfilled on or before the specified delivery date.', 14, lowerY + 19);
  doc.text(`4. Payment Terms: ${po.payment_terms || 'Net 30 Days from verified inward QC clearance'}.`, 14, lowerY + 23.5);

  // Financial Totals Table Right (Structured Clean Box)
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setFillColor(255, 255, 255);
  doc.rect(summaryX, lowerY, summaryWidth, 27, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', summaryX + 4, lowerY + 5.5);
  doc.text(`Rs. ${Number(po.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 5.5, { align: 'right' });

  doc.text('GST / Taxes:', summaryX + 4, lowerY + 10.5);
  doc.text(`Rs. ${Number(po.tax || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 10.5, { align: 'right' });

  doc.text('Freight / Transport:', summaryX + 4, lowerY + 15.5);
  doc.text(`Rs. ${Number(po.freight || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 15.5, { align: 'right' });

  // Grand Total Highlight Ribbon inside Summary Box
  doc.setFillColor(20, 83, 45); // Deep Forest Green
  doc.rect(summaryX, lowerY + 19, summaryWidth, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Grand Total:', summaryX + 4, lowerY + 24.5);
  doc.text(`Rs. ${Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, summaryX + summaryWidth - 4, lowerY + 24.5, { align: 'right' });

  // 6. Sign-off Authorization Block (Cleanly proportioned, fully visible)
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
  doc.text('PURCHASE OFFICER', 39, signY + 14.5, { align: 'center' });
  doc.text('STORES & QC MANAGER', pageWidth / 2, signY + 14.5, { align: 'center' });
  doc.text('AUTHORIZED SIGNATORY', pageWidth - 39, signY + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Prepared By)', 39, signY + 18, { align: 'center' });
  doc.text('(Verified By)', pageWidth / 2, signY + 18, { align: 'center' });
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
  doc.text(`PO Ref: ${po.purchase_number} • Computer Generated Formal PO`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  // 8. Direct Download
  doc.save(`${po.purchase_number}_PurchaseOrder.pdf`);
};
