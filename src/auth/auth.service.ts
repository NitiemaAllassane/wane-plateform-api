import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UsersService,
        private readonly jwtService: JwtService,
    ) {}

    async register(createUserDto: CreateUserDto) {
        const existingUser = await this.userService.findByEmailOrPhone(createUserDto.email ,createUserDto.phone);
        if (existingUser) {
            if (existingUser.email === createUserDto.email) {
                throw new ConflictException(`L'email ${createUserDto.email} est déjà utilisé`);
            }

            throw new ConflictException(`Le numero ${createUserDto.phone} est déjà utilisé`);
        }

        return this.userService.create(createUserDto)
    }


    async logIn(email: string, password: string) {
        const user = await this.userService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            throw new UnauthorizedException('Email ou mot de passe incorrect');
        }

        const playload = {
            sub: user.id,
            email: user.email
        }
        const accessToken = await this.jwtService.signAsync(playload);

        return {
            accessToken
        }

    }
}
