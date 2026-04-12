import { Module, Global } from '@nestjs/common';
import { OrderHelper } from './order.helper';
import { PriorityHelper } from './priority.helper';

@Global()
@Module({
  providers: [OrderHelper, PriorityHelper],
  exports: [OrderHelper, PriorityHelper],
})
export class HelpersModule { }
