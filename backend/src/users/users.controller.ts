import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/jwt.strategy';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.findById(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.update(user.id, dto);
  }

  @Delete('me')
  remove(@CurrentUser() user: AuthUser) {
    return this.users.remove(user.id);
  }
}
