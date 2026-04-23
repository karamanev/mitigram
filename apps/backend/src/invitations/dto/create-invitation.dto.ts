import { IsArray, IsEmail, ArrayNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEmail({}, { each: true })
  emails!: string[];
}
