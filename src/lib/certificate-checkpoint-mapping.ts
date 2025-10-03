/**
 * Certificate to Repairing Standard Checkpoint Mapping
 * Maps certificate types to specific assessment checkpoints
 */

export type CertificateType = 'GAS_SAFETY' | 'EICR' | 'EPC' | 'PAT' | 'LEGIONELLA'

/**
 * Map certificate types to checkpoint IDs
 * Based on the 21-point checklist in repairing-standard.ts
 */
export const CERTIFICATE_CHECKPOINT_MAP: Record<CertificateType, number[]> = {
  GAS_SAFETY: [
    11, // Boiler Safety - Heating equipment is safe
    13, // Carbon Monoxide Alarms
    15, // Gas Safety - Gas appliances are safe
  ],
  EICR: [
    14, // Electrical Safety - Electrical installation is safe
  ],
  EPC: [
    9,  // Central Heating - Fixed heating system
    10, // Hot Water Supply
  ],
  PAT: [
    14, // Electrical Safety (appliances)
  ],
  LEGIONELLA: [
    19, // Water Supply - Adequate supply of clean water
  ],
}

/**
 * Get checkpoint IDs that require a specific certificate type
 */
export function getCheckpointsForCertificate(certificateType: CertificateType): number[] {
  return CERTIFICATE_CHECKPOINT_MAP[certificateType] || []
}

/**
 * Get certificate types needed for a specific checkpoint
 */
export function getCertificatesForCheckpoint(checkpointId: number): CertificateType[] {
  const certificates: CertificateType[] = []
  
  for (const [certType, checkpointIds] of Object.entries(CERTIFICATE_CHECKPOINT_MAP)) {
    if (checkpointIds.includes(checkpointId)) {
      certificates.push(certType as CertificateType)
    }
  }
  
  return certificates
}

/**
 * Check if a certificate is required for an assessment
 * Returns checkpoint IDs that need this certificate
 */
export function getRequiredCheckpoints(certificateType: CertificateType): {
  id: number
  description: string
}[] {
  const checkpointDescriptions: Record<number, string> = {
    9: 'Central Heating',
    10: 'Hot Water Supply',
    11: 'Boiler Safety',
    13: 'Carbon Monoxide Alarms',
    14: 'Electrical Safety',
    15: 'Gas Safety',
    19: 'Water Supply',
  }

  const checkpointIds = getCheckpointsForCertificate(certificateType)
  
  return checkpointIds.map(id => ({
    id,
    description: checkpointDescriptions[id] || `Checkpoint ${id}`,
  }))
}

/**
 * Determine checkpoint status based on certificate validity
 */
export function getCheckpointStatusFromCertificate(
  certificateExpiryDate: Date | null,
  certificateType: CertificateType
): 'compliant' | 'non_compliant' | 'pending' {
  if (!certificateExpiryDate) {
    return 'pending'
  }

  const today = new Date()
  const expiryDate = new Date(certificateExpiryDate)

  if (expiryDate < today) {
    return 'non_compliant' // Certificate expired
  }

  return 'compliant' // Certificate valid
}

/**
 * Calculate days until certificate expires
 */
export function getDaysUntilExpiry(expiryDate: Date | string): number {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Check if certificate is expiring soon (within 30 days)
 */
export function isCertificateExpiringSoon(expiryDate: Date | string): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
  return daysUntilExpiry <= 30 && daysUntilExpiry > 0
}

/**
 * Check if certificate is expired
 */
export function isCertificateExpired(expiryDate: Date | string): boolean {
  const daysUntilExpiry = getDaysUntilExpiry(expiryDate)
  return daysUntilExpiry < 0
}

/**
 * Get certificate status color
 */
export function getCertificateStatusColor(expiryDate: Date | string): {
  bg: string
  text: string
  badge: string
} {
  if (isCertificateExpired(expiryDate)) {
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800',
    }
  }

  if (isCertificateExpiringSoon(expiryDate)) {
    return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800',
    }
  }

  return {
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
  }
}

/**
 * Get certificate type display name
 */
export function getCertificateTypeName(type: CertificateType): string {
  const names: Record<CertificateType, string> = {
    GAS_SAFETY: 'Gas Safety Certificate',
    EICR: 'Electrical Installation Condition Report',
    EPC: 'Energy Performance Certificate',
    PAT: 'Portable Appliance Testing',
    LEGIONELLA: 'Legionella Risk Assessment',
  }
  return names[type] || type
}

/**
 * Format certificate type for database queries
 */
export function formatCertificateType(type: string): CertificateType | null {
  const typeUpper = type.toUpperCase().replace(/\s+/g, '_')
  if (typeUpper in CERTIFICATE_CHECKPOINT_MAP) {
    return typeUpper as CertificateType
  }
  return null
}
