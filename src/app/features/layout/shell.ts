import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Notifier } from '../../shared/notifier';
import { ChangePasswordDialog } from '../account/change-password-dialog';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly notifier = inject(Notifier);

  protected readonly isHandset = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 959.98px)')
      .pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly email = computed(() => this.auth.user()?.email ?? '');

  protected readonly navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Resumen' },
    { path: '/leads', icon: 'group', label: 'Leads' },
  ];

  protected changePassword(): void {
    this.dialog
      .open(ChangePasswordDialog, { autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((changed) => {
        if (changed) this.notifier.success('Contraseña actualizada');
      });
  }

  protected logout(): void {
    this.auth.logout();
  }
}
