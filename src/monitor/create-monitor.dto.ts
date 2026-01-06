import { HttpMethod, MonitorState } from '@prisma/client';
import { IsIn, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateMonitorDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  url: string;

  @IsIn(['GET', 'POST', 'HEAD'])
  method: HttpMethod;

  @IsIn(['PENDING', 'UP', 'DOWN'])
  @IsOptional()
  lastStatus?: MonitorState;

  @IsNumber()
  interval: number;

  @IsNumber()
  timeout: number;
}
