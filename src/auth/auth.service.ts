import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private readonly userService: UsersService) {}

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
}
