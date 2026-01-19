import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface AlbumNotification {
  albumId: number;
  albumTitle: string;
  artistName: string;
  message: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;

  private albumNotificationsSubject = new BehaviorSubject<AlbumNotification | null>(null);
  albumNotifications$ = this.albumNotificationsSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.connected) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('Cannot connect to WebSocket: No auth token');
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        if (!environment.production) {
          console.log('STOMP:', str);
        }
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.connectionStatusSubject.next(true);
      this.subscribeToNotifications();
    };

    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.connectionStatusSubject.next(false);
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers['message']);
      console.error('Details:', frame.body);
    };

    this.client.activate();
  }

  disconnect(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.connectionStatusSubject.next(false);
  }

  private subscribeToNotifications(): void {
    if (!this.client?.connected) {
      return;
    }

    this.subscription = this.client.subscribe('/topic/albums', (message: IMessage) => {
      try {
        const notification: AlbumNotification = JSON.parse(message.body);
        this.albumNotificationsSubject.next(notification);
      } catch (error) {
        console.error('Error parsing notification:', error);
      }
    });
  }
}
