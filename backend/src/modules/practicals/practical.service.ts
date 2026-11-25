import { prisma } from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { OwnershipActor } from '../../utils/ownership.js';
import { SavePracticalProgressBody } from './practical.schema.js';

export function normalizePracticalVersion(v?: string): 'VERSION_A' | 'VERSION_B' {
  if (!v) return 'VERSION_A';
  const upper = v.trim().toUpperCase();
  if (upper === 'A' || upper === 'VERSION_A') return 'VERSION_A';
  if (upper === 'B' || upper === 'VERSION_B') return 'VERSION_B';
  return 'VERSION_A';
}

export class PracticalService {
  /**
   * Helper to resolve a PracticalTask by id, taskCode, or taskNumber
   */
  async resolveTask(taskIdentifier: string | number) {
    const raw = String(taskIdentifier ?? '');
    const trimmed = raw.trim();
    const asNumber = typeof taskIdentifier === 'number' ? taskIdentifier : parseInt(trimmed, 10);

    const task = await prisma.practicalTask.findFirst({
      where: {
        OR: [
          { id: trimmed },
          { taskCode: trimmed },
          ...(!isNaN(asNumber) && asNumber >= 1 && asNumber <= 5 ? [{ taskNumber: asNumber }] : []),
        ],
      },
    });

    if (!task) {
      throw new NotFoundError(`找不到指定的術科題組：${taskIdentifier}`);
    }

    return task;
  }

  /**
   * Retrieves all 5 official practical tasks along with user progress summaries for Version A and Version B
   */
  async getTasks(actor: OwnershipActor) {
    const tasks = await prisma.practicalTask.findMany({
      orderBy: { taskNumber: 'asc' },
      include: {
        steps: {
          select: { id: true, version: true, stepNumber: true },
        },
      },
    });

    // Fetch all user progress records across all practical tasks
    const userProgresses = await prisma.practicalProgress.findMany({
      where: { userId: actor.id },
      include: {
        stepProgresses: {
          select: { stepId: true, isCompleted: true },
        },
      },
    });

    const progressMap = new Map<string, (typeof userProgresses)[0]>();
    userProgresses.forEach((p) => {
      progressMap.set(`${p.taskId}:${p.version}`, p);
    });

    return tasks.map((t) => {
      const vASteps = t.steps.filter((s) => s.version === 'VERSION_A');
      const vBSteps = t.steps.filter((s) => s.version === 'VERSION_B');

      const pA = progressMap.get(`${t.id}:VERSION_A`);
      const pB = progressMap.get(`${t.id}:VERSION_B`);

      const pACompletedCount = pA
        ? pA.stepProgresses.filter((sp) => sp.isCompleted).length
        : 0;
      const pBCompletedCount = pB
        ? pB.stepProgresses.filter((sp) => sp.isCompleted).length
        : 0;

      return {
        id: t.id,
        taskNumber: t.taskNumber,
        taskCode: t.taskCode,
        title: t.title,
        theme: t.theme,
        canvasWidth: t.canvasWidth,
        estimatedMinutes: t.estimatedMinutes,
        materialPath: t.materialPath,
        status: t.status,
        progress: {
          versionA: {
            version: 'VERSION_A',
            status: pA?.status || 'NOT_STARTED',
            completedSteps: pACompletedCount,
            totalSteps: vASteps.length,
            isCompleted: pA?.status === 'COMPLETED' || (vASteps.length > 0 && pACompletedCount === vASteps.length),
            lastPracticedAt: pA?.lastPracticedAt?.toISOString() || null,
          },
          versionB: {
            version: 'VERSION_B',
            status: pB?.status || 'NOT_STARTED',
            completedSteps: pBCompletedCount,
            totalSteps: vBSteps.length,
            isCompleted: pB?.status === 'COMPLETED' || (vBSteps.length > 0 && pBCompletedCount === vBSteps.length),
            lastPracticedAt: pB?.lastPracticedAt?.toISOString() || null,
          },
        },
      };
    });
  }

  /**
   * Retrieves task details, steps, and user's saved code and progress for the requested version
   */
  async getTaskDetails(actor: OwnershipActor, taskIdentifier: string | number, rawVersion?: string) {
    const task = await this.resolveTask(taskIdentifier);
    const version = normalizePracticalVersion(rawVersion);

    // Fetch steps strictly matching this version
    const steps = await prisma.practicalStep.findMany({
      where: {
        taskId: task.id,
        version,
      },
      orderBy: { stepNumber: 'asc' },
    });

    // Fetch user progress for this exact (task, version) pair
    const progress = await prisma.practicalProgress.findUnique({
      where: {
        userId_taskId_version: {
          userId: actor.id,
          taskId: task.id,
          version,
        },
      },
      include: {
        stepProgresses: true,
      },
    });

    const stepCompletionMap = new Map<string, boolean>();
    if (progress) {
      progress.stepProgresses.forEach((sp) => {
        stepCompletionMap.set(sp.stepId, sp.isCompleted);
      });
    }

    const stepsWithProgress = steps.map((s) => ({
      id: s.id,
      stepNumber: s.stepNumber,
      title: s.title,
      description: s.description,
      videoUrl: s.videoUrl,
      videoStartSeconds: s.videoStartSeconds,
      pitfallWarning: s.pitfallWarning,
      isCompleted: Boolean(stepCompletionMap.get(s.id)),
    }));

    const completedStepsCount = stepsWithProgress.filter((s) => s.isCompleted).length;
    const isCompleted = steps.length > 0 && completedStepsCount === steps.length;

    return {
      task: {
        id: task.id,
        taskNumber: task.taskNumber,
        taskCode: task.taskCode,
        title: task.title,
        theme: task.theme,
        canvasWidth: task.canvasWidth,
        estimatedMinutes: task.estimatedMinutes,
        materialPath: task.materialPath,
        defaultHtmlCode: task.defaultHtmlCode,
        defaultCssCode: task.defaultCssCode,
        defaultJsCode: task.defaultJsCode || '',
      },
      version,
      progress: {
        status: progress?.status || (completedStepsCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
        practiceCount: progress?.practiceCount || 0,
        completedStepsCount,
        totalStepsCount: steps.length,
        isCompleted: progress?.status === 'COMPLETED' || isCompleted,
        lastPracticedAt: progress?.lastPracticedAt?.toISOString() || null,
        savedHtmlCode: progress?.savedHtmlCode ?? task.defaultHtmlCode,
        savedCssCode: progress?.savedCssCode ?? task.defaultCssCode,
        savedJsCode: progress?.savedJsCode ?? (task.defaultJsCode || ''),
      },
      steps: stepsWithProgress,
    };
  }

  /**
   * Updates student progress and/or saves code snapshot for a specific (taskId, version).
   * Strictly isolates Version A and Version B progress.
   */
  async saveProgress(actor: OwnershipActor, taskIdentifier: string | number, body: SavePracticalProgressBody) {
    const task = await this.resolveTask(taskIdentifier);
    const version = normalizePracticalVersion(body.version);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or create progress record for (actor.id, task.id, version)
      let progress = await tx.practicalProgress.findUnique({
        where: {
          userId_taskId_version: {
            userId: actor.id,
            taskId: task.id,
            version,
          },
        },
      });

      if (!progress) {
        progress = await tx.practicalProgress.create({
          data: {
            userId: actor.id,
            taskId: task.id,
            version,
            status: 'IN_PROGRESS',
            practiceCount: 1,
            savedHtmlCode: body.savedHtmlCode ?? task.defaultHtmlCode,
            savedCssCode: body.savedCssCode ?? task.defaultCssCode,
            savedJsCode: body.savedJsCode ?? (task.defaultJsCode || ''),
            lastPracticedAt: now,
          },
        });
      } else {
        const updateData: any = {
          lastPracticedAt: now,
          practiceCount: { increment: 1 },
        };
        if (body.savedHtmlCode !== undefined) updateData.savedHtmlCode = body.savedHtmlCode;
        if (body.savedCssCode !== undefined) updateData.savedCssCode = body.savedCssCode;
        if (body.savedJsCode !== undefined) updateData.savedJsCode = body.savedJsCode;
        if (body.status !== undefined) updateData.status = body.status;

        progress = await tx.practicalProgress.update({
          where: { id: progress.id },
          data: updateData,
        });
      }

      // 2. Update step progress if stepId is specified
      if (body.stepId) {
        const step = await tx.practicalStep.findUnique({
          where: { id: body.stepId },
        });

        if (step && step.taskId === task.id && step.version === version) {
          const isCompleted = body.isStepCompleted ?? true;
          await tx.practicalStepProgress.upsert({
            where: {
              progressId_stepId: {
                progressId: progress.id,
                stepId: step.id,
              },
            },
            update: {
              isCompleted,
              completedAt: isCompleted ? now : null,
              updatedAt: now,
            },
            create: {
              progressId: progress.id,
              stepId: step.id,
              isCompleted,
              completedAt: isCompleted ? now : null,
            },
          });
        }
      }

      // 3. Batch update completed step numbers if provided
      if (body.completedStepNumbers && Array.isArray(body.completedStepNumbers)) {
        const matchingSteps = await tx.practicalStep.findMany({
          where: {
            taskId: task.id,
            version,
            stepNumber: { in: body.completedStepNumbers },
          },
        });

        for (const s of matchingSteps) {
          await tx.practicalStepProgress.upsert({
            where: {
              progressId_stepId: {
                progressId: progress.id,
                stepId: s.id,
              },
            },
            update: {
              isCompleted: true,
              completedAt: now,
              updatedAt: now,
            },
            create: {
              progressId: progress.id,
              stepId: s.id,
              isCompleted: true,
              completedAt: now,
            },
          });
        }
      }

      // 4. Recalculate status based on completed steps
      const allSteps = await tx.practicalStep.findMany({
        where: { taskId: task.id, version },
        select: { id: true },
      });

      const completedStepRecords = await tx.practicalStepProgress.findMany({
        where: {
          progressId: progress.id,
          isCompleted: true,
        },
      });

      const isAllDone = allSteps.length > 0 && completedStepRecords.length >= allSteps.length;
      let finalStatus = progress.status;

      if (isAllDone || body.status === 'COMPLETED') {
        finalStatus = 'COMPLETED';
      } else if (completedStepRecords.length > 0) {
        finalStatus = 'IN_PROGRESS';
      }

      if (finalStatus !== progress.status) {
        progress = await tx.practicalProgress.update({
          where: { id: progress.id },
          data: {
            status: finalStatus,
            completedAt: finalStatus === 'COMPLETED' ? now : null,
          },
        });
      }

      return {
        progressId: progress.id,
        taskId: task.id,
        version,
        status: progress.status,
        completedStepsCount: completedStepRecords.length,
        totalStepsCount: allSteps.length,
        isCompleted: finalStatus === 'COMPLETED',
        lastPracticedAt: progress.lastPracticedAt.toISOString(),
      };
    });

    return result;
  }

  /**
   * Retrieves only the saved code for a specific (taskId, version)
   */
  async getSavedCode(actor: OwnershipActor, taskIdentifier: string | number, rawVersion?: string) {
    const task = await this.resolveTask(taskIdentifier);
    const version = normalizePracticalVersion(rawVersion);

    const progress = await prisma.practicalProgress.findUnique({
      where: {
        userId_taskId_version: {
          userId: actor.id,
          taskId: task.id,
          version,
        },
      },
    });

    return {
      taskId: task.id,
      taskCode: task.taskCode,
      version,
      hasSavedCode: Boolean(progress?.savedHtmlCode || progress?.savedCssCode || progress?.savedJsCode),
      savedHtmlCode: progress?.savedHtmlCode ?? task.defaultHtmlCode,
      savedCssCode: progress?.savedCssCode ?? task.defaultCssCode,
      savedJsCode: progress?.savedJsCode ?? (task.defaultJsCode || ''),
      defaultHtmlCode: task.defaultHtmlCode,
      defaultCssCode: task.defaultCssCode,
      defaultJsCode: task.defaultJsCode || '',
      lastPracticedAt: progress?.lastPracticedAt?.toISOString() || null,
    };
  }
}

export const practicalService = new PracticalService();
