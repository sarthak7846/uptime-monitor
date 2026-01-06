import { Worker } from 'bullmq';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { NotFoundException } from '@nestjs/common';

const prisma = new PrismaClient();

new Worker(
  'monitor-check',
  async (job) => {
    console.log('Running job', job.data);

    const { monitorId } = job.data;

    const monitor = await prisma.monitor.findFirst({
      where: { id: monitorId },
    });

    if (!monitor) throw new NotFoundException('Monitor not found');

    const { timeout, url, method } = monitor;

    const start = Date.now();

    try {
      await axios({
        url,
        method,
        timeout,
      });

      const responseMs = Date.now() - start;

      await Promise.all([
        prisma.monitor.update({
          where: { id: monitorId },
          data: { lastStatus: 'UP' },
        }),
        prisma.monitorLog.create({
          data: {
            monitorId,
            status: 'UP',
            responseMs,
          },
        }),
      ]);

      console.log(`${url} UP (${responseMs}ms)`);
    } catch (error) {
      await Promise.all([
        prisma.monitor.update({
          where: { id: monitorId },
          data: { lastStatus: 'DOWN' },
        }),
        prisma.monitorLog.create({
          data: {
            monitorId,
            status: 'DOWN',
          },
        }),
      ]);
      console.log(`${url} DOWN`);
    }
  },
  {
    connection: { host: 'localhost', port: 6379 },
  },
);
