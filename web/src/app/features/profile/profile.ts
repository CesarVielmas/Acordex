import { Component, inject, OnInit } from '@angular/core';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.scss'
})
export class Profile implements OnInit {
  private readonly layoutService = inject(LayoutService);

  ngOnInit() {
    this.layoutService.setPageTitle('MI PERFIL ACORDEX');
  }
  user = {
    name: 'Alejandro Mendoza',
    email: 'alejandro.mendoza@ejemplo.com',
    profileUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAHmOKfsdeDk97RkFYA82JzuIe_TkK0xot_uMkINkxsobVv9lZln3uk5hy5nhpB71kyLOJzytl4SJggaFdNvA2H3mYv12flzxqody7GmSYbuGC1zhEyqOXOAZQmZqJ3ChDntHBQ6UuKwLFux4SfdbaJRTUDuMSU9gZgIlz-vse6ksoS6U2P7vBi_u1Lc1ErwyS3ciIrzGpfJ7V51r8hz6b6IOymxCHPv3BvrOMjbXIq8h6YhAgxoZbn_8gwnBtJvc6IrWfLJA6X3AY'
  };
}
