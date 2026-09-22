import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { UsersService } from '../users/users.service.js';

@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [UsersService]
})
export class AuthModule {}
