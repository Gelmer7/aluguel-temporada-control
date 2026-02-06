import { Injectable, signal, computed } from '@angular/core';

export interface House {
  id: string;
  name: string;
  code: string;
}

@Injectable({
  providedIn: 'root',
})
export class HouseService {
  // Lista de casas (pode vir de uma tabela no futuro)
  private readonly houses = signal<House[]>([
    { id: '1', name: 'Casa 47', code: 'CASA_47' },
    { id: '2', name: 'Casa 08', code: 'CASA_08' },
  ]);

  // Casa ativa (por padrão a primeira)
  private readonly activeHouseId = signal<string>(this.houses()[0].id);

  // Seletores públicos
  readonly allHouses = this.houses.asReadonly();
  
  readonly currentHouse = computed(() => 
    this.houses().find(h => h.id === this.activeHouseId()) || this.houses()[0]
  );

  readonly currentHouseCode = computed(() => this.currentHouse().code);

  /**
   * Altera a casa ativa
   */
  setActiveHouse(id: string) {
    if (this.houses().some(h => h.id === id)) {
      this.activeHouseId.set(id);
    }
  }
}
