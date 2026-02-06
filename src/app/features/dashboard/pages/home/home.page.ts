import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { CardModule } from 'primeng/card';
import { HouseService } from '../../../../services/house.service';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SelectModule, CardModule],
  templateUrl: './home.page.html',
})
export class HomePage {
  private houseService = inject(HouseService);

  readonly houses = this.houseService.allHouses;

  get currentHouse() {
    return this.houseService.currentHouse();
  }

  set currentHouse(house: any) {
    this.houseService.setActiveHouse(house.id);
  }
}
