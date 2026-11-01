/**
 * LEADPULSE AI - Lead Scoring Engine (Module 3)
 * Transparent, rule-based scoring engine with maximum 100 points.
 * Fit (30) + Intent (40) + Engagement (30)
 * HOT (80-100), WARM (50-79), COLD (0-49)
 */

import {
  Company,
  Contact,
  Activity,
  ScoreBreakdown,
  ScoreCategory,
  Territory,
  Industry,
  CompanySize,
  RoleLevel,
} from '../types/crm';

// Default Target Criteria Weightings
export const FIT_TARGET_INDUSTRIES: Industry[] = ['Technology', 'Financial Services', 'Healthcare'];
export const FIT_SECONDARY_INDUSTRIES: Industry[] = ['Telecommunications', 'Manufacturing'];

export const FIT_TARGET_SIZES: CompanySize[] = ['501-1000', '1000+'];
export const FIT_MID_SIZES: CompanySize[] = ['201-500', '51-200'];

export const FIT_DECISION_MAKER_ROLES: RoleLevel[] = ['C-Level', 'VP'];
export const FIT_INFLUENCER_ROLES: RoleLevel[] = ['Director', 'Manager'];

export const TARGET_TERRITORIES: Territory[] = ['North America', 'EMEA', 'APAC', 'LATAM'];

export interface ScoringInputs {
  company: Company;
  contact: Contact;
  activities: Activity[];
  scoringTimestamp?: string;
  conversionTimestamp?: string;
}

export interface ScoringResult {
  fitScore: number;
  intentScore: number;
  engagementScore: number;
  totalScore: number;
  category: ScoreCategory;
  scoreBreakdown: ScoreBreakdown;
  excludedActivitiesCount: number;
  temporalLeakageDetected: boolean;
}

/**
 * Calculates deterministic lead score based on transparent business rules.
 * Strictly prevents temporal leakage by ignoring post-conversion or future activities.
 */
export function calculateLeadScore(inputs: ScoringInputs): ScoringResult {
  const { company, contact, activities, conversionTimestamp } = inputs;
  const asOfDate = inputs.scoringTimestamp ? new Date(inputs.scoringTimestamp) : new Date();
  const convDate = conversionTimestamp ? new Date(conversionTimestamp) : null;

  // 1. FIT SCORE (Max 30)
  // - Company size: 10 pts
  let companySizePoints = 0;
  const fitReasons: string[] = [];

  if (FIT_TARGET_SIZES.includes(company.size)) {
    companySizePoints = 10;
    fitReasons.push(`Optimal enterprise company size (${company.size}) awarded maximum 10 pts`);
  } else if (FIT_MID_SIZES.includes(company.size)) {
    companySizePoints = 7;
    fitReasons.push(`Mid-market company size (${company.size}) awarded 7 pts`);
  } else {
    companySizePoints = 3;
    fitReasons.push(`Small business size (${company.size}) awarded baseline 3 pts`);
  }

  // - Industry match: 10 pts
  let industryMatchPoints = 0;
  if (FIT_TARGET_INDUSTRIES.includes(company.industry)) {
    industryMatchPoints = 10;
    fitReasons.push(`Primary high-fit industry '${company.industry}' awarded maximum 10 pts`);
  } else if (FIT_SECONDARY_INDUSTRIES.includes(company.industry)) {
    industryMatchPoints = 6;
    fitReasons.push(`Secondary vertical '${company.industry}' awarded 6 pts`);
  } else {
    industryMatchPoints = 3;
    fitReasons.push(`Standard vertical '${company.industry}' awarded 3 pts`);
  }

  // - Job role: 5 pts
  let jobRolePoints = 0;
  if (FIT_DECISION_MAKER_ROLES.includes(contact.roleLevel)) {
    jobRolePoints = 5;
    fitReasons.push(`Executive decision maker role (${contact.roleLevel} - ${contact.jobTitle}) awarded 5 pts`);
  } else if (FIT_INFLUENCER_ROLES.includes(contact.roleLevel)) {
    jobRolePoints = 3;
    fitReasons.push(`Key influencer role (${contact.roleLevel} - ${contact.jobTitle}) awarded 3 pts`);
  } else {
    jobRolePoints = 1;
    fitReasons.push(`Operational role (${contact.roleLevel}) awarded 1 pt`);
  }

  // - Geographic fit: 5 pts
  let geographicFitPoints = 0;
  if (TARGET_TERRITORIES.includes(company.territory)) {
    geographicFitPoints = 5;
    fitReasons.push(`Active operational territory '${company.territory}' awarded maximum 5 pts`);
  } else {
    geographicFitPoints = 1;
    fitReasons.push(`Non-primary territory '${company.territory}' awarded 1 pt`);
  }

  const fitScore = Math.min(30, companySizePoints + industryMatchPoints + jobRolePoints + geographicFitPoints);

  // Filter activities to strictly prevent temporal leakage:
  // Activity must occur before or at scoring timestamp, AND before conversion timestamp
  let excludedActivitiesCount = 0;
  let temporalLeakageDetected = false;

  const validActivities = activities.filter(act => {
    const actDate = new Date(act.timestamp);
    if (actDate > asOfDate) {
      excludedActivitiesCount++;
      return false;
    }
    if (convDate && (actDate > convDate || act.isPostConversion)) {
      excludedActivitiesCount++;
      temporalLeakageDetected = true;
      return false;
    }
    return true;
  });

  // 2. INTENT SCORE (Max 40)
  // - Pricing page visit: 10
  // - Demo request: 15
  // - Product inquiry: 10
  // - Purchase-related activity: 5
  let pricingPagePoints = 0;
  let demoRequestPoints = 0;
  let productInquiryPoints = 0;
  let purchaseActivityPoints = 0;
  const intentReasons: string[] = [];

  const pricingViews = validActivities.filter(a => a.type === 'PRICING_PAGE_VIEW');
  if (pricingViews.length > 0) {
    pricingPagePoints = 10;
    intentReasons.push(`Pricing page visit logged (${pricingViews.length} events) -> +10 pts`);
  }

  const demoRequests = validActivities.filter(a => a.type === 'DEMO_REQUEST');
  if (demoRequests.length > 0) {
    demoRequestPoints = 15;
    intentReasons.push(`High-intent direct Demo Request submitted -> +15 pts`);
  }

  const productInquiries = validActivities.filter(a => a.type === 'PRODUCT_INQUIRY');
  if (productInquiries.length > 0) {
    productInquiryPoints = 10;
    intentReasons.push(`Technical/Product specification inquiry logged -> +10 pts`);
  }

  const purchaseActions = validActivities.filter(a => a.type === 'PURCHASE_INTENT_FORM');
  if (purchaseActions.length > 0) {
    purchaseActivityPoints = 5;
    intentReasons.push(`Purchase quotation/intent form completed -> +5 pts`);
  }

  const intentScore = Math.min(40, pricingPagePoints + demoRequestPoints + productInquiryPoints + purchaseActivityPoints);

  // 3. ENGAGEMENT SCORE (Max 30)
  // - Email engagement: 10
  // - Website engagement: 10
  // - Event participation: 5
  // - Recent interaction: 5
  let emailPoints = 0;
  let websitePoints = 0;
  let eventPoints = 0;
  let recentInteractionPoints = 0;
  const engagementReasons: string[] = [];

  const emailClicks = validActivities.filter(a => a.type === 'EMAIL_CLICK');
  const emailOpens = validActivities.filter(a => a.type === 'EMAIL_OPEN');
  if (emailClicks.length > 0) {
    emailPoints = 10;
    engagementReasons.push(`High email engagement with click-through actions -> +10 pts`);
  } else if (emailOpens.length > 0) {
    emailPoints = 5;
    engagementReasons.push(`Email open engagement observed -> +5 pts`);
  }

  const webVisits = validActivities.filter(a => a.type === 'WEBSITE_VISIT');
  if (webVisits.length >= 3) {
    websitePoints = 10;
    engagementReasons.push(`Strong digital footprint (${webVisits.length} web sessions) -> +10 pts`);
  } else if (webVisits.length > 0) {
    websitePoints = 5;
    engagementReasons.push(`Moderate digital interest (${webVisits.length} web visits) -> +5 pts`);
  }

  const eventAttended = validActivities.filter(a => a.type === 'EVENT_ATTENDANCE');
  if (eventAttended.length > 0) {
    eventPoints = 5;
    engagementReasons.push(`Webinar or trade show attendance recorded -> +5 pts`);
  }

  // Recent interaction: touchpoint within the last 14 days of scoring date
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
  const recentActs = validActivities.filter(a => {
    const actTime = new Date(a.timestamp).getTime();
    return asOfDate.getTime() - actTime <= fourteenDaysMs;
  });
  if (recentActs.length > 0) {
    recentInteractionPoints = 5;
    engagementReasons.push(`Active recency: touchpoint within prior 14 days -> +5 pts`);
  }

  const engagementScore = Math.min(30, emailPoints + websitePoints + eventPoints + recentInteractionPoints);

  // TOTAL SCORE
  const totalScore = Math.min(100, Math.max(0, fitScore + intentScore + engagementScore));

  // CATEGORIES
  let category: ScoreCategory = 'COLD';
  if (totalScore >= 80) {
    category = 'HOT';
  } else if (totalScore >= 50) {
    category = 'WARM';
  } else {
    category = 'COLD';
  }

  const scoreBreakdown: ScoreBreakdown = {
    fitScore,
    fitDetails: {
      companySizePoints,
      industryMatchPoints,
      jobRolePoints,
      geographicFitPoints,
      reasoning: fitReasons,
    },
    intentScore,
    intentDetails: {
      pricingPagePoints,
      demoRequestPoints,
      productInquiryPoints,
      purchaseActivityPoints,
      reasoning: intentReasons,
    },
    engagementScore,
    engagementDetails: {
      emailPoints,
      websitePoints,
      eventPoints,
      recentInteractionPoints,
      reasoning: engagementReasons,
    },
    totalScore,
    category,
    scoringTimestamp: asOfDate.toISOString(),
  };

  return {
    fitScore,
    intentScore,
    engagementScore,
    totalScore,
    category,
    scoreBreakdown,
    excludedActivitiesCount,
    temporalLeakageDetected,
  };
}
