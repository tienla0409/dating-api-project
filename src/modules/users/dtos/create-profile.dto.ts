import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { Gender } from '../schemas/gender.schema';

export class UpdateProfileDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  lastName?: string;

  @IsDateString()
  @IsNotEmpty()
  birthday?: Date;

  @IsObject()
  @IsNotEmptyObject()
  gender?: Gender;

  @IsArray()
  @IsNotEmpty()
  userPhotos?: string[];

  @IsOptional()
  bio?: string;
}
