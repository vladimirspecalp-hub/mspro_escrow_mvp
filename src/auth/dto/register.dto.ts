import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Некорректный email адрес' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль слишком длинный' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя слишком длинное' })
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
