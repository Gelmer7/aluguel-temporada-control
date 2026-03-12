import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileUploadModule } from 'primeng/fileupload';
import { ButtonModule } from 'primeng/button';
import { TranslateModule } from '@ngx-translate/core';
import { House, HousePhoto } from '../../../../../../models/house.model';
import { SupabaseService } from '../../../../../../services/supabase.service';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-photo-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FileUploadModule,
    ButtonModule,
    TranslateModule,
    TooltipModule
  ],
  templateUrl: './photo-step.component.html'
})
export class PhotoStepComponent implements OnInit {
  private supabaseService = inject(SupabaseService);

  @Input() house: House | null = null;
  @Output() onPhotosChange = new EventEmitter<HousePhoto[]>();

  photos = signal<HousePhoto[]>([]);

  ngOnInit() {
    if (this.house) {
      this.loadPhotos();
    }
  }

  async loadPhotos() {
    if (!this.house) return;
    const { data, error } = await this.supabaseService.getHousePhotos(this.house.code);
    if (!error && data) {
      this.photos.set(data);
      this.onPhotosChange.emit(data);
    }
  }

  onSelect(event: any) {
    // Captura os arquivos selecionados
    for (let file of event.currentFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const newPhoto: HousePhoto = {
          house_code: this.house?.code || '',
          url: e.target.result, // Aqui estamos salvando como Base64 (ideal seria upload para Storage)
          is_cover: this.photos().length === 0,
          sort_order: this.photos().length
        };
        this.photos.update(prev => [...prev, newPhoto]);
        this.onPhotosChange.emit(this.photos());
      };
      reader.readAsDataURL(file);
    }
  }

  async setAsCover(photo: HousePhoto) {
    if (this.house && photo.id) {
      const { error } = await this.supabaseService.setHouseCoverPhoto(this.house.code, photo.id);
      if (!error) {
        this.loadPhotos();
      }
    } else {
      // Edição local para nova casa
      const updatedPhotos = this.photos().map(p => ({
        ...p,
        is_cover: p === photo
      }));
      this.photos.set(updatedPhotos);
      this.onPhotosChange.emit(updatedPhotos);
    }
  }

  async deletePhoto(photo: HousePhoto) {
    if (photo.id) {
      const { error } = await this.supabaseService.deleteHousePhoto(photo.id);
      if (!error) {
        this.loadPhotos();
      }
    } else {
      // Remoção local
      const updatedPhotos = this.photos().filter(p => p !== photo);
      this.photos.set(updatedPhotos);
      this.onPhotosChange.emit(updatedPhotos);
    }
  }
}
