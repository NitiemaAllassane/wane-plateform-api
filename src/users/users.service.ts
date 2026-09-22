import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';


const userSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;


@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    return this.prisma.user.create({
      data: {
        password: hashedPassword,
        fullName: createUserDto.fullName,
        phone: createUserDto.phone,
        email: createUserDto.email
      }, 
      select: userSelect
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: userSelect
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      select: userSelect,
      where: { id }
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'id ${id} introuvable`);
    }

    return user;
  }

   async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    const data: Prisma.UserUpdateInput = { ...updateUserDto }

    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      data,
      where: {id},
      select: userSelect
    })
  }

  async remove(id: string) {
    await this.findOne(id)
    return this.prisma.user.delete({ 
      where: { id },
      select: userSelect
    });
  }
}
