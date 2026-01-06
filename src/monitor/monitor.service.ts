import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateMonitorDto } from './create-monitor.dto';
import { UpdateMonitorDto } from './update-monitor.dto';
import { monitorQueue } from 'src/queue/queue.config';

@Injectable()
export class MonitorService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllMonitors() {
    const res = await this.prisma.monitor.findMany();
    return res;
  }

  async createMonitor(createMonitorDto: CreateMonitorDto, userId: string) {
    const res = await this.prisma.monitor.create({
      data: { ...createMonitorDto, userId },
    });

    // Enqueue first check
    await monitorQueue.add(
      'check-monitor',
      {
        monitorId: res.id,
      },
      {
        repeat: {
          every: createMonitorDto.interval,
        },
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );

    return res;
  }

  async updateMonitor(id: string, updateMonitorDto: UpdateMonitorDto) {
    const monitor = await this.prisma.monitor.findFirst({
      where: { id },
    });

    if (monitor && monitor?.interval !== updateMonitorDto?.interval) {
      // Reschedule job
      const schedulers = await monitorQueue.getJobSchedulers();

      console.log('existing jobs', JSON.stringify(schedulers, null, 2));

      const scheduler = schedulers.find(
        (s) => s.template?.data.monitorId === monitor.id,
      );

      if (scheduler) {
        await monitorQueue.removeJobScheduler(scheduler.key);
      }

      // console.log('matching job', monitorJob);
      await monitorQueue.add(
        'check-monitor',
        {
          monitorId: monitor.id,
        },
        {
          repeat: {
            every: updateMonitorDto.interval,
          },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    }

    const res = await this.prisma.monitor.update({
      where: { id },
      data: updateMonitorDto,
    });
    return res;
  }

  async deleteMonitor(id: string) {
    const res = await this.prisma.monitor.delete({ where: { id } });

    const schedulers = await monitorQueue.getJobSchedulers();

    const scheduler = schedulers.find((s) => s.template?.data.monitorId === id);

    if (scheduler) {
      await monitorQueue.removeJobScheduler(scheduler.key);
    }

    return res;
  }

  async getMonitor(id: string) {
    const res = await this.prisma.monitor.findUnique({ where: { id } });
    return res;
  }

  async getAllMonitorsOfUser(userId: string) {
    const res = await this.prisma.monitor.findMany({ where: { userId } });
    return res;
  }
}
