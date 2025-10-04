/**
 * Scottish Repairing Standard Categories
 * Based on Housing (Scotland) Act 2006
 * 
 * These constants are shared between client and server code.
 */
export const REPAIRING_STANDARD_CATEGORIES = {
  STRUCTURE: 'Structure and Exterior',
  DAMPNESS: 'Dampness and Weather Protection',
  HEATING: 'Heating and Hot Water',
  SAFETY: 'Safety Systems',
  FACILITIES: 'Facilities and Services',
  COMMON_AREAS: 'Common Areas',
} as const

/**
 * Repairing Standard 21-Point Checklist
 */
export const REPAIRING_STANDARD_CHECKPOINTS = [
  // Structure and Exterior (1-5)
  { id: 1, category: 'STRUCTURE', title: 'Roof Structure', description: 'Roof is structurally stable and watertight' },
  { id: 2, category: 'STRUCTURE', title: 'Walls Structure', description: 'External walls are structurally stable and weatherproof' },
  { id: 3, category: 'STRUCTURE', title: 'Windows and Doors', description: 'Windows and external doors are secure and in good repair' },
  { id: 4, category: 'STRUCTURE', title: 'Chimney and Flues', description: 'Chimneys, flues, and ventilation are in good condition' },
  { id: 5, category: 'STRUCTURE', title: 'Gutters and Downpipes', description: 'Rainwater drainage systems are functioning properly' },
  
  // Dampness and Weather Protection (6-8)
  { id: 6, category: 'DAMPNESS', title: 'Rising Damp', description: 'No evidence of rising damp in walls or floors' },
  { id: 7, category: 'DAMPNESS', title: 'Penetrating Damp', description: 'No penetrating damp from roof, walls, or windows' },
  { id: 8, category: 'DAMPNESS', title: 'Condensation', description: 'Adequate ventilation to prevent condensation and mold' },
  
  // Heating and Hot Water (9-11)
  { id: 9, category: 'HEATING', title: 'Central Heating', description: 'Fixed heating system capable of heating all rooms' },
  { id: 10, category: 'HEATING', title: 'Hot Water Supply', description: 'Adequate supply of hot water at reasonable cost' },
  { id: 11, category: 'HEATING', title: 'Boiler Safety', description: 'Heating equipment is safe and in good working order' },
  
  // Safety Systems (12-16)
  { id: 12, category: 'SAFETY', title: 'Smoke Alarms', description: 'Interlinked smoke alarms on each floor (living areas)' },
  { id: 13, category: 'SAFETY', title: 'Carbon Monoxide Alarms', description: 'CO alarms in rooms with fuel-burning appliances' },
  { id: 14, category: 'SAFETY', title: 'Electrical Safety', description: 'Electrical installation is safe (EICR compliant)' },
  { id: 15, category: 'SAFETY', title: 'Gas Safety', description: 'Gas appliances are safe and have valid certificate' },
  { id: 16, category: 'SAFETY', title: 'Structural Safety', description: 'Stairs, balconies, and railings are safe and secure' },
  
  // Facilities and Services (17-19)
  { id: 17, category: 'FACILITIES', title: 'Kitchen Facilities', description: 'Adequate kitchen facilities including sink and food preparation area' },
  { id: 18, category: 'FACILITIES', title: 'Bathroom Facilities', description: 'Functioning bath or shower, wash basin, and toilet' },
  { id: 19, category: 'FACILITIES', title: 'Water Supply', description: 'Adequate supply of clean cold and hot water' },
  
  // Common Areas (20-21)
  { id: 20, category: 'COMMON_AREAS', title: 'Common Area Safety', description: 'Common stairs, passages, and lifts are safe and lit' },
  { id: 21, category: 'COMMON_AREAS', title: 'Common Area Maintenance', description: 'Common areas are maintained and kept clear' },
]
