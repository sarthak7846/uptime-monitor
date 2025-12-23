import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';
import { SignupDto } from './signup.dto';
import { Public } from './public.decorator';

@Public()
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        const res = await this.authService.login(loginDto);
        return res;
    }

    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        const res = await this.authService.signup(signupDto);
        return res;
    }
}
