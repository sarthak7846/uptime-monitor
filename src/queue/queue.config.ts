import { Queue } from 'bullmq';

export const monitorQueue = new Queue('monitor-check', {
  connection: {
    host: 'localhost',
    port: 6379,
  },
});
