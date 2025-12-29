package com.goldapp.amrutkumargovinddasllp;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.RingtoneManager;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "MyFirebaseMsgService";
    private static final String CHANNEL_ID = "default";
    private static final String LOGIN_APPROVED_CHANNEL = "login_approved";
    private static final String LOGIN_REJECTED_CHANNEL = "login_rejected";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
    }

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Log.d(TAG, "From: " + remoteMessage.getFrom());

        // Check if message contains a data payload
        if (remoteMessage.getData().size() > 0) {
            Log.d(TAG, "Message data payload: " + remoteMessage.getData());
        }

        // Check if message contains a notification payload
        if (remoteMessage.getNotification() != null) {
            Log.d(TAG, "Message Notification Body: " + remoteMessage.getNotification().getBody());
            
            // Show notification even when app is in background
            sendNotification(remoteMessage);
        } else if (remoteMessage.getData().size() > 0) {
            // Handle data-only messages (when app is in background)
            Log.d(TAG, "Data-only message received, showing notification");
            sendNotification(remoteMessage);
        }
    }

    @Override
    public void onNewToken(String token) {
        Log.d(TAG, "Refreshed token: " + token);
        
        // Send token to your server
        sendRegistrationToServer(token);
    }

    private void sendRegistrationToServer(String token) {
        // TODO: Implement this method to send token to your app server
        Log.d(TAG, "Token to be sent to server: " + token);
    }

    private void sendNotification(RemoteMessage remoteMessage) {
        try {
            // Get notification data
            String title = "New Notification";
            String body = "You have a new notification";
            String notificationType = "default";
            
            // Extract from notification payload
            if (remoteMessage.getNotification() != null) {
                title = remoteMessage.getNotification().getTitle() != null ? 
                       remoteMessage.getNotification().getTitle() : title;
                body = remoteMessage.getNotification().getBody() != null ? 
                      remoteMessage.getNotification().getBody() : body;
            }
            
            // Extract from data payload
            if (remoteMessage.getData().size() > 0) {
                if (remoteMessage.getData().containsKey("title")) {
                    title = remoteMessage.getData().get("title");
                }
                if (remoteMessage.getData().containsKey("body")) {
                    body = remoteMessage.getData().get("body");
                }
                if (remoteMessage.getData().containsKey("notificationType")) {
                    notificationType = remoteMessage.getData().get("notificationType");
                }
            }
            
            // Determine channel ID based on notification type
            String channelId = CHANNEL_ID;
            if ("login_approved".equals(notificationType)) {
                channelId = LOGIN_APPROVED_CHANNEL;
            } else if ("login_rejected".equals(notificationType)) {
                channelId = LOGIN_REJECTED_CHANNEL;
            }
            
            // Create intent to open app
            Intent intent = new Intent(this, com.goldapp.amrutkumargovinddasllp.MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            intent.putExtra("notificationType", notificationType);
            intent.putExtra("data", remoteMessage.getData().toString());
            
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent,
                    PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE);
            
            // Build notification
            NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, channelId)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setAutoCancel(true)
                    .setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION))
                    .setVibrate(new long[]{1000, 1000, 1000, 1000, 1000})
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setContentIntent(pendingIntent);
            
            // Show notification
            NotificationManagerCompat notificationManager = NotificationManagerCompat.from(this);
            if (notificationManager.areNotificationsEnabled()) {
                notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
                Log.d(TAG, "Notification sent successfully: " + title);
            } else {
                Log.w(TAG, "Notifications are disabled for this app");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error sending notification", e);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            
            // Default channel
            NotificationChannel defaultChannel = new NotificationChannel(
                    CHANNEL_ID,
                    "Default Channel",
                    NotificationManager.IMPORTANCE_HIGH
            );
            defaultChannel.setDescription("Default notification channel");
            defaultChannel.enableVibration(true);
            defaultChannel.enableLights(true);
            
            // Login approved channel
            NotificationChannel loginApprovedChannel = new NotificationChannel(
                    LOGIN_APPROVED_CHANNEL,
                    "✅ Login Approved",
                    NotificationManager.IMPORTANCE_HIGH
            );
            loginApprovedChannel.setDescription("Notifications for approved login requests");
            loginApprovedChannel.enableVibration(true);
            loginApprovedChannel.enableLights(true);
            
            // Login rejected channel
            NotificationChannel loginRejectedChannel = new NotificationChannel(
                    LOGIN_REJECTED_CHANNEL,
                    "❌ Login Rejected",
                    NotificationManager.IMPORTANCE_HIGH
            );
            loginRejectedChannel.setDescription("Notifications for rejected login requests");
            loginRejectedChannel.enableVibration(true);
            loginRejectedChannel.enableLights(true);
            
            // Create channels
            notificationManager.createNotificationChannel(defaultChannel);
            notificationManager.createNotificationChannel(loginApprovedChannel);
            notificationManager.createNotificationChannel(loginRejectedChannel);
            
            Log.d(TAG, "Notification channels created successfully");
        }
    }
}
