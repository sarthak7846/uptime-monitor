import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { NotificationModule } from 'src/notification/notification.module';
import { MonitorWorker } from './monitor.worker';

@Module({
  imports: [NotificationModule],
  controllers: [MonitorController],
  providers: [MonitorService, MonitorWorker],
})
export class MonitorModule {}
