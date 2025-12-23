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
        url: res.url,
        method: res.method,
      },
      {
        repeat: {
          every: 60 * 1000,
        },
      },
    );

    return res;
  }

  async updateMonitor(id: string, updateMonitorDto: UpdateMonitorDto) {
    const res = await this.prisma.monitor.update({
      where: { id },
      data: updateMonitorDto,
    });
    return res;
  }

  async deleteMonitor(id: string) {
    const res = await this.prisma.monitor.delete({ where: { id } });
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
