import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginDto } from './dto/loginDto.js';
import { AuthGuard } from './auth.guard.js';
import type { RequestWithUser } from '../types/types.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.logIn(loginDto.email, loginDto.password)
    }

    @UseGuards(AuthGuard)
    @Get('profil')
    getProfil(@Request() request: RequestWithUser) {
        return request.user
    }
}
