import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createProjectInputSchema,
  updateProjectInputSchema,
  createActivityInputSchema,
  updateActivityInputSchema,
  updateExchangeRateInputSchema
} from './schema';

// Import handlers
import { createProject } from './handlers/create_project';
import { getProjects } from './handlers/get_projects';
import { getProjectById } from './handlers/get_project_by_id';
import { updateProject } from './handlers/update_project';
import { createActivity } from './handlers/create_activity';
import { getActivities } from './handlers/get_activities';
import { updateActivity } from './handlers/update_activity';
import { updateExchangeRate } from './handlers/update_exchange_rate';
import { getBudgetAnalysis } from './handlers/get_budget_analysis';
import { getExchangeRateHistory } from './handlers/get_exchange_rate_history';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Project management routes
  createProject: publicProcedure
    .input(createProjectInputSchema)
    .mutation(({ input }) => createProject(input)),

  getProjects: publicProcedure
    .query(() => getProjects()),

  getProjectById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProjectById(input.id)),

  updateProject: publicProcedure
    .input(updateProjectInputSchema)
    .mutation(({ input }) => updateProject(input)),

  // Activity management routes
  createActivity: publicProcedure
    .input(createActivityInputSchema)
    .mutation(({ input }) => createActivity(input)),

  getActivities: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getActivities(input.projectId)),

  updateActivity: publicProcedure
    .input(updateActivityInputSchema)
    .mutation(({ input }) => updateActivity(input)),

  // Exchange rate management
  updateExchangeRate: publicProcedure
    .input(updateExchangeRateInputSchema)
    .mutation(({ input }) => updateExchangeRate(input)),

  getExchangeRateHistory: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getExchangeRateHistory(input.projectId)),

  // Budget analysis and reporting
  getBudgetAnalysis: publicProcedure
    .input(z.object({ projectId: z.number() }))
    .query(({ input }) => getBudgetAnalysis(input.projectId))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();