import { jsPDF } from 'jspdf';
import { workbookChapters, workbookSecrets } from '@/components/resources/workbookContent';
import { pageHeader, heading, paragraph, field, blue, soft, ink, white, lightBlue, secretBox, drawBackground, drawCoverBackground } from '@/components/resources/workbookPdfLayout';
import workbookPdfChapter from '@/components/resources/workbookPdfChapter';

const BG_IMAGE_URL = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=2000&q=85';

async function loadBackgroundImage() {
  try {
    const response = await fetch(BG_IMAGE_URL);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export default async function downloadChecklist() {
  const doc = new jsPDF();
  const origin = window.location.origin;
  const bg = await loadBackgroundImage();

  doc.setProperties({ title: '7 Tricks & Secrets for Business Growth | Strategic Minds AI', author: 'Strategic Minds AI', subject: 'Insider playbook with real tactics, AI prompts, and fillable action plans' });

  // Cover page with background image
  drawCoverBackground(doc, bg);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...lightBlue);
  doc.text('STRATEGIC MINDS AI  /  FREE INSIDER PLAYBOOK', 20, 30);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(80); doc.setTextColor(...white);
  doc.text('7', 20, 95);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(30); doc.setTextColor(...white);
  doc.text('Tricks & Secrets', 20, 120);
  doc.text('for Business Growth', 20, 135);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13); doc.setTextColor(200, 215, 245);
  doc.text('The insider tactics most consultants', 20, 152);
  doc.text('charge $2,000 to share. Yours free.', 20, 161);
  doc.setDrawColor(...blue); doc.setLineWidth(1.5); doc.line(20, 175, 60, 175);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(180, 200, 235);
  const coverLines = doc.splitTextToSize('Inside: seven real insider secrets with worked examples, seven ready-to-use AI prompts, fillable worksheets, a readiness review, and a 30-day implementation plan.', 170);
  doc.text(coverLines, 20, 188, { lineHeightFactor: 1.4 });
  doc.setFillColor(...blue); doc.roundedRect(20, 235, 90, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...white);
  doc.text('FREE  /  NO STRINGS  /  NO SIGNUP WALL', 25, 245);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(160, 180, 215);
  doc.text('Strategy first. Intelligence applied.', 20, 282);

  // Why free page
  doc.addPage();
  if (bg) drawBackground(doc, bg, 0.05);
  pageHeader(doc, 'Why we are giving this away', 2);
  let y = heading(doc, 'Most consultants gate this. We do not.', 49);
  y = paragraph(doc, 'Most consultants put this knowledge behind a $2,000 assessment or a discovery call. We are handing it to you free because we are confident in two things: the value is real, and execution is the hard part.', y, 11);
  y = paragraph(doc, 'If this playbook saves you a month of trial and error, you will remember who gave it to you. That is the bet. We would rather earn your trust by giving you something useful than by holding it hostage.', y, 11);
  y = paragraph(doc, 'These are not generic tips. Each secret is a specific tactic we use with paying clients — the kind of thing that makes the difference between a system that works and one that quietly bleeds money. Read them, use them, and when you are ready to build, bring them to us.', y, 11);
  y = heading(doc, 'How to use this playbook', y, 12);
  y = paragraph(doc, '1. Skim all seven secrets in the next five minutes. Pick the one that hurts most.', y, 10);
  y = paragraph(doc, '2. Read that chapter fully. Use the AI prompt. Fill in the action box.', y, 10);
  y = paragraph(doc, '3. Run the 30-day plan on page 12. One priority. A measurable start.', y, 10);
  y = paragraph(doc, '4. When you are ready to build, bring your priority to us. We will help you scope, build, and ship it.', y, 10);

  // Readiness review
  doc.addPage();
  if (bg) drawBackground(doc, bg, 0.05);
  pageHeader(doc, 'Start here / Your readiness review', 3);
  y = heading(doc, 'Find your next best move.', 49);
  y = paragraph(doc, 'Rate each area: 0 = not started, 1 = inconsistent, 2 = repeatable, 3 = measured and improving. These are self-reflection ratings, not a diagnostic score. The lowest score is your starting point.', y, 11);
  workbookChapters.forEach((chapter, i) => { y = field(doc, `readiness_${i + 1}`, `${i + 1}. ${chapter.title.toUpperCase()} - RATING / EVIDENCE`, y, 10); });
  paragraph(doc, 'Use a PDF reader that supports fillable forms, then save a copy to keep your notes. AI prompts are templates for your approved tools; this PDF does not run AI. Never include confidential or personal data.', 249, 8.5);

  // Chapters
  workbookChapters.forEach((chapter, index) => workbookPdfChapter(doc, chapter, index, origin, bg));

  // Secrets summary page
  doc.addPage();
  if (bg) drawBackground(doc, bg, 0.05);
  pageHeader(doc, 'Quick reference / All seven secrets', 11);
  y = heading(doc, 'All seven secrets on one page.', 49);
  y = paragraph(doc, 'Tear this page out. Pin it above your desk. These are the tactics that compound.', y, 11);
  workbookSecrets.forEach((s) => {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...blue);
    doc.text(`${s.number}.`, 20, y);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...ink);
    doc.text(s.title, 28, y);
    y += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(60, 72, 96);
    const lines = doc.splitTextToSize(s.secret, 160);
    doc.text(lines, 28, y, { lineHeightFactor: 1.35 });
    y += lines.length * 3.6 + 5;
    if (y > 265) { doc.addPage(); if (bg) drawBackground(doc, bg, 0.05); pageHeader(doc, 'Quick reference / All seven secrets (cont.)', 12); y = 49; }
  });

  // 30-day plan
  doc.addPage();
  if (bg) drawBackground(doc, bg, 0.05);
  pageHeader(doc, 'From ideas to implementation / 30-day plan', 12);
  y = heading(doc, 'One priority. A measurable start.', 49);
  y = paragraph(doc, 'Choose one secret based on value, effort, and risk. Assign a named owner and record the baseline before making changes. A small, reviewed pilot beats seven unfinished initiatives.', y, 11);
  y = field(doc, 'priority', 'PRIORITY / SUCCESS MEASURE / BASELINE', y, 24);
  y = field(doc, 'week_1', 'DAYS 1-7 / MAP THE PROCESS AND VALIDATE THE PROBLEM', y, 22);
  y = field(doc, 'week_2', 'DAYS 8-14 / BUILD A SMALL PILOT WITH HUMAN REVIEW', y, 22);
  y = field(doc, 'week_3', 'DAYS 15-21 / RUN THE PILOT AND RECORD EXCEPTIONS', y, 22);
  field(doc, 'week_4', 'DAYS 22-30 / REVIEW RESULTS AND DECIDE: IMPROVE, SCALE, OR STOP', y, 22);

  // Partner page
  doc.addPage();
  if (bg) drawBackground(doc, bg, 0.05);
  pageHeader(doc, 'Your implementation partner', 13);
  y = heading(doc, 'Turn your plan into a working system.', 49);
  y = paragraph(doc, 'Use this playbook independently, or bring your priority and constraints to Strategic Minds AI. We can help scope, build, and improve the right system for your business.', y, 11);
  workbookChapters.forEach(chapter => { y = heading(doc, chapter.service, y, 10); y = paragraph(doc, chapter.deliverable, y, 9); });
  doc.setFontSize(11); doc.setTextColor(...blue); doc.textWithLink('Discuss your business improvement plan', 20, 253, { url: `${origin}/contact` });

  doc.save('Strategic-Minds-AI-Tricks-and-Secrets.pdf');
}