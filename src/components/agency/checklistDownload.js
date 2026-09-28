const steps = [
  ['Map your customer journey', 'List each step from first contact to repeat purchase. Identify one point where customers wait, get confused, or drop away. Choose one improvement to make this week.'],
  ['Make your value clear', 'Describe who you help, the problem you solve, and the outcome you aim to deliver in one sentence. Put that message where prospects first meet your business.'],
  ['Follow up consistently', 'Assign an owner and a response target for new inquiries. Use a simple lead list to track the next action, and review overdue follow-ups each day.'],
  ['Automate one repetitive task', 'Choose a frequent, predictable task with clear inputs and outputs. Document it, automate a small part, and compare accuracy and time spent before expanding.'],
  ['Connect your information', 'Identify your source of truth for customers, projects, and documents. Remove duplicate entry where practical and give each team member only the access they need.'],
  ['Measure what matters', 'Choose three useful measures, such as inquiry-to-customer conversion, turnaround time, and customer retention. Record a baseline and review progress monthly.'],
  ['Build a responsible AI habit', 'Start with a low-risk use case, keep confidential data out of unapproved tools, and require human review. Document what works so the whole team can learn.'],
];

export default function downloadChecklist() {
  const content = `STRATEGIC MINDS AI\n7 ways to improve your business\nA practical checklist for your next step.\n\n${steps.map(([title, text], i) => `${i + 1}. ${title}\n[ ] ${text}`).join('\n\n')}\n\nYour next move\nChoose one action, give it an owner, and set a review date.\n\nOwner: ____________________\nAction: ___________________\nReview date: ______________\n\nStrategic Minds AI | Strategy first. Intelligence applied.\n`;
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Strategic-Minds-AI-7-Ways-Checklist.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}