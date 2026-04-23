import { Controller, Get } from '@nestjs/common';
import { GroupsService } from './groups.service';
import type { Group } from '@mitigram/shared';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groups: GroupsService) {}

  @Get()
  findAll(): Promise<Group[]> {
    return this.groups.findAll();
  }
}
