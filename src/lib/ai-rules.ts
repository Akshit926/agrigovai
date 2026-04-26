// Rule-based "AI" engines for AgriGov. Deterministic, transparent, fast.

export interface CompletenessResult {
  complete: boolean;
  missing: string[];
  score: number; // 0-100
}

export function checkCompleteness(
  required: string[],
  submitted: string[]
): CompletenessResult {
  const submittedNorm = submitted.map((s) => s.trim().toLowerCase());
  const missing = required.filter(
    (r) => !submittedNorm.includes(r.trim().toLowerCase())
  );
  const score = Math.round(
    ((required.length - missing.length) / Math.max(required.length, 1)) * 100
  );
  return { complete: missing.length === 0, missing, score };
}

export interface FraudResult {
  flagged: boolean;
  reasons: string[];
  riskScore: number; // 0-100
}

interface PriorApp {
  id: string;
  land_id: string;
  scheme_id: string;
  area_acres: number;
  farmer_id: string;
  created_at: string;
}

export function detectFraud(
  current: { land_id: string; scheme_id: string; area_acres: number; farmer_id: string },
  priorApps: PriorApp[]
): FraudResult {
  const reasons: string[] = [];
  let risk = 0;

  const sameLandSameScheme = priorApps.filter(
    (a) =>
      a.land_id.trim().toLowerCase() === current.land_id.trim().toLowerCase() &&
      a.scheme_id === current.scheme_id
  );
  if (sameLandSameScheme.length > 0) {
    const otherFarmer = sameLandSameScheme.some(
      (a) => a.farmer_id !== current.farmer_id
    );
    if (otherFarmer) {
      reasons.push("Same land already claimed by another farmer for this scheme");
      risk += 70;
    } else {
      reasons.push("Duplicate application for the same land and scheme");
      risk += 50;
    }
  }

  const sameLandTotal = priorApps
    .filter(
      (a) => a.land_id.trim().toLowerCase() === current.land_id.trim().toLowerCase()
    )
    .reduce((s, a) => s + Number(a.area_acres || 0), 0);
  if (sameLandTotal + current.area_acres > 100) {
    reasons.push(
      `Cumulative claimed area (${(sameLandTotal + current.area_acres).toFixed(
        1
      )} acres) exceeds plausible limit`
    );
    risk += 25;
  }

  if (current.area_acres <= 0 || current.area_acres > 500) {
    reasons.push(`Implausible area: ${current.area_acres} acres`);
    risk += 30;
  }

  return {
    flagged: risk >= 50,
    reasons,
    riskScore: Math.min(100, risk),
  };
}

export interface GrievanceClassification {
  category: string;
  priority: "low" | "medium" | "high";
  keywords: string[];
}

const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  { category: "Subsidy / Payment", keywords: ["subsidy", "payment", "money", "amount", "credit", "transfer", "pm-kisan", "installment"] },
  { category: "Crop Insurance", keywords: ["insurance", "claim", "fasal", "bima", "damage", "loss", "compensation"] },
  { category: "Irrigation / Water", keywords: ["water", "irrigation", "canal", "drip", "sprinkler", "borewell", "pump"] },
  { category: "Seeds / Inputs", keywords: ["seed", "fertilizer", "pesticide", "urea", "input", "supply"] },
  { category: "Land Records", keywords: ["land", "record", "7/12", "patta", "survey", "boundary", "ownership"] },
  { category: "Equipment / Machinery", keywords: ["tractor", "machine", "equipment", "tool", "harvester"] },
  { category: "Officer Conduct", keywords: ["officer", "bribe", "corruption", "rude", "harass", "delay by"] },
];

const HIGH_PRIORITY = ["urgent", "emergency", "starv", "suicide", "death", "destroyed", "no water", "no payment", "months", "years"];
const MED_PRIORITY = ["delay", "pending", "waiting", "not received", "missing"];

export function classifyGrievance(text: string): GrievanceClassification {
  const lower = text.toLowerCase();
  let bestCat = "General";
  let bestHits: string[] = [];
  for (const rule of CATEGORY_RULES) {
    const hits = rule.keywords.filter((k) => lower.includes(k));
    if (hits.length > bestHits.length) {
      bestHits = hits;
      bestCat = rule.category;
    }
  }

  let priority: "low" | "medium" | "high" = "low";
  if (HIGH_PRIORITY.some((k) => lower.includes(k))) priority = "high";
  else if (MED_PRIORITY.some((k) => lower.includes(k))) priority = "medium";

  return { category: bestCat, priority, keywords: bestHits };
}

export function priorityScore(area: number, completeness: number, fraudRisk: number): number {
  // Higher = more urgent. Small farmer bonus, completeness bonus, fraud penalty.
  const smallFarmerBonus = area <= 2 ? 30 : area <= 5 ? 15 : 0;
  return Math.max(0, Math.min(100, smallFarmerBonus + completeness * 0.5 - fraudRisk * 0.3));
}
