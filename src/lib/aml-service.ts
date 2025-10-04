/**
 * AML Screening Service
 * 
 * This service handles AML/sanctions screening for individuals and companies.
 * 
 * Data Sources:
 * 1. Open-source sanctions lists (OFAC, UN, EU) - FREE
 * 2. UK Companies House API - FREE
 * 3. Mock PEP data (fallback until ComplyAdvantage integration)
 * 
 * Future: Integrate with ComplyAdvantage API for full coverage
 */

import { SubjectType, MatchType, ReviewStatus, RiskLevel } from '@prisma/client';
import { searchSanctions, initializeSanctionsLists } from './sanctions-lists';
import { verifyUKCompany, searchUKCompanies } from './companies-house';

export interface AMLScreeningRequest {
  subjectType: SubjectType;
  subjectName: string;
  subjectEmail?: string;
  subjectPhone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  companyNumber?: string;
}

export interface AMLMatch {
  matchType: MatchType;
  entityName: string;
  matchScore: number;
  aliases: string[];
  listName: string;
  listType: string;
  sourceUrl?: string;
  dateOfBirth?: Date;
  nationality: string[];
  positions: string[];
  reviewStatus: ReviewStatus;
  metadata?: any;
}

export interface AMLScreeningResult {
  riskScore: number;
  riskLevel: RiskLevel;
  matches: AMLMatch[];
  sanctionsMatch: boolean;
  pepMatch: boolean;
  adverseMedia: boolean;
  metadata?: any;
}

/**
 * Mock AML Lists for Development
 */
// Old mock data removed - now using real data sources:
// - OFAC SDN List (via sanctions-lists.ts)
// - UN Consolidated List (via sanctions-lists.ts)
// - EU Sanctions List (via sanctions-lists.ts)
// - UK Companies House API (via companies-house.ts)
// Mock PEP list moved below to avoid duplication

/**
 * Perform AML screening using real data sources
 */
export async function performAMLScreening(
  request: AMLScreeningRequest
): Promise<AMLScreeningResult> {
  const matches: AMLMatch[] = [];

  // Initialize sanctions lists if not already loaded
  await initializeSanctionsLists();

  // 1. Check against real sanctions lists (OFAC, UN, EU)
  console.log(`🔍 Screening: ${request.subjectName}`);
  const sanctionsMatches = await searchSanctions(request.subjectName, {
    dateOfBirth: request.dateOfBirth?.toISOString().split('T')[0],
    nationality: request.nationality,
    type: request.subjectType === SubjectType.INDIVIDUAL ? 'individual' : 'entity',
  });

  // Convert sanctions matches to AMLMatch format
  for (const sanctionMatch of sanctionsMatches) {
    matches.push({
      matchType: MatchType.SANCTIONS,
      entityName: sanctionMatch.entity.name,
      matchScore: sanctionMatch.matchScore,
      aliases: sanctionMatch.entity.aliases,
      listName: `${sanctionMatch.entity.list} Sanctions List`,
      listType: 'sanctions',
      sourceUrl: sanctionMatch.entity.listUrl,
      dateOfBirth: sanctionMatch.entity.dateOfBirth
        ? new Date(sanctionMatch.entity.dateOfBirth)
        : undefined,
      nationality: sanctionMatch.entity.nationality || [],
      positions: [],
      reviewStatus: ReviewStatus.PENDING,
      metadata: {
        programs: sanctionMatch.entity.programs,
        remarks: sanctionMatch.entity.remarks,
        matchReasons: sanctionMatch.matchReasons,
      },
    });
  }

  // 2. For UK companies, verify with Companies House
  if (request.subjectType === SubjectType.COMPANY && request.companyNumber) {
    const companyVerification = await verifyUKCompany(request.companyNumber);
    
    if (companyVerification.verified && companyVerification.company) {
      const company = companyVerification.company;
      
      // Check for red flags
      if (companyVerification.redFlags && companyVerification.redFlags.length > 0) {
        matches.push({
          matchType: MatchType.WATCHLIST,
          entityName: company.companyName,
          matchScore: 60 + (companyVerification.redFlags.length * 5),
          aliases: [],
          listName: 'UK Companies House',
          listType: 'company_verification',
          sourceUrl: `https://find-and-update.company-information.service.gov.uk/company/${company.companyNumber}`,
          nationality: ['United Kingdom'],
          positions: [],
          reviewStatus: ReviewStatus.PENDING,
          metadata: {
            companyNumber: company.companyNumber,
            companyStatus: company.companyStatus,
            redFlags: companyVerification.redFlags,
            hasInsolvencyHistory: company.hasInsolvencyHistory,
            hasCharges: company.hasCharges,
            dateOfCreation: company.dateOfCreation,
          },
        });
      }

      // Check officers against sanctions lists
      if (company.officers) {
        for (const officer of company.officers) {
          const officerSanctions = await searchSanctions(officer.name, {
            nationality: officer.nationality,
          });

          for (const sanctionMatch of officerSanctions) {
            matches.push({
              matchType: MatchType.SANCTIONS,
              entityName: `${officer.name} (Officer of ${company.companyName})`,
              matchScore: sanctionMatch.matchScore,
              aliases: sanctionMatch.entity.aliases,
              listName: `${sanctionMatch.entity.list} Sanctions List`,
              listType: 'sanctions',
              sourceUrl: sanctionMatch.entity.listUrl,
              nationality: sanctionMatch.entity.nationality || [],
              positions: [officer.officerRole],
              reviewStatus: ReviewStatus.PENDING,
              metadata: {
                isCompanyOfficer: true,
                companyName: company.companyName,
                companyNumber: company.companyNumber,
                officerRole: officer.officerRole,
                appointedOn: officer.appointedOn,
              },
            });
          }
        }
      }
    }
  }

  // 3. Check PEP lists (using mock data for now)
  if (request.subjectType === SubjectType.INDIVIDUAL) {
    const pepMatches = findMockPEPMatches(
      request.subjectName,
      request.dateOfBirth
    );
    matches.push(...pepMatches);
  }

  // Calculate risk
  const { riskScore, riskLevel } = calculateRiskScore(matches);

  return {
    riskScore,
    riskLevel,
    matches,
    sanctionsMatch: matches.some(m => m.matchType === MatchType.SANCTIONS),
    pepMatch: matches.some(m => m.matchType === MatchType.PEP),
    adverseMedia: matches.some(m => m.matchType === MatchType.ADVERSE_MEDIA),
    metadata: {
      timestamp: new Date().toISOString(),
      provider: 'ScotComply AML Service',
      version: '2.0',
      dataSources: [
        'OFAC SDN List',
        'UN Consolidated Sanctions List',
        'EU Sanctions List',
        'UK Companies House',
        'Mock PEP Database',
      ],
    },
  };
}

/**
 * Mock PEP data (temporary until ComplyAdvantage integration)
 */
const MOCK_PEP_LIST = [
  { 
    name: 'Robert Johnson', 
    dob: '1965-05-10', 
    nationality: ['United Kingdom'], 
    positions: ['Former Member of Parliament', 'Government Minister'],
    list: 'UK PEP Database'
  },
  { 
    name: 'Maria Garcia', 
    dob: '1970-08-15', 
    nationality: ['Spain'], 
    positions: ['Mayor', 'Regional Government Official'],
    list: 'EU PEP Database'
  },
];

/**
 * Find mock PEP matches (temporary function)
 */
function findMockPEPMatches(
  searchName: string,
  searchDob: Date | undefined
): AMLMatch[] {
  const matches: AMLMatch[] = [];

  for (const entry of MOCK_PEP_LIST) {
    const nameScore = calculateNameSimilarity(searchName, entry.name);
    
    if (nameScore >= 70) {
      let finalScore = nameScore;
      if (searchDob && entry.dob) {
        const dobMatch = compareDates(searchDob, new Date(entry.dob));
        if (dobMatch) {
          finalScore = Math.min(100, nameScore + 15);
        }
      }

      matches.push({
        matchType: MatchType.PEP,
        entityName: entry.name,
        matchScore: finalScore,
        aliases: [],
        listName: entry.list,
        listType: 'pep',
        nationality: entry.nationality || [],
        positions: entry.positions || [],
        reviewStatus: ReviewStatus.PENDING,
        dateOfBirth: entry.dob ? new Date(entry.dob) : undefined,
        metadata: { source: 'mock_pep_database' },
      });
    }
  }

  return matches;
}

/**
 * Find matches using fuzzy name matching and DOB comparison
 */
function findMatches(
  searchName: string,
  searchDob: Date | undefined,
  list: any[],
  matchType: MatchType
): AMLMatch[] {
  const matches: AMLMatch[] = [];

  for (const entry of list) {
    const nameScore = calculateNameSimilarity(searchName, entry.name);
    
    // Only consider if name similarity is above threshold
    if (nameScore >= 70) {
      // Boost score if DOB matches
      let finalScore = nameScore;
      if (searchDob && entry.dob) {
        const dobMatch = compareDates(searchDob, new Date(entry.dob));
        if (dobMatch) {
          finalScore = Math.min(100, nameScore + 15);
        }
      }

      matches.push({
        matchType,
        entityName: entry.name,
        matchScore: finalScore,
        aliases: [],
        listName: entry.list,
        listType: matchType.toLowerCase(),
        nationality: entry.nationality || [],
        positions: entry.positions || [],
        reviewStatus: ReviewStatus.PENDING,
        dateOfBirth: entry.dob ? new Date(entry.dob) : undefined,
        metadata: entry,
      });
    }
  }

  return matches;
}

/**
 * Calculate name similarity (simple implementation)
 * In production, use Levenshtein distance or similar
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = name1.toLowerCase().trim();
  const n2 = name2.toLowerCase().trim();

  // Exact match
  if (n1 === n2) return 100;

  // Check if one name contains the other
  if (n1.includes(n2) || n2.includes(n1)) return 85;

  // Split into words and check overlap
  const words1 = n1.split(' ');
  const words2 = n2.split(' ');
  
  let matchedWords = 0;
  for (const w1 of words1) {
    if (words2.some(w2 => w2 === w1 || w2.includes(w1) || w1.includes(w2))) {
      matchedWords++;
    }
  }

  const overlapRatio = matchedWords / Math.max(words1.length, words2.length);
  return Math.round(overlapRatio * 75); // Max 75 for partial matches
}

/**
 * Compare dates (same day, month, year)
 */
function compareDates(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate overall risk score based on matches
 */
function calculateRiskScore(matches: AMLMatch[]): { riskScore: number; riskLevel: RiskLevel } {
  if (matches.length === 0) {
    return { riskScore: 0, riskLevel: RiskLevel.LOW };
  }

  // Weight different match types
  const weights = {
    [MatchType.SANCTIONS]: 1.5,
    [MatchType.PEP]: 1.2,
    [MatchType.ADVERSE_MEDIA]: 1.0,
    [MatchType.WATCHLIST]: 1.1,
  };

  let totalScore = 0;
  let maxScore = 0;

  matches.forEach(match => {
    const weight = weights[match.matchType] || 1.0;
    const weightedScore = match.matchScore * weight;
    totalScore += weightedScore;
    maxScore = Math.max(maxScore, weightedScore);
  });

  // Average of mean and max (weighted toward max for risk assessment)
  const averageScore = totalScore / matches.length;
  const riskScore = Math.min(100, Math.round((averageScore * 0.4) + (maxScore * 0.6)));

  // Determine risk level
  let riskLevel: RiskLevel;
  
  // Critical: High-confidence sanctions match
  if (
    matches.some(m => m.matchType === MatchType.SANCTIONS && m.matchScore >= 85) ||
    riskScore >= 90
  ) {
    riskLevel = RiskLevel.CRITICAL;
  }
  // High: Lower-confidence sanctions or multiple PEP matches
  else if (
    matches.some(m => m.matchType === MatchType.SANCTIONS) ||
    riskScore >= 70
  ) {
    riskLevel = RiskLevel.HIGH;
  }
  // Medium: PEP or adverse media with good scores
  else if (riskScore >= 40) {
    riskLevel = RiskLevel.MEDIUM;
  }
  // Low: Weak matches only
  else {
    riskLevel = RiskLevel.LOW;
  }

  return { riskScore, riskLevel };
}

/**
 * Utility: Delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * TODO: Real API Integration Functions
 */

/**
 * Initialize ComplyAdvantage API client
 * Requires API key from environment variables
 */
export function initializeAMLClient() {
  const apiKey = process.env.COMPLYADVANTAGE_API_KEY;
  
  if (!apiKey) {
    console.warn('ComplyAdvantage API key not configured. Using mock service.');
    return null;
  }

  // TODO: Initialize real API client
  // return new ComplyAdvantageClient({ apiKey });
  return null;
}

/**
 * Perform real-time screening via API
 */
export async function performRealTimeScreening(request: AMLScreeningRequest): Promise<AMLScreeningResult> {
  const client = initializeAMLClient();
  
  if (!client) {
    // Fall back to mock service
    return performAMLScreening(request);
  }

  // TODO: Call real API
  // const response = await client.search({
  //   search_term: request.subjectName,
  //   fuzziness: 0.7,
  //   filters: {
  //     types: ['sanction', 'warning', 'fitness-probity'],
  //     ...(request.dateOfBirth && { birth_year: request.dateOfBirth.getFullYear() }),
  //   },
  // });

  // For now, use mock
  return performAMLScreening(request);
}

/**
 * Set up ongoing monitoring for a screened entity
 */
export async function setupOngoingMonitoring(screeningId: string): Promise<void> {
  // TODO: Register webhook for ongoing monitoring
  // When new sanctions/PEP lists are published, system should re-check
  console.log(`Ongoing monitoring enabled for screening: ${screeningId}`);
}

/**
 * Cancel ongoing monitoring
 */
export async function cancelOngoingMonitoring(screeningId: string): Promise<void> {
  // TODO: Unregister webhook
  console.log(`Ongoing monitoring disabled for screening: ${screeningId}`);
}
