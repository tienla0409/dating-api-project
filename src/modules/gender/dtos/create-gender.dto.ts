import { IsNotEmpty, IsString } from 'class-validator';

export class CreateGenderDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  description: string;
}
