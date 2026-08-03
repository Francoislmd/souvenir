import "dotenv/config";
import * as Sentry from "@sentry/node";
import { prisma } from "@souvenir/db";
import { processPreviewJob } from "./jobs/preview.js";
import { MAX_JOB_ATTEMPTS, MAX_PARALLEL_JOBS } from "./lib/limits.js";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});

const POLL_INTERVAL_MS = 3000;

async function claimNextJob() {
  return prisma.$transaction(async (tx) => {
    const [job] = await tx.$queryRaw<{ id: string; photoId: string | null; kind: string; attempts: number }[]>`
      SELECT id, "photoId", kind, attempts FROM "ProcessingJob"
      WHERE status = 'pending'
      ORDER BY "createdAt" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `;
    if (!job) return null;

    await tx.processingJob.update({
      where: { id: job.id },
      data: { status: "running", lockedAt: new Date(), attempts: { increment: 1 } },
    });

    return job;
  });
}

// "publish_group" (regroupement EXIF des sorties GROUPE) tourne en ligne
// dans apps/web (lib/group-publish.ts), au même endroit que la génération
// des aperçus déclenchée par /api/photos/[photoId]/complete — pas ici. Ce
// worker ne traite donc encore que "preview" ; le cas "publish_group" n'a
// pas de photoId et ne doit pas être réclamé par cette boucle.
async function runJob(job: { id: string; photoId: string | null; kind: string; attempts: number }): Promise<void> {
  try {
    if (job.kind === "preview" && job.photoId) {
      await processPreviewJob({ photoId: job.photoId });
    } else {
      throw new Error(`Unknown or unsupported job kind: ${job.kind}`);
    }

    await prisma.processingJob.update({ where: { id: job.id }, data: { status: "done" } });
  } catch (error) {
    console.error(`[worker] job ${job.id} (${job.kind}) failed`, error);
    Sentry.captureException(error, { tags: { jobId: job.id, jobKind: job.kind } });

    if (job.attempts >= MAX_JOB_ATTEMPTS) {
      await prisma.processingJob.update({ where: { id: job.id }, data: { status: "failed" } });
      if (job.photoId) await prisma.photo.update({ where: { id: job.photoId }, data: { status: "FAILED" } });
    } else {
      await prisma.processingJob.update({ where: { id: job.id }, data: { status: "pending" } });
    }
  }
}

async function pollLoop(): Promise<void> {
  const inFlight = new Set<Promise<void>>();

  for (;;) {
    try {
      while (inFlight.size < MAX_PARALLEL_JOBS) {
        const job = await claimNextJob();
        if (!job) break;

        const task = runJob(job).finally(() => inFlight.delete(task));
        inFlight.add(task);
      }

      if (inFlight.size > 0) {
        await Promise.race(inFlight);
      } else {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    } catch (error) {
      console.error("[worker] poll loop error, retrying", error);
      Sentry.captureException(error);
      await prisma.$disconnect().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }
  }
}

pollLoop().catch(async (error) => {
  console.error("[worker] fatal error", error);
  Sentry.captureException(error);
  await Sentry.flush(2000).catch(() => undefined); // laisse l'événement partir avant process.exit
  process.exit(1);
});
