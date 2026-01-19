package com.pss.fullstack.service;

import com.pss.fullstack.dto.AlbumNotification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String ALBUM_TOPIC = "/topic/albums";

    /**
     * Notify all connected clients about a new album
     */
    public void notifyNewAlbum(Long albumId, String title, String artistName) {
        AlbumNotification notification = AlbumNotification.newAlbum(albumId, title, artistName);

        log.info("Sending new album notification: {}", notification.getMessage());
        messagingTemplate.convertAndSend(ALBUM_TOPIC, notification);
    }

}
