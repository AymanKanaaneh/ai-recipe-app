import { Injectable } from '@angular/core';

declare var webkitSpeechRecognition: any;

@Injectable({
  providedIn: 'root',
})
export class VoiceRecognitionService {
  private recognition = new webkitSpeechRecognition();
  private isStoppedSpeechRecog = true;
  private isStarting = false;
  tempWords: string = '';
  text: string = '';
  private retryTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    this.recognition.interimResults = true;
    this.recognition.continuous = true;
    this.recognition.lang = 'en-US';
  }

  public init() {
    this.recognition.addEventListener('result', (event: any) => {
      if (event.results[0].isFinal) {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        this.tempWords = transcript;
      }
    });
  }

  public start() {
    if (!this.isStoppedSpeechRecog || this.isStarting) return;
    
    this.isStarting = true;
    this.isStoppedSpeechRecog = false;

    const startAttempt = () => {
      try {
        this.recognition.start();
        console.log('Continuous speech recognition started');
        this.isStarting = false;
      } catch (err) {
        console.warn('Speech recognition start error:', err);
        this.retryTimeout = setTimeout(startAttempt, 300);
      }
    };
    
    this.clearRetry();
    startAttempt();

    this.recognition.onerror = (event: any) => {
      console.error('Recognition error:', event.error);
      this.stop();
    };
  }

  public stop() {
    if (this.isStoppedSpeechRecog) return;
    
    this.isStoppedSpeechRecog = true;
    this.clearRetry();
    
    try {
      this.recognition.stop();
      console.log('Speech recognition stopped');
    } catch (e) {
      console.warn('Stop error (harmless):', e);
    }
    
    this.wordConcat();
  }

  private clearRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = undefined;
    }
  }

  public wordConcat() {
    if (this.tempWords.trim().length > 0) {
      this.text += this.tempWords + '. ';
      this.tempWords = '';
    }
  }
}