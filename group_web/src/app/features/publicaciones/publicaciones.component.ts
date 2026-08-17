import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GroupDataService } from '../../core/services/group-data.service';
import { GroupPost, PostVisibility } from '../../core/models/group.models';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publicaciones.component.html',
  styleUrl: './publicaciones.component.scss'
})
export class PublicacionesComponent {
  readonly groupData = inject(GroupDataService);

  newPostText = signal<string>('');
  newPostImageUrl = signal<string>('');
  newPostVisibility = signal<PostVisibility>('Publicada');
  isExpandedCreator = signal<boolean>(false);

  replyInputs = signal<Record<string, string>>({});

  readonly presetPostImages = [
    { url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200', label: 'Concierto Lleno' },
    { url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1200', label: 'Estudio de Grabación' },
    { url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200', label: 'Festival de Noche' },
    { url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200', label: 'Instrumentos y Metales' }
  ];

  selectPresetImage(url: string): void {
    this.newPostImageUrl.set(this.newPostImageUrl() === url ? '' : url);
  }

  onFileSelected(e: any): void {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        this.newPostImageUrl.set(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  submitPost(): void {
    const text = this.newPostText().trim();
    if (!text && !this.newPostImageUrl()) {
      alert('Por favor escribe un mensaje o agrega una imagen.');
      return;
    }

    this.groupData.createPost(text, this.newPostImageUrl() || undefined, this.newPostVisibility());
    this.newPostText.set('');
    this.newPostImageUrl.set('');
    this.isExpandedCreator.set(false);
  }

  toggleLike(postId: string): void {
    this.groupData.toggleLikePost(postId);
  }

  setReplyText(commentId: string, text: string): void {
    this.replyInputs.update(map => ({ ...map, [commentId]: text }));
  }

  deletePost(postId: string): void {
    if (confirm('¿Estás seguro de eliminar esta publicación?')) {
      this.groupData.deletePost(postId);
    }
  }

  addComment(postId: string, commentText: string): void {
    if (!commentText?.trim()) return;
    this.groupData.addCommentToPost(postId, commentText);
  }

  sendReply(postId: string, commentId: string): void {
    const text = (this.replyInputs()[commentId] || '').trim();
    if (!text) return;

    this.groupData.replyToComment(postId, commentId, text);
    this.replyInputs.update(map => {
      const next = { ...map };
      delete next[commentId];
      return next;
    });
  }
}
