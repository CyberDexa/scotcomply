import { createTRPCRouter } from '@/lib/trpc'
import { userRouter } from './routers/user'
import { propertyRouter } from './routers/property'
import { certificateRouter } from './routers/certificate'
import { registrationRouter } from './routers/registration'
import { hmoRouter } from './routers/hmo'
import { notificationRouter } from './routers/notification'
import { analyticsRouter } from './routers/analytics'
import { repairingStandardRouter } from './routers/repairing-standard'
import { templateRouter } from './routers/template'
import { emailRouter } from './routers/email'
import { maintenanceRouter } from './routers/maintenance'
import { settingsRouter } from './routers/settings'
import { bulkRouter } from './routers/bulk'
import { searchRouter } from './routers/search'
import { amlRouter } from './routers/aml'
import { councilRouter } from './routers/council'
import { dashboardRouter } from './routers/dashboard'
import { leaseRouter } from './routers/lease'
import { transactionRouter } from './routers/transaction'
import { financialRouter } from './routers/financial'
import { workflowRouter } from './routers/workflow'

export const appRouter = createTRPCRouter({
  user: userRouter,
  property: propertyRouter,
  certificate: certificateRouter,
  registration: registrationRouter,
  hmo: hmoRouter,
  notification: notificationRouter,
  analytics: analyticsRouter,
  repairingStandard: repairingStandardRouter,
  template: templateRouter,
  email: emailRouter,
  maintenance: maintenanceRouter,
  settings: settingsRouter,
  bulk: bulkRouter,
  search: searchRouter,
  aml: amlRouter,
  council: councilRouter,
  dashboard: dashboardRouter,
  lease: leaseRouter,
  transaction: transactionRouter,
  financial: financialRouter,
  workflow: workflowRouter,
})

export type AppRouter = typeof appRouter
