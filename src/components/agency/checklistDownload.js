import { jsPDF } from 'jspdf';
import { workbookChapters } from '@/components/resources/workbookContent';
import { pageHeader, heading, paragraph, field, blue, soft } from '@/components/resources/workbookPdfLayout';
import workbookPdfChapter from '@/components/resources/workbookPdfChapter';

export default function downloadChecklist() {
  const doc = new jsPDF();
  const origin = window.location.origin;
  doc.setProperties({ title: '7 Ways to Improve Your Business | Strategic Minds AI', author: 'Strategic Minds AI', subject: 'Business improvement workbook with examples and fillable action plans' });
  pageHeader(doc, 'Business improvement workbook / 2026 edition', 1);
  doc.setFillColor(...soft); doc.rect(20, 45, 170, 87, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(54); doc.setTextColor(...blue); doc.text('7', 28, 72);
  heading(doc, 'Ways to Improve\nYour Business', 96, 26);
  let y = paragraph(doc, 'A practical field guide for clearer priorities, better processes, and responsible AI adoption.', 150, 14);
  y = paragraph(doc, 'Inside: seven worked examples, seven reusable AI prompts, fillable planning worksheets, a readiness review, and a 30-day implementation plan.', y + 8, 11);
  field(doc, 'business_name', 'BUSINESS / TEAM', 201, 12); field(doc, 'prepared_by', 'PREPARED BY / START DATE', 231, 12);
  doc.addPage(); pageHeader(doc, 'Start here / Your readiness review', 2);
  y = heading(doc, 'Find your next best move.', 49);
  y = paragraph(doc, 'Work through one chapter at a time. Rate each area: 0 = not started, 1 = inconsistent, 2 = repeatable, 3 = measured and improving. These are self-reflection ratings, not a diagnostic score.', y, 11);
  workbookChapters.forEach((chapter, i) => { y = field(doc, `readiness_${i + 1}`, `${i + 1}. ${chapter.title.toUpperCase()} - RATING / EVIDENCE`, y, 10); });
  paragraph(doc, 'Use a PDF reader that supports fillable forms, then save a copy to keep your notes. AI prompts are templates for your approved tools; this PDF does not run AI. Never include confidential or personal data. All examples are illustrative, not client results.', 249, 8.5);
  workbookChapters.forEach((chapter, index) => workbookPdfChapter(doc, chapter, index, origin));
  doc.addPage(); pageHeader(doc, 'From ideas to implementation / 30-day plan', 10);
  y = heading(doc, 'One priority. A measurable start.', 49);
  y = paragraph(doc, 'Choose one opportunity based on value, effort, and risk. Assign a named owner and record the baseline before making changes. A small, reviewed pilot is more useful than seven unfinished initiatives.', y, 11);
  y = field(doc, 'priority', 'PRIORITY / SUCCESS MEASURE / BASELINE', y, 24);
  y = field(doc, 'week_1', 'DAYS 1-7 / MAP THE PROCESS AND VALIDATE THE PROBLEM', y, 22);
  y = field(doc, 'week_2', 'DAYS 8-14 / BUILD A SMALL PILOT WITH HUMAN REVIEW', y, 22);
  y = field(doc, 'week_3', 'DAYS 15-21 / RUN THE PILOT AND RECORD EXCEPTIONS', y, 22);
  field(doc, 'week_4', 'DAYS 22-30 / REVIEW RESULTS AND DECIDE: IMPROVE, SCALE, OR STOP', y, 22);
  doc.addPage(); pageHeader(doc, 'Your implementation partner', 11);
  y = heading(doc, 'Turn your plan into a working system.', 49);
  y = paragraph(doc, 'Use this workbook independently, or bring your priority and constraints to Strategic Minds AI. We can help scope, build, and improve the right system for your business.', y, 11);
  workbookChapters.forEach(chapter => { y = heading(doc, chapter.service, y, 10); y = paragraph(doc, chapter.deliverable, y, 9); });
  doc.setFontSize(11); doc.setTextColor(...blue); doc.textWithLink('Discuss your business improvement plan', 20, 253, { url: `${origin}/contact` });
  doc.save('Strategic-Minds-AI-Business-Improvement-Workbook.pdf');
}