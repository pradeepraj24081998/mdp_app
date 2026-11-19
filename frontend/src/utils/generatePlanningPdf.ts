import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PlanItem {
  id?: string;
  material: string;
  material_name?: string;
  material_code?: string;
  quantity: number | string;
  unit?: string;
  unit_code?: string;
  unit_price?: number | string;
  notes?: string;
}

export interface PlanData {
  id: string;
  planning_number: string;
  planning_date: string;
  required_date: string;
  vendor?: string;
  vendor_name?: string;
  vendor_code?: string;
  status: string;
  notes?: string;
  created_by_name?: string;
  created_at?: string;
  items?: PlanItem[];
}

export const generatePlanningPdf = (plan: PlanData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

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
  doc.text('Plot 42, Fragrance Industrial Zone, Bangalore - 560099 | Factory Production Requisition', 14, 23);

  // Document Title & Metadata Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('MATERIAL REQUISITION', pageWidth - 14, 12.5, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setTextColor(254, 240, 138); // Soft Gold
  doc.text(`PLAN #: ${plan.planning_number}`, pageWidth - 14, 18, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(241, 245, 249);
  doc.text(`Date: ${plan.planning_date}`, pageWidth - 14, 23, { align: 'right' });

  // 2. Structured Requisition Details Block (Seamless Architectural Frame, No Grey Patch)
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

  // Column 1: REQUISITION DETAILS
  doc.setFillColor(248, 250, 252);
  doc.rect(14.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('REQUISITION & SCHEDULE', 18, startY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Requisition No:', 18, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(plan.planning_number, 44, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Planning Date:', 18, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(plan.planning_date || 'N/A', 44, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Required Date:', 18, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38);
  doc.text(plan.required_date || 'N/A', 44, startY + 21.5);

  // Column 2: SUPPLIER & STATUS
  doc.setFillColor(248, 250, 252);
  doc.rect(14 + halfWidth + 0.3, startY + 0.3, halfWidth - 0.6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('PREFERRED SUPPLIER & STATUS', 14 + halfWidth + 5, startY + 4.5);

  const col2LabelX = 14 + halfWidth + 5;
  const col2ValueX = col2LabelX + 32;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Preferred Vendor:', col2LabelX, startY + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(plan.vendor_name || 'Open Market / Multiple Shops', col2ValueX, startY + 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Plan Status:', col2LabelX, startY + 16.5);
  doc.setFont('helvetica', 'bold');
  const statusColor = plan.status === 'PURCHASE_CREATED' ? [13, 148, 136] : plan.status === 'APPROVED' ? [22, 163, 74] : [37, 99, 235];
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.text(plan.status.replace(/_/g, ' '), col2ValueX, startY + 16.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Procurement Stage:', col2LabelX, startY + 21.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text(plan.status === 'PURCHASE_CREATED' ? 'Transferred to Purchase Order' : 'Material Plan Formulation', col2ValueX, startY + 21.5);

  // 3. Materials Table (Clean, Proper Column Widths, No Prices)
  const tableData = (plan.items || []).map((it, idx) => [
    idx + 1,
    it.material_code || `MAT-${String(idx + 1).padStart(3, '0')}`,
    it.material_name || 'Raw Material',
    Number(it.quantity || 0).toLocaleString('en-IN'),
    it.unit_code || 'Units',
    'Standard Factory Production Requisition',
  ]);

  const totalQty = (plan.items || []).reduce((acc, it) => acc + Number(it.quantity || 0), 0);

  autoTable(doc, {
    startY: startY + 32,
    head: [['#', 'ITEM CODE', 'MATERIAL DESCRIPTION', 'REQUIRED QTY', 'UNIT', 'SPECIFICATION / NOTES']],
    body: tableData,
    foot: [
      ['', '', `TOTAL: ${(plan.items || []).length} Items`, totalQty.toLocaleString('en-IN'), 'Units Total', ''],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [20, 83, 45],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 3,
    },
    footStyles: {
      fillColor: [248, 250, 252],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: 'bold',
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
      3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 46, textColor: [100, 116, 139] },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : 140;

  // 4. Instructions & Notice (Clean Architecture, No Patch Box)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('INTERNAL REQUISITION NOTICE:', 14, finalY + 4.5);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, finalY + 6.5, 14 + 55, finalY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('1. This document is a formal factory production requisition for raw and packaging materials.', 14, finalY + 11.5);
  doc.text('2. Pricing, vendor discount terms, GST taxes, and transport rates apply when converted to a formal Purchase Order.', 14, finalY + 16);
  doc.text('3. Inward store inspection will verify delivered items against these approved specification quantities.', 14, finalY + 20.5);

  // 5. Sign-off Authorization Block
  const signY = Math.min(finalY + 34, pageHeight - 34);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);

  // Three signature lines
  doc.line(16, signY + 10, 62, signY + 10);
  doc.line(pageWidth / 2 - 23, signY + 10, pageWidth / 2 + 23, signY + 10);
  doc.line(pageWidth - 62, signY + 10, pageWidth - 16, signY + 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PRODUCTION PLANNER', 39, signY + 14.5, { align: 'center' });
  doc.text('STORE IN-CHARGE', pageWidth / 2, signY + 14.5, { align: 'center' });
  doc.text('PURCHASE HEAD', pageWidth - 39, signY + 14.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('(Prepared By)', 39, signY + 18, { align: 'center' });
  doc.text('(Verified By)', pageWidth / 2, signY + 18, { align: 'center' });
  doc.text('(Approved By)', pageWidth - 39, signY + 18, { align: 'center' });

  // 6. Clean Document Footer
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
  doc.text(`Requisition Ref: ${plan.planning_number} • Internal Manufacturing Document`, pageWidth - 14, pageHeight - 6, { align: 'right' });

  // 7. Save & Download the PDF
  doc.save(`${plan.planning_number}_Requisition.pdf`);
};
