import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ExpertController } from './expert.controller';
import { ExpertService } from './expert.service';

@Module({
  imports: [ChatModule],
  controllers: [ExpertController],
  providers: [ExpertService],
})
export class ExpertModule {}
