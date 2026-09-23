import { Body, Controller, Get, Post, UseGuards, Request, Res, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { LoginDto } from './dto/loginDto.js';
import { AuthGuard } from './auth.guard.js';
import type { RequestWithUser } from '../types/types.js';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() dto: CreateUserDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true}) res: Response) {
        const { accessToken } = await this.authService.logIn(loginDto.email, loginDto.password);
        res.cookie(
            'access_token', 
            accessToken,
            {
                httpOnly: true,
                secure: false,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax'
            }
        );

        return {
            message: "Connexion réussie"
        }
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token');
        return { message: "deconnexion réussie"}
    }

    @UseGuards(AuthGuard)
    @Get('profil')
    getProfil(@Request() request: RequestWithUser) {
        return request.user
    }
}
