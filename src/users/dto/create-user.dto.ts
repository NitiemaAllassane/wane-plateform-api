import { 
    IsEmail, 
    IsNotEmpty, 
    IsString,
    Length,
    Matches,
    MinLength
} from 'class-validator'
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    fullName: string;

    
    @IsEmail()
    email: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^[0-9]+$/, { message: 'Le numéro ne doit contenir que des chiffres' })
    @Length(10, 10)
    phone: string;

    @IsString()
    @MinLength(8)
    password: string;
}
