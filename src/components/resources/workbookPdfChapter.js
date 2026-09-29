import { pageHeader, heading, paragraph, field, blue } from '@/components/resources/workbookPdfLayout';

export default function workbookPdfChapter(doc, chapter, index, origin) {
  doc.addPage(); pageHeader(doc, `The seven opportunities / ${String(index + 1).padStart(2, '0')}`, index + 3);
  let y = heading(doc, chapter.title, 49);
  y = paragraph(doc, chapter.outcome, y, 11);
  y = heading(doc, 'Put it into practice', y, 12);
  chapter.steps.forEach((step, i) => { y = paragraph(doc, `${i + 1}. ${step}`, y, 9); });
  y = heading(doc, 'Worked example', y, 12); y = paragraph(doc, chapter.example, y, 9);
  y = paragraph(doc, `Measure: ${chapter.metric}`, y, 9);
  y = heading(doc, 'Try this AI prompt', y, 12); y = paragraph(doc, chapter.prompt, y, 8.5);
  y = paragraph(doc, chapter.exercise, y, 9);
  y = field(doc, `chapter_${index + 1}_action`, 'YOUR ACTION / OWNER / REVIEW DATE', y, 20);
  doc.setFontSize(9); doc.setTextColor(...blue); doc.textWithLink(`Explore ${chapter.service}`, 20, Math.max(y, 265), { url: `${origin}/services#${chapter.serviceId}` });
}