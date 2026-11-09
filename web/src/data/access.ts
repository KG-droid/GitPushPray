import type { JobFamily } from '../domain/types'

/**
 * Synthetic access data for the manager's "Request system access" task.
 * Illustrative only: live data would come from Entra, GitHub, Jira and the other systems' APIs.
 */

export type AccessSystem = 'GitHub' | 'Backstage' | 'Jira' | 'Confluence' | 'Entra groups' | 'Teams groups' | 'Other access'

export interface AccessItem {
  id: string
  system: AccessSystem
  label: string
}

export interface AccessProfile {
  id: string
  name: string
  itemIds: string[]
}

export const SYSTEM_ORDER: AccessSystem[] = ['GitHub', 'Backstage', 'Jira', 'Confluence', 'Entra groups', 'Teams groups', 'Other access']

/** Whose team to show for each job family. Joiners without a seeded team borrow the closest one. */
export const teamKeyForFamily: Record<JobFamily, string> = {
  technology: 'priya',
  data: 'sam',
  graduate: 'aisha',
  risk: 'margaret',
  retail: 'jordan',
  'contact-centre': 'rhys',
}

const it = (id: string, system: AccessSystem, label: string): AccessItem => ({ id, system, label })

export const accessItems: Record<JobFamily, AccessItem[]> = {
  technology: [
    it('gh-org', 'GitHub', 'Payments org, write access'),
    it('gh-actions', 'GitHub', 'Actions and package registry'),
    it('bs-catalog', 'Backstage', 'Service catalogue, editor'),
    it('bs-templates', 'Backstage', 'Software templates'),
    it('jira-pay', 'Jira', 'PAY project'),
    it('conf-pay', 'Confluence', 'Payments Platform space'),
    it('ent-eng', 'Entra groups', 'sg-payments-engineers'),
    it('ent-azure', 'Entra groups', 'sg-azure-dev-contributors'),
    it('tm-team', 'Teams groups', 'Payments Platform'),
    it('tm-guild', 'Teams groups', 'Engineering guild'),
    it('ado', 'Other access', 'Azure DevOps, Payments project'),
  ],
  data: [
    it('gh-data', 'GitHub', 'Customer Insight org, read access'),
    it('bs-data', 'Backstage', 'Data catalogue, viewer'),
    it('jira-ci', 'Jira', 'CI project'),
    it('conf-ci', 'Confluence', 'Customer Insight space'),
    it('ent-ci', 'Entra groups', 'sg-customer-insight'),
    it('ent-dbx', 'Entra groups', 'sg-databricks-users'),
    it('tm-ci', 'Teams groups', 'Customer Insight'),
    it('tm-dataguild', 'Teams groups', 'Data community'),
    it('dbx', 'Other access', 'Databricks workspace'),
    it('pbi', 'Other access', 'Power BI workspace'),
  ],
  graduate: [
    it('gh-grad', 'GitHub', 'Graduate sandbox org'),
    it('bs-grad', 'Backstage', 'Service catalogue, viewer'),
    it('jira-grad', 'Jira', 'Graduate programme board'),
    it('conf-grad', 'Confluence', 'Graduate hub'),
    it('ent-grad', 'Entra groups', 'sg-graduates-2026'),
    it('tm-cohort', 'Teams groups', 'Graduate cohort'),
    it('tm-rotation', 'Teams groups', 'First rotation team'),
    it('learning', 'Other access', 'Learning portal'),
  ],
  risk: [
    it('conf-risk', 'Confluence', 'Credit Risk space'),
    it('jira-risk', 'Jira', 'Risk change board'),
    it('ent-risk', 'Entra groups', 'sg-credit-risk'),
    it('ent-models', 'Entra groups', 'sg-risk-models-readonly'),
    it('tm-risk', 'Teams groups', 'Credit Risk leadership'),
    it('sp-policy', 'Other access', 'SharePoint, Risk Policy library'),
    it('workbench', 'Other access', 'Risk Workbench'),
    it('pbi-risk', 'Other access', 'Power BI, risk reporting'),
  ],
  retail: [
    it('ent-branch', 'Entra groups', 'sg-branch-colleagues'),
    it('tm-branch', 'Teams groups', 'Branch team'),
    it('sp-branch', 'Other access', 'SharePoint, branch procedures'),
    it('counter', 'Other access', 'Branch Counter'),
    it('customer-hub', 'Other access', 'Customer Hub, branch view'),
    it('rota', 'Other access', 'Rota system'),
  ],
  'contact-centre': [
    it('ent-cc', 'Entra groups', 'sg-contact-centre'),
    it('tm-advisors', 'Teams groups', 'Cardiff advisors'),
    it('kb', 'Other access', 'Knowledge base'),
    it('telephony', 'Other access', 'Telephony'),
    it('customer-hub-cc', 'Other access', 'Customer Hub'),
    it('quality', 'Other access', 'Quality scorecards'),
  ],
}

export const accessProfiles: Record<JobFamily, AccessProfile[]> = {
  technology: [
    {
      id: 'software-engineer',
      name: 'Software engineer',
      itemIds: ['gh-org', 'gh-actions', 'bs-catalog', 'bs-templates', 'jira-pay', 'conf-pay', 'ent-eng', 'ent-azure', 'tm-team', 'tm-guild', 'ado'],
    },
    { id: 'product-qa', name: 'Product or QA', itemIds: ['bs-catalog', 'jira-pay', 'conf-pay', 'ent-eng', 'tm-team', 'tm-guild'] },
  ],
  data: [
    { id: 'data-engineer', name: 'Data engineer', itemIds: ['gh-data', 'bs-data', 'jira-ci', 'conf-ci', 'ent-ci', 'ent-dbx', 'tm-ci', 'tm-dataguild', 'dbx', 'pbi'] },
    { id: 'data-analyst', name: 'Data analyst', itemIds: ['bs-data', 'jira-ci', 'conf-ci', 'ent-ci', 'tm-ci', 'tm-dataguild', 'pbi'] },
  ],
  graduate: [{ id: 'graduate', name: 'Graduate', itemIds: ['gh-grad', 'bs-grad', 'jira-grad', 'conf-grad', 'ent-grad', 'tm-cohort', 'tm-rotation', 'learning'] }],
  risk: [{ id: 'risk-leader', name: 'Risk manager', itemIds: ['conf-risk', 'jira-risk', 'ent-risk', 'ent-models', 'tm-risk', 'sp-policy', 'workbench', 'pbi-risk'] }],
  retail: [{ id: 'branch-colleague', name: 'Branch colleague', itemIds: ['ent-branch', 'tm-branch', 'sp-branch', 'counter', 'customer-hub', 'rota'] }],
  'contact-centre': [{ id: 'advisor', name: 'Customer service advisor', itemIds: ['ent-cc', 'tm-advisors', 'kb', 'telephony', 'customer-hub-cc'] }],
}

/** What each existing teammate has today, by teammate id. */
export const teammateAccess: Record<string, string[]> = {
  'tm-priya-1': accessProfiles.technology[0].itemIds,
  'tm-priya-2': accessProfiles.technology[1].itemIds,
  'tm-priya-3': ['gh-org', 'jira-pay', 'conf-pay', 'ent-eng', 'tm-team', 'tm-guild', 'ado'],
  'tm-priya-4': [...accessProfiles.technology[0].itemIds],
  'tm-sam-1': accessProfiles.data[1].itemIds,
  'tm-sam-2': accessProfiles.data[0].itemIds,
  'tm-sam-3': ['bs-data', 'jira-ci', 'conf-ci', 'ent-ci', 'tm-ci', 'pbi'],
  'tm-aisha-1': accessProfiles.graduate[0].itemIds,
  'tm-aisha-2': accessProfiles.graduate[0].itemIds.filter((i) => i !== 'gh-grad'),
  'tm-aisha-3': accessProfiles.graduate[0].itemIds,
  'tm-aisha-4': accessProfiles.graduate[0].itemIds,
  'tm-margaret-1': accessProfiles.risk[0].itemIds,
  'tm-margaret-2': ['conf-risk', 'jira-risk', 'ent-risk', 'ent-models', 'tm-risk', 'workbench', 'pbi-risk'],
  'tm-margaret-3': ['conf-risk', 'ent-risk', 'tm-risk', 'sp-policy'],
  'tm-jordan-1': accessProfiles.retail[0].itemIds,
  'tm-jordan-2': accessProfiles.retail[0].itemIds,
  'tm-jordan-3': [...accessProfiles.retail[0].itemIds],
  'tm-rhys-1': accessProfiles['contact-centre'][0].itemIds,
  'tm-rhys-2': [...accessProfiles['contact-centre'][0].itemIds, 'quality'],
  'tm-rhys-3': accessProfiles['contact-centre'][0].itemIds,
}

/**
 * Each system is run by a different team with its own approval route. The manager asks once and the
 * request is split into one ticket per owner. Owners and lead times here are illustrative.
 */
export interface AccessRoute {
  /** Who approves and sets it up */
  owner: string
  /** How the request reaches them, in plain English */
  how: string
  /** Calendar days from the request until the owner has approved it */
  approveDays: number
  /** Calendar days from the request until it is set up */
  readyDays: number
  /** Follows the role profile, so nobody has to approve it by hand */
  automatic?: boolean
}

export const accessRoutes: Record<AccessSystem, AccessRoute> = {
  'Entra groups': { owner: 'Identity team', how: 'Added automatically from the role profile when the work account is created.', approveDays: 0, readyDays: 0, automatic: true },
  'Teams groups': { owner: 'Team owner', how: 'The owner of each team adds the joiner.', approveDays: 1, readyDays: 1 },
  GitHub: { owner: 'GitHub organisation admin', how: 'Approved by the organisation admin, then linked to the work account through single sign-on.', approveDays: 1, readyDays: 2 },
  Backstage: { owner: 'Developer platform team', how: 'Follows the Entra group, so there is no separate approval.', approveDays: 0, readyDays: 1, automatic: true },
  Jira: { owner: 'Project admin', how: 'The project admin approves and picks the role.', approveDays: 1, readyDays: 2 },
  Confluence: { owner: 'Space admin', how: 'The space admin approves.', approveDays: 1, readyDays: 1 },
  'Other access': { owner: 'Application owner', how: 'A service desk request that each application’s owner approves.', approveDays: 2, readyDays: 5 },
}

/** Access that is only switched on once the joiner has finished a course, by item id. */
export const trainingGates: Record<string, string> = {
  telephony: 'telephony training',
  counter: 'cash-handling training',
  'customer-hub': 'customer data training',
  'customer-hub-cc': 'customer data training',
}

/** Days after Day 1 by which gated training is normally finished. */
export const TRAINING_DONE_DAY = 4
