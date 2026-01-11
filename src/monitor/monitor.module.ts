import { Module } from '@nestjs/common';
import { MonitorController } from './monitor.controller';
import { MonitorService } from './monitor.service';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [MonitorController],
  providers: [MonitorService],
})
export class MonitorModule {}
