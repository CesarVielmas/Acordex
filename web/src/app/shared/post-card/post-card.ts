import { Component, Input, OnInit, OnChanges, signal, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-post-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './post-card.html',
  styleUrl: './post-card.scss'
})
export class PostCard implements OnInit, OnChanges {
  @Input() authorName: string = '';
  @Input() authorAvatar: string = '';
  @Input() timeAgo: string = '';
  @Input() content: string = '';
  @Input() mediaUrl?: string;
  @Input() likes: number = 0;
  @Input() comments: number = 0;
  @Input() tags: string[] = [];
  @Input() isLikedInput: boolean = false;
  @Input() commentsListInput: any[] = [];

  @Output() imageClick = new EventEmitter<void>();
  @Output() likeToggle = new EventEmitter<boolean>();
  @Output() commentAdded = new EventEmitter<any>();

  // Reactivity state (Signals) for Zoneless compatibility
  isLiked = signal<boolean>(false);
  likesCount = signal<number>(0);
  showComments = signal<boolean>(false);
  
  showOptionsMenu = signal<boolean>(false);
  showShareMenu = signal<boolean>(false);
  isSaved = signal<boolean>(false);
  
  newCommentText = signal<string>('');
  commentsList = signal<any[]>([]);

  private mockCommentsPool = [
    { userName: 'Andrés López', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100&auto=format&fit=crop', text: '¡Excelente música! Un abrazo fuerte plebada 🤘🤠', time: '1 h' },
    { userName: 'Gabriela Ruiz', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop', text: 'Estuve ahí, fue una noche inolvidable. ¡Los mejores! 🔥❤️', time: '45 min' },
    { userName: 'Marcos R.', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop', text: 'Ya esperando con ansias el nuevo álbum. ¡Puro talento mexicano! 🎺🇲🇽', time: '10 min' }
  ];

  ngOnInit() {
    this.likesCount.set(this.likes);
    this.isLiked.set(this.isLikedInput);
    
    // Seed initial mock comments if parent comments list is empty
    if (this.commentsListInput && this.commentsListInput.length > 0) {
      this.commentsList.set(this.commentsListInput);
    } else {
      const seededComments = this.mockCommentsPool.slice(0, Math.min(this.comments, this.mockCommentsPool.length));
      this.commentsList.set(seededComments);
    }
  }

  ngOnChanges(changes: import('@angular/core').SimpleChanges) {
    if (changes['likes'] && !changes['likes'].firstChange) {
      this.likesCount.set(this.likes);
    }
    if (changes['isLikedInput'] && !changes['isLikedInput'].firstChange) {
      this.isLiked.set(this.isLikedInput);
    }
    if (changes['commentsListInput'] && !changes['commentsListInput'].firstChange) {
      this.commentsList.set(this.commentsListInput);
    }
  }

  toggleLike() {
    this.isLiked.update(liked => !liked);
    this.likesCount.update(count => this.isLiked() ? count + 1 : count - 1);
    this.likeToggle.emit(this.isLiked());
  }

  toggleComments() {
    this.showComments.update(show => !show);
  }

  submitComment(event: Event) {
    event.preventDefault();
    const text = this.newCommentText().trim();
    if (!text) return;

    const newComment = {
      userName: 'Tú',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop',
      text: text,
      time: 'Ahora mismo'
    };

    this.commentsList.update(list => [...list, newComment]);
    this.commentAdded.emit(newComment);
    this.newCommentText.set('');
  }

  openLightbox(event: Event) {
    event.stopPropagation();
    this.imageClick.emit();
  }

  toggleOptionsMenu(event: Event) {
    event.stopPropagation();
    this.showShareMenu.set(false);
    this.showOptionsMenu.update(show => !show);
  }

  toggleShareMenu(event: Event) {
    event.stopPropagation();
    this.showOptionsMenu.set(false);
    this.showShareMenu.update(show => !show);
  }

  actionSave(event: Event) {
    event.stopPropagation();
    this.isSaved.update(saved => !saved);
    const msg = this.isSaved() ? 'Publicación guardada con éxito.' : 'Publicación eliminada de guardados.';
    alert(msg);
    this.showOptionsMenu.set(false);
  }

  actionReport(event: Event) {
    event.stopPropagation();
    alert('Publicación reportada con éxito. Moderación la revisará en breve.');
    this.showOptionsMenu.set(false);
  }

  shareWhatsApp(event: Event) {
    event.stopPropagation();
    const shareText = encodeURIComponent(`¡Mira esta publicación de ${this.authorName} en Acordex! - "${this.content.substring(0, 60)}..."`);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
    window.open(whatsappUrl, '_blank');
    this.showShareMenu.set(false);
  }

  shareInstagram(event: Event) {
    event.stopPropagation();
    alert('Copiando descripción al portapapeles. Redirigiendo a Instagram...');
    navigator.clipboard.writeText(this.content).catch(() => {});
    window.open('https://instagram.com', '_blank');
    this.showShareMenu.set(false);
  }

  copyPostLink(event: Event) {
    event.stopPropagation();
    const mockUrl = `${window.location.origin}/posts/${this.authorName.toLowerCase().replace(/ /g, '-')}`;
    navigator.clipboard.writeText(mockUrl).then(() => {
      alert('¡Enlace de la publicación copiado al portapapeles!');
    }).catch(() => {
      alert('Error al copiar enlace.');
    });
    this.showShareMenu.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showOptionsMenu.set(false);
    this.showShareMenu.set(false);
  }
}
