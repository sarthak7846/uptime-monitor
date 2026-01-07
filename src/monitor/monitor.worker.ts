import { Worker } from 'bullmq';
import axios from 'axios';
import { Monitor, PrismaClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';
import { ProbeResult } from './interfaces/probe-result.interface';

const prisma = new PrismaClient();

const normalizeProbeResult = (
  error: any,
  response: any,
  startTime: any,
): ProbeResult => {
  const responseMs = Date.now() - startTime;

  if (response) {
    const status = response.status;

    if (status >= 200 && status < 400) {
      return {
        isHealthy: true,
        responseMs,
        statusCode: status,
      };
    }

    return {
      isHealthy: false,
      responseMs,
      statusCode: status,
      reason: `HTTP_${status}`,
    };
  }

  if (error) {
    return {
      isHealthy: false,
      reason: error.code || 'NETWORK_ERROR',
    };
  }

  return {
    isHealthy: false,
    reason: 'UNKNOWN_ERROR',
  };
};

const runProbe = async (monitor: Partial<Monitor>) => {
  const { timeout, url, method } = monitor;
  const start = Date.now();

  try {
    const response = await axios({
      url,
      method,
      timeout,
      validateStatus: () => true, // Dont throw on 4xx/5xx
    });

    return normalizeProbeResult(null, response, start);
  } catch (error) {
    return normalizeProbeResult(error, null, start);
  }
};

const startIncident = async (monitorId: string, reason?: string) => {
  console.log('Incident started', monitorId);

  return prisma.incident.create({
    data: {
      monitorId,
      startedAt: new Date(),
      status: 'OPEN',
      triggerReason: reason ?? 'HEALTH_CHECK_FAILED',
    },
  });
};

const resolveIncident = async (monitorId: string) => {
  console.log('Incident resolved', monitorId);

  return prisma.incident.updateMany({
    where: {
      monitorId,
      status: 'OPEN',
    },
    data: {
      status: 'RESOLVED',
      endedAt: new Date(),
    },
  });
};

new Worker(
  'monitor-check',
  async (job) => {
    console.log('Running job', job.data);

    const { monitorId } = job.data;

    const monitor = await prisma.monitor.findFirst({
      where: { id: monitorId },
      select: {
        id: true,
        lastStatus: true,
        consecutiveFailures: true,
        consecutiveSuccesses: true,
        timeout: true,
        url: true,
        method: true,
      },
    });

    if (!monitor) throw new NotFoundException('Monitor not found');

    const probeResult = await runProbe(monitor);

    const isHealthy = probeResult.isHealthy;

    const failureThreshold = 3;
    const successThreshold = 2;

    let nextStatus = monitor.lastStatus;
    let nextConsecutiveFailures = monitor.consecutiveFailures;
    let nextConsecutiveSuccesses = monitor.consecutiveSuccesses;
    let shouldStartIncident = false;
    let shouldResolveIncident = false;

    console.log('probe result', probeResult);

    // Probe is healthy
    if (isHealthy) {
      nextConsecutiveFailures = 0;

      if (monitor.lastStatus === 'DOWN') {
        nextConsecutiveSuccesses++;

        if (nextConsecutiveSuccesses >= successThreshold) {
          nextStatus = 'UP';
          shouldResolveIncident = true;
          nextConsecutiveSuccesses = 0;
        }
      } else {
        nextConsecutiveSuccesses = 0;
      }

      if (monitor.lastStatus === 'PENDING') {
        nextStatus = 'UP';
      }
      //Probe failed
    } else {
      nextConsecutiveFailures++;
      nextConsecutiveSuccesses = 0;

      //Only transition after threshold
      if (nextConsecutiveFailures >= failureThreshold) {
        if (monitor.lastStatus === 'UP' || monitor.lastStatus === 'PENDING') {
          nextStatus = 'DOWN';
          shouldStartIncident = true;
        }
        nextConsecutiveFailures = failureThreshold;
      }
    }

    await Promise.all([
      prisma.monitor.update({
        where: { id: monitorId },
        data: {
          lastStatus: nextStatus,
          consecutiveFailures: nextConsecutiveFailures,
          consecutiveSuccesses: nextConsecutiveSuccesses,
        },
      }),
      prisma.monitorLog.create({
        data: {
          monitorId,
          status: isHealthy ? 'UP' : 'DOWN',
          responseMs: probeResult.responseMs,
          statusCode: probeResult.statusCode,
          reason: probeResult.reason,
        },
      }),
    ]);

    //Incident start/resolve operation
    if (shouldStartIncident) {
      await startIncident(monitorId, probeResult.reason);
    }

    if (shouldResolveIncident) {
      await resolveIncident(monitorId);
    }

    console.log(`${monitor.url} ${nextStatus} (${probeResult.responseMs}ms)`);
  },
  {
    connection: { host: 'localhost', port: 6379 },
  },
);
