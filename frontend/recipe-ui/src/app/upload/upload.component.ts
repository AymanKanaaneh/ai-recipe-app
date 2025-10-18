import { Component, OnDestroy, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RecipeResult } from '../shared/models/recipe.model';
import { VoiceRecognitionService } from '../service/voice-recognition.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnDestroy {
  selectedFile: File | null = null;
  recipe: RecipeResult | null = null;
  errorMessage = '';
  loading = false;
  isDragging = false;
  imagePreviewUrl: string | null = null;
  shake = false;
  userVoiceMessage = '';
  messages: { content: string, isUser: boolean }[] = [];
  isRecording = false;
  private voicesLoaded = false;

  constructor(
    private http: HttpClient, 
    public voiceRecognitionService: VoiceRecognitionService
  ) {}

  ngAfterViewInit() {
    // Initialize speech synthesis with proper voice loading
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.voicesLoaded = true;
        };
      } else {
        this.voicesLoaded = true;
      }

      // Warm-up utterance to prevent Chrome TTS delay
      const warmUp = new SpeechSynthesisUtterance(' ');
      window.speechSynthesis.speak(warmUp);
    }

    // Initialize voice recognition service
    this.voiceRecognitionService.init();
  }

  ngOnDestroy() {
    // Clean up speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // File selection methods
  onFileSelected(event: Event) {
    this.handleFiles((event.target as HTMLInputElement)?.files);
  }

  // Drag and drop methods
  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    this.handleFiles(event.dataTransfer?.files || null);
  }

  // Clear file selection
  clearSelection() {
    this.selectedFile = null;
    this.imagePreviewUrl = null;
    this.errorMessage = '';
  }

  // Form submission methods
  onSubmit(event: Event) {
    event.preventDefault();
    this.tryGenerate();
  }

  onTryButton(event: Event) {
    event.preventDefault();
    this.tryGenerate();
  }

  // Recipe generation method
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

    this.http.post('http://localhost:8000/api/recipes/generate/', formData).subscribe({
      next: (data) => {
        this.recipe = data as RecipeResult;
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

  // UI feedback method
  private triggerShake() {
    this.shake = true;
    setTimeout(() => (this.shake = false), 400);
  }

  // File handling method
  private handleFiles(fileList: FileList | null) {
    this.errorMessage = '';
    this.recipe = null;
    this.selectedFile = null;
    this.imagePreviewUrl = null;

    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Validate file type
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Please select a JPG, PNG, or GIF image.';
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      this.errorMessage = 'Image is too large. Max size is 5MB.';
      return;
    }

    this.selectedFile = file;

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreviewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  // Voice recording toggle method
  toggleRecording() {
    this.isRecording = !this.isRecording;
    if (this.isRecording) {
      this.startRecording();
    } else {
      this.stopRecording();
    }
  }

  // Start voice recording
  private startRecording() {
    // Cancel any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      this.voiceRecognitionService.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      this.isRecording = false;
      this.errorMessage = 'Failed to start voice recognition. Please try again.';
    }
  }

  // Stop voice recording
  private stopRecording() {
    this.voiceRecognitionService.stop();
    
    if (this.voiceRecognitionService.text.trim()) {
      this.userVoiceMessage += ' ' + this.voiceRecognitionService.text.trim();
      this.submitMessage();
    }
    
    // Clear recognized text after processing
    this.voiceRecognitionService.text = '';
  }

  // Text-to-speech method with proper voice loading
  private  speak(text: string) {
    if (!text || !('speechSynthesis' in window)) return;
  
    window.speechSynthesis.cancel(); // clear queue
  
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Aria") ||
      v.name.includes("Microsoft Guy")) || null;
      utterance.rate = 1;
      utterance.pitch = 1;
  
      window.speechSynthesis.speak(utterance);
    }, 200);
  }

  // Submit message to backend API
  submitMessage() {
    if (!this.userVoiceMessage.trim()) return;
    
    if (!this.recipe) {
      console.error('No recipe data available');
      this.errorMessage = 'Please generate a recipe first before asking questions.';
      return;
    }

    // Add user message to chat history
    this.messages.push({ 
      content: this.userVoiceMessage, 
      isUser: true 
    });

    const payload = {
      query: this.userVoiceMessage,
      recipe_data: this.recipe
    };

    // Save current message and reset input
    const currentMessage = this.userVoiceMessage;
    this.userVoiceMessage = '';
    this.loading = true;

    this.http.post('http://localhost:8000/api/recipes/query/', payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.answer) {
          // Add AI response to chat history
          this.messages.push({ 
            content: response.answer, 
            isUser: false 
          });
          
          // Speak the response
          this.speak(response.answer);
        }
      },
      error: (err) => {
        console.error('Failed to submit query:', err);
        this.errorMessage = 'Failed to send question. Please try again.';
        this.loading = false;
        
        // Restore message if error occurred
        this.userVoiceMessage = currentMessage;
        this.triggerShake();
      }
    });
  }

  // Method to manually trigger speech for testing
  testSpeak() {
    this.speak('Hello, this is a test of the speech synthesis feature.');
  }

  // Clear chat messages
  clearMessages() {
    this.messages = [];
    this.userVoiceMessage = '';
  }

  // Get recording button text
  getRecordingButtonText(): string {
    return this.isRecording ? 'Stop Recording' : 'Start Recording';
  }

  // Check if microphone permission is available
  checkMicrophonePermission(): Promise<boolean> {
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => true)
      .catch(() => false);
  }
}
