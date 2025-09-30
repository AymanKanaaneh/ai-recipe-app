import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {
  selectedFile: File | null = null;
  recipe: any = null;
  errorMessage = '';
  loading = false;
  isDragging = false;
  imagePreviewUrl: string | null = null;
  shake = false;

  constructor(private http: HttpClient) {}

  onFileSelected(event: Event) { this.handleFiles((event.target as HTMLInputElement)?.files); }

  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragging = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragging = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.handleFiles(event.dataTransfer?.files || null);
  }

  clearSelection() {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.errorMessage = '';
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.tryGenerate();
  }

  onTryButton(event: Event) {
    event.preventDefault();
    this.tryGenerate();
  }

  private tryGenerate() {
    if (this.loading) return;
    if (!this.selectedFile) {
      this.errorMessage = 'Please add an image to continue.';
      this.triggerShake();
      return;
    }
    const formData = new FormData();
    formData.append('image', this.selectedFile);

    this.loading = true;
    this.errorMessage = '';
    this.http.post('http://127.0.0.1:8000/api/generate-recipe/', formData).subscribe({
      next: (data) => {
        this.recipe = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to generate recipe. Please try again.';
        this.loading = false;
        this.triggerShake();
      }
    });
  }

  private triggerShake() {
    this.shake = true;
    setTimeout(() => (this.shake = false), 400);
  }

  private handleFiles(fileList: FileList | null) {
    this.errorMessage = '';
    this.recipe = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Please select a JPG, PNG, or GIF image.';
      return;
    }
    if (file.size > maxSize) {
      this.errorMessage = 'Image is too large. Max size is 5MB.';
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => { this.imagePreviewUrl = reader.result as string; };
    reader.readAsDataURL(file);
  }
}



