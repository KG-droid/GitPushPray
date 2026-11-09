/**
 * Synthetic policy pack for the joiner assistant.
 * FICTIONAL: written for the LaunchPad hackathon. These are not real Lloyds Banking Group policies.
 * Each policy has numbered sections so the assistant's citations point somewhere specific.
 */
export interface Policy {
  id: string
  title: string
  text: string
}

export const policies: Policy[] = [
  {
    id: 'hybrid-working',
    title: 'Hybrid Working Policy',
    text: `1. Who this covers
Colleagues in office-based roles (for example technology, data, risk and head-office teams) work hybrid. Contact centre, branch and site-based roles work from their site, with some home-working days agreed locally.

2. Your first weeks
In your first two weeks we ask you to be in the office at least three days a week so you can meet your team, your buddy and key stakeholders. Your manager will confirm which days. Working from home in your very first week is possible only if your manager agrees in advance.

3. After your first month
Hybrid colleagues spend at least two days a week (or 40% of their time) in the office, on days agreed with their team. Teams usually pick one or two "anchor days" when everyone is in.

4. Fully remote contracts
Some roles are contractually home-based. These colleagues attend a monthly in-person team day and receive a home-working allowance of £30 a month, paid through payroll.

5. Working abroad
You can work from outside the UK for up to 10 working days a year, with manager approval and a security check of your location. This is not available in your first three months.`,
  },
  {
    id: 'dress-code',
    title: 'Dress Code Guidance',
    text: `1. The principle
Dress for your day. We trust colleagues to judge what is appropriate for the people they will meet.

2. Offices
Smart casual is normal in our offices. Jeans and trainers are fine. If you are meeting customers, regulators or external partners, dress more formally.

3. Branches and customer-facing roles
Branch colleagues wear the provided uniform. You will be measured for it in your first week; until it arrives, wear smart office clothes in dark colours.

4. Religious and cultural dress
Religious and cultural dress is always welcome and can be worn with any uniform.

5. ID badges
Your ID badge must be visible at all times in our buildings.`,
  },
  {
    id: 'expenses',
    title: 'Travel and Expenses Policy',
    text: `1. Before you spend
Book travel through the travel portal wherever possible. Get your manager's approval before any trip that needs an overnight stay.

2. Your normal commute
Travel between home and your normal place of work is not claimable. Travel to a different office for work is claimable.

3. Rail and mileage
Standard class rail is the default. Mileage in your own car is paid at 45p per mile for the first 10,000 business miles in a tax year.

4. Meals and hotels
When you are away overnight you can claim up to £35 a day for meals. Hotels are booked through the portal within the city limit (for example £180 a night in London, £120 elsewhere).

5. Claiming
Submit claims within 60 days with a photo of each receipt in the expenses app. Claims are paid with your next monthly salary.

6. Before your start date
Travel to interviews or pre-start events that we have asked you to attend can be claimed once you have joined.`,
  },
  {
    id: 'leave',
    title: 'Annual Leave and Time Off Policy',
    text: `1. How much leave you get
Full-time colleagues receive 28 days of annual leave plus UK bank holidays. Leave is pro rata for part-time colleagues and for the year you join.

2. Booking leave
Book leave in the HR system and agree it with your manager first. You can book leave during your first three months; we just ask that you avoid your first two weeks so you can settle in.

3. Holidays already booked before you joined
If you booked a holiday before accepting your offer, tell your manager or recruiter. We will honour it, even if it means taking some leave in advance.

4. Buying extra leave
You can buy up to 5 extra days a year through flexible benefits.

5. Sickness
If you are unwell, tell your manager by 10am on your first day of absence. You do not need a fit note for absences of 7 calendar days or fewer.

6. Other time off
We offer paid time off for dependants' emergencies, volunteering (2 days a year), and enhanced family leave. Ask HR Direct for details.`,
  },
  {
    id: 'it-acceptable-use',
    title: 'IT and Acceptable Use Policy',
    text: `1. Your equipment
You receive a bank laptop set up for your role. Your manager decides the spec (standard, or developer for roles that build software), then office-based joiners choose a Surface Pro, Surface Laptop or HP EliteBook G11 before they start. Contact centre and branch colleagues use a ready-configured workstation.

2. Personal devices
Bank data must only be accessed on bank devices, or on a personal phone enrolled in the approved mobile app for email and chat. Never forward work emails to personal accounts.

3. Passwords and multi-factor authentication
You will set up your password and multi-factor authentication on your first day with your manager or the IT welcome desk. IT will never ask you for your password.

4. AI tools
Only use AI tools approved by the bank. Never paste customer or confidential data into public AI tools.

5. Reporting problems
Report a lost device or suspicious email straight away to the IT service desk. Reporting quickly is always the right thing to do.

6. Software
Software for your role is requested by your manager as part of your access set-up and is ready on Day 1. Ask your manager if you need anything else.`,
  },
  {
    id: 'mandatory-training',
    title: 'Mandatory Training and Conduct Policy',
    text: `1. What everyone completes
Every colleague completes five mandatory modules in their first 30 days: Code of Conduct, Financial Crime and Fraud, Data Protection, Information Security, and Treating Customers Fairly (Consumer Duty).

2. Time to do it
The modules take about 90 minutes in total. Your manager will protect time in your diary to do them. You do not need to complete them before you start.

3. Role-specific training
Contact centre, branch and senior manager roles have extra induction training, which your manager arranges.

4. Senior Managers and Certification Regime
If your role is a Senior Manager Function, you will have a Statement of Responsibilities and a regulatory induction with Compliance in your first week.

5. Speaking up
If you see something that doesn't feel right, speak to your manager or use the confidential Speak Up service. Colleagues who speak up in good faith are protected.`,
  },
  {
    id: 'benefits-pay',
    title: 'Pay, Pension and Benefits Guide',
    text: `1. When you are paid
Salaries are paid monthly on the 20th (or the working day before if the 20th is a weekend or bank holiday). If you start after the 10th of the month, your first pay may come in the following month's payroll.

2. Bank details
You add your bank details in the app once all your pre-employment checks are cleared.

3. Pension
You are enrolled in the bank's pension scheme. If you contribute 6% the bank adds 15%. The bank matches more as your contribution rises, up to a maximum bank contribution of 15%.

4. Flexible benefits
Each year you can choose benefits including private medical cover, cycle to work, a season ticket loan, buying extra leave and a give-as-you-earn charity scheme. New joiners choose within their first 30 days.

5. Colleague discounts
Colleagues get discounts on some of the bank's own products, plus a retail discount platform.

6. Questions about your individual salary
Questions about your own salary, bonus or package go to your recruiter before you start, and to your manager or HR Direct after. Information about other colleagues' pay is confidential.`,
  },
  {
    id: 'screening',
    title: 'Pre-Employment Screening and Start Dates',
    text: `1. Why we screen
As a regulated bank we must check every new colleague before they start. This protects our customers and is required by our regulators.

2. The checks
All joiners have identity, right to work, a Basic DBS criminal record check, a financial background (soft credit) check and employment references covering the last 3 years. Senior Manager and Certification roles also need regulatory references covering the last 6 years.

3. How long it takes
Most checks clear within 2 weeks. References depend on other employers replying and often take 2 to 4 weeks. Other financial firms have up to 6 weeks to provide a regulatory reference.

4. What you can see
The app shows where each check is up to. It never shows the content of results. Only the screening team sees results.

5. If something needs explaining
If a check finds something that needs a conversation, the screening team will contact you directly and in confidence. Many issues are resolved simply. You can also contact the screening team at any time if you are worried about something that might come up.

6. Start dates
Your start date is confirmed once all checks are cleared. If a check is taking longer we may move your start date. We will always tell you why, and anything you have already chosen or unlocked stays in place.`,
  },
]
