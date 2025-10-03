/**
 * Alert Notification Service
 * 
 * Handles:
 * - Automated alert generation for council changes
 * - User notification delivery (email + in-app)
 * - Alert aggregation and digest generation
 * - Priority calculation and escalation
 */

import prisma from './prisma';
import {
  AlertType,
  AlertCategory,
  AlertSeverity,
  AlertStatus,
  ChangeType,
  ImpactLevel,
} from '@prisma/client';

interface AlertConfig {
  title: string;
  description: string;
  alertType: AlertType;
  category: AlertCategory;
  severity: AlertSeverity;
  priority: number;
}

/**
 * Generate alert based on council change
 */
export async function generateAlertFromChange(
  councilId: string,
  changeType: ChangeType,
  field: string,
  oldValue: string | null,
  newValue: string,
  effectiveDate: Date,
  sourceUrl?: string
): Promise<string> {
  const config = getAlertConfig(changeType, field, oldValue, newValue);

  const alert = await prisma.regulatoryAlert.create({
    data: {
      councilId,
      alertType: config.alertType,
      category: config.category,
      title: config.title,
      description: config.description,
      effectiveDate,
      severity: config.severity,
      priority: config.priority,
      sourceUrl,
      status: AlertStatus.ACTIVE,
    },
  });

  // Notify affected users
  await notifyUsersOfAlert(alert.id);

  return alert.id;
}

/**
 * Determine alert configuration based on change type
 */
function getAlertConfig(
  changeType: ChangeType,
  field: string,
  oldValue: string | null,
  newValue: string
): AlertConfig {
  let alertType: AlertType;
  let category: AlertCategory;
  let severity: AlertSeverity;
  let priority: number;
  let title: string;
  let description: string;

  switch (changeType) {
    case ChangeType.FEE_INCREASE:
      alertType = AlertType.FEE_CHANGE;
      category = AlertCategory.FEES;
      severity = AlertSeverity.HIGH;
      priority = 4;
      title = `${field} Fee Increased`;
      description = `${field} has increased from £${oldValue} to £${newValue}. This may affect renewal costs.`;
      break;

    case ChangeType.FEE_DECREASE:
      alertType = AlertType.FEE_CHANGE;
      category = AlertCategory.FEES;
      severity = AlertSeverity.LOW;
      priority = 2;
      title = `${field} Fee Decreased`;
      description = `${field} has decreased from £${oldValue} to £${newValue}. Savings available on renewals.`;
      break;

    case ChangeType.REQUIREMENT_ADDED:
      alertType = AlertType.REQUIREMENT_CHANGE;
      category = AlertCategory.COMPLIANCE;
      severity = AlertSeverity.CRITICAL;
      priority = 5;
      title = `New Requirement Added: ${field}`;
      description = `A new compliance requirement has been added: ${newValue}. Action may be required for existing properties.`;
      break;

    case ChangeType.REQUIREMENT_REMOVED:
      alertType = AlertType.REQUIREMENT_CHANGE;
      category = AlertCategory.COMPLIANCE;
      severity = AlertSeverity.LOW;
      priority = 2;
      title = `Requirement Removed: ${field}`;
      description = `${field} is no longer required: ${oldValue}. This simplifies compliance.`;
      break;

    case ChangeType.DEADLINE_CHANGE:
      alertType = AlertType.DEADLINE;
      category = AlertCategory.COMPLIANCE;
      severity = AlertSeverity.HIGH;
      priority = 4;
      title = `Deadline Changed for ${field}`;
      description = `${field} deadline has changed from ${oldValue} to ${newValue}. Review your submission timelines.`;
      break;

    case ChangeType.PROCESS_UPDATE:
      alertType = AlertType.PROCESS_CHANGE;
      category = AlertCategory.GENERAL;
      severity = AlertSeverity.MEDIUM;
      priority = 3;
      title = `Process Update: ${field}`;
      description = `The process for ${field} has been updated. Previous process: ${oldValue}. New process: ${newValue}.`;
      break;

    case ChangeType.CONTACT_UPDATE:
      alertType = AlertType.CONTACT_CHANGE;
      category = AlertCategory.GENERAL;
      severity = AlertSeverity.INFO;
      priority = 1;
      title = `Contact Information Updated: ${field}`;
      description = `${field} has been updated from ${oldValue} to ${newValue}.`;
      break;

    case ChangeType.OTHER:
      alertType = AlertType.POLICY_UPDATE;
      category = AlertCategory.COMPLIANCE;
      severity = AlertSeverity.MEDIUM;
      priority = 3;
      title = `Policy Update: ${field}`;
      description = `Council policy has been updated for ${field}. Review the changes to ensure compliance.`;
      break;

    default:
      alertType = AlertType.SYSTEM;
      category = AlertCategory.GENERAL;
      severity = AlertSeverity.INFO;
      priority = 2;
      title = `Update to ${field}`;
      description = `${field} has been updated.`;
  }

  return {
    title,
    description,
    alertType,
    category,
    severity,
    priority,
  };
}

/**
 * Notify users of new alert based on their preferences
 */
export async function notifyUsersOfAlert(alertId: string): Promise<void> {
  const alert = await prisma.regulatoryAlert.findUnique({
    where: { id: alertId },
    include: {
      council: true,
    },
  });

  if (!alert) {
    throw new Error('Alert not found');
  }

  // Get users who should be notified
  const users = await getUsersForNotification(alert);

  for (const user of users) {
    // Create in-app notification
    if (user.preference.inAppEnabled) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: alert.title,
          message: alert.description,
          type: mapAlertTypeToNotificationType(alert.alertType),
          metadata: {
            alertId: alert.id,
            councilId: alert.councilId,
            severity: alert.severity,
            category: alert.category,
          },
        },
      });
    }

    // Send immediate email if enabled and severity is high enough
    if (
      user.preference.emailEnabled &&
      user.preference.immediateAlerts &&
      shouldSendImmediateEmail(alert.severity, user.preference.minSeverity)
    ) {
      await sendAlertEmail(user, alert);
    }
  }
}

/**
 * Get users who should receive notification for this alert
 */
async function getUsersForNotification(alert: any) {
  // Get all preferences first
  const allPreferences = await prisma.alertPreference.findMany();

  // Filter based on council and alert type preferences
  const filteredPreferences = allPreferences.filter((p) => {
    // Check council filter
    const councilFilterArray = Array.isArray(p.councilFilter) ? p.councilFilter : [];
    const passesCouncilFilter =
      councilFilterArray.length === 0 || // No filter means receive all
      (alert.councilId && councilFilterArray.includes(alert.councilId));

    if (!passesCouncilFilter) return false;

    // Check alert type preferences
    if (alert.alertType === AlertType.FEE_CHANGE && !p.feeChangeAlerts) return false;
    if (alert.alertType === AlertType.REQUIREMENT_CHANGE && !p.requirementAlerts) return false;
    if (alert.alertType === AlertType.DEADLINE && !p.deadlineAlerts) return false;
    if (alert.alertType === AlertType.POLICY_UPDATE && !p.policyChangeAlerts) return false;
    if (alert.alertType === AlertType.SYSTEM && !p.systemAlerts) return false;

    return true;
  });

  // Fetch users for filtered preferences
  const users = await prisma.user.findMany({
    where: {
      id: { in: filteredPreferences.map((p) => p.userId) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // Combine preferences with user data
  return filteredPreferences.map((p) => {
    const user = users.find((u) => u.id === p.userId);
    return {
      id: user!.id,
      name: user!.name || 'User',
      email: user!.email,
      preference: p,
    };
  }).filter((u) => u.email); // Only users with email
}

/**
 * Check if immediate email should be sent based on severity
 */
function shouldSendImmediateEmail(
  alertSeverity: AlertSeverity,
  minSeverity: AlertSeverity | null
): boolean {
  if (!minSeverity) return true;

  const severityLevels = {
    [AlertSeverity.INFO]: 1,
    [AlertSeverity.LOW]: 2,
    [AlertSeverity.MEDIUM]: 3,
    [AlertSeverity.HIGH]: 4,
    [AlertSeverity.CRITICAL]: 5,
  };

  return severityLevels[alertSeverity] >= severityLevels[minSeverity];
}

/**
 * Send alert notification email
 */
async function sendAlertEmail(user: any, alert: any): Promise<void> {
  const severityColors = {
    [AlertSeverity.INFO]: '#3b82f6',
    [AlertSeverity.LOW]: '#10b981',
    [AlertSeverity.MEDIUM]: '#f59e0b',
    [AlertSeverity.HIGH]: '#ef4444',
    [AlertSeverity.CRITICAL]: '#dc2626',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColors[alert.severity as AlertSeverity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          .council-name { font-weight: 600; color: #1f2937; }
          .date { color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🔔 New Regulatory Alert</h1>
          </div>
          
          <div class="content">
            <p>Hello ${user.name},</p>
            
            <h2 style="color: #1f2937; margin-top: 0;">${alert.title}</h2>
            
            ${alert.council ? `
              <p class="council-name">📍 ${alert.council.councilName}</p>
            ` : ''}
            
            <p class="date">Effective Date: ${alert.effectiveDate.toLocaleDateString('en-GB')}</p>
            
            <div style="margin: 20px 0;">
              <span class="badge" style="background: ${severityColors[alert.severity as AlertSeverity]}; color: white;">
                ${alert.severity}
              </span>
              <span class="badge" style="background: #e5e7eb; color: #374151;">
                ${alert.category}
              </span>
            </div>
            
            <p>${alert.description}</p>
            
            ${alert.sourceUrl ? `
              <p>
                <a href="${alert.sourceUrl}" style="color: #3b82f6;">View Official Source →</a>
              </p>
            ` : ''}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/councils" class="button">
              View in Dashboard
            </a>
          </div>
          
          <div class="footer">
            <p>You&apos;re receiving this because you have alert notifications enabled.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #3b82f6;">
                Manage notification preferences
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'ScotComply <onboarding@resend.dev>',
      to: user.email,
      subject: `[${alert.severity}] ${alert.title}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send alert email:', error);
  }
}

/**
 * Map alert type to notification type
 */
function mapAlertTypeToNotificationType(alertType: AlertType): string {
  const mapping = {
    [AlertType.FEE_CHANGE]: 'FEE_CHANGE',
    [AlertType.REQUIREMENT_CHANGE]: 'REQUIREMENT_CHANGE',
    [AlertType.DEADLINE]: 'DEADLINE_APPROACHING',
    [AlertType.POLICY_UPDATE]: 'POLICY_UPDATE',
    [AlertType.PROCESS_CHANGE]: 'SYSTEM',
    [AlertType.CONTACT_CHANGE]: 'SYSTEM',
    [AlertType.SYSTEM]: 'SYSTEM',
  };

  return mapping[alertType] || 'SYSTEM';
}

/**
 * Generate daily digest of alerts
 */
export async function generateDailyDigest(): Promise<void> {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Get users with daily digest enabled
  const preferences = await prisma.alertPreference.findMany({
    where: { dailyDigest: true },
  });

  const users = await prisma.user.findMany({
    where: {
      id: { in: preferences.map((p) => p.userId) },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  for (const userPref of preferences) {
    const user = users.find((u) => u.id === userPref.userId);
    if (!user || !user.email) continue;

    const councilFilterArray = Array.isArray(userPref.councilFilter) ? userPref.councilFilter as string[] : [];

    const alerts = await prisma.regulatoryAlert.findMany({
      where: {
        createdAt: { gte: yesterday },
        status: AlertStatus.ACTIVE,
        acknowledgements: {
          none: {
            userId: userPref.userId,
          },
        },
        ...(councilFilterArray.length > 0
          ? { councilId: { in: councilFilterArray } }
          : {}),
      },
      include: {
        council: {
          select: {
            councilName: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    if (alerts.length > 0) {
      await sendDigestEmail(user, alerts);
    }
  }
}

/**
 * Send daily digest email
 */
async function sendDigestEmail(user: any, alerts: any[]): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1f2937; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 20px; border: 1px solid #e5e7eb; border-top: none; }
          .alert-item { padding: 15px; margin: 10px 0; background: #f9fafb; border-left: 4px solid #3b82f6; border-radius: 4px; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-right: 8px; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 15px 0; }
          .footer { background: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📬 Your Daily Alert Digest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          
          <div class="content">
            <p>Hello ${user.name},</p>
            
            <p>You have <strong>${alerts.length}</strong> new alert${alerts.length > 1 ? 's' : ''} from the past 24 hours:</p>
            
            ${alerts.map(alert => `
              <div class="alert-item" style="border-left-color: ${
                alert.severity === 'CRITICAL' ? '#dc2626' :
                alert.severity === 'HIGH' ? '#ef4444' :
                alert.severity === 'MEDIUM' ? '#f59e0b' :
                alert.severity === 'LOW' ? '#10b981' : '#3b82f6'
              };">
                <div>
                  <span class="badge" style="background: #e5e7eb; color: #374151;">${alert.severity}</span>
                  ${alert.council ? `<span class="badge" style="background: #dbeafe; color: #1e40af;">${alert.council.councilName}</span>` : ''}
                </div>
                <h3 style="margin: 10px 0 5px 0; font-size: 16px;">${alert.title}</h3>
                <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">${alert.description}</p>
                <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                  Effective: ${alert.effectiveDate.toLocaleDateString('en-GB')}
                </p>
              </div>
            `).join('')}
            
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/councils" class="button">
              View All Alerts
            </a>
          </div>
          
          <div class="footer">
            <p>This is your daily digest of regulatory alerts.</p>
            <p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #3b82f6;">
                Manage notification preferences
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'ScotComply <onboarding@resend.dev>',
      to: user.email,
      subject: `Daily Digest: ${alerts.length} New Alert${alerts.length > 1 ? 's' : ''}`,
      html,
    });
  } catch (error) {
    console.error('Failed to send digest email:', error);
  }
}

/**
 * Automatically expire old alerts
 */
export async function expireOldAlerts(): Promise<number> {
  const result = await prisma.regulatoryAlert.updateMany({
    where: {
      status: AlertStatus.ACTIVE,
      expiryDate: {
        lt: new Date(),
      },
    },
    data: {
      status: AlertStatus.EXPIRED,
    },
  });

  return result.count;
}

/**
 * Calculate alert priority score
 */
export function calculateAlertPriority(
  severity: AlertSeverity,
  impactLevel: ImpactLevel,
  daysUntilEffective: number
): number {
  let score = 0;

  // Severity weight (1-5)
  const severityScores = {
    [AlertSeverity.INFO]: 1,
    [AlertSeverity.LOW]: 2,
    [AlertSeverity.MEDIUM]: 3,
    [AlertSeverity.HIGH]: 4,
    [AlertSeverity.CRITICAL]: 5,
  };
  score += severityScores[severity];

  // Impact level weight (0-2)
  const impactScores = {
    [ImpactLevel.LOW]: 0,
    [ImpactLevel.MEDIUM]: 1,
    [ImpactLevel.HIGH]: 2,
    [ImpactLevel.CRITICAL]: 2,
  };
  score += impactScores[impactLevel];

  // Urgency based on days until effective (0-2)
  if (daysUntilEffective <= 7) {
    score += 2;
  } else if (daysUntilEffective <= 30) {
    score += 1;
  }

  // Normalize to 1-5 scale
  return Math.min(5, Math.max(1, Math.round(score / 2)));
}
