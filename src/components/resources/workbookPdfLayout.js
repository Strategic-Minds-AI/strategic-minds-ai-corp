import { AcroFormTextField } from 'jspdf';

export const ink = [17, 28, 48], blue = [0, 89, 255], soft = [239, 245, 255];
export function pageHeader(doc, label, page) {
  doc.setFillColor(...blue); doc.rect(0, 0, 210, 4, 'F');
  doc.setDrawColor(...blue); doc.setLineWidth(0.7); doc.triangle(20, 22, 25, 12, 30, 22, 'S'); doc.triangle(27, 24, 31, 16, 35, 24, 'S');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...ink); doc.text('STRATEGIC MINDS AI', 41, 19);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(label.toUpperCase(), 20, 34);
  doc.setDrawColor(217, 227, 242); doc.line(20, 275, 190, 275);
  doc.setFontSize(8); doc.setTextColor(80, 96, 119); doc.text('Strategy first. Intelligence applied.', 20, 282); doc.text(String(page).padStart(2, '0'), 190, 282, { align: 'right' });
}
export function paragraph(doc, text, y, size = 10, width = 170) {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...ink);
  const lines = doc.splitTextToSize(text, width); doc.text(lines, 20, y, { lineHeightFactor: 1.4 });
  return y + lines.length * size * 0.3528 * 1.4 + 3;
}
export function heading(doc, text, y, size = 20) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(size); doc.setTextColor(...ink);
  const lines = doc.splitTextToSize(text, 170); doc.text(lines, 20, y);
  return y + lines.length * size * 0.4 + 5;
}
export function field(doc, name, label, y, height = 24) {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...ink); doc.text(label, 20, y);
  doc.setFillColor(...soft); doc.rect(20, y + 4, 170, height, 'F');
  const input = new AcroFormTextField(); input.fieldName = name; input.Rect = [20, y + 4, 170, height]; input.multiline = height > 12; input.fontSize = 10; input.maxLength = 900;
  doc.addField(input); return y + height + 14;
}