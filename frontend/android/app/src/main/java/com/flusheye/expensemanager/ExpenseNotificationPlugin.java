
package com.flusheye.expensemanager;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ExpenseNotification")
public class ExpenseNotificationPlugin extends Plugin {

    private static final String TAG = "ExpenseNotificationPlugin";
    private static final String CHANNEL_ID = "expense_test_channel";

    private static ExpenseNotificationPlugin instance;

    private static String pendingPackageName;
    private static String pendingTitle;
    private static String pendingText;
    private static String pendingAmount;
    private static String pendingTransactionType;
    private static String pendingNotificationKey;
    private static long pendingPostTime;

    @Override
    public void load() {
        super.load();
        instance = this;
        Log.d(TAG, "PLUGIN LOADED");
        sendPendingNotification();
    }

    public static void sendNotification(
            String packageName,
            String title,
            String text,
            String amount,
            String transactionType,
            String notificationKey,
            long postTime
    ) {
        if (instance == null) {
            Log.d(TAG, "PLUGIN INSTANCE IS NULL - SAVING NOTIFICATION");

            pendingPackageName = packageName;
            pendingTitle = title;
            pendingText = text;
            pendingAmount = amount;
            pendingTransactionType = transactionType;
            pendingNotificationKey = notificationKey;
            pendingPostTime = postTime;
            return;
        }

        sendToReact(
                packageName,
                title,
                text,
                amount,
                transactionType,
                notificationKey,
                postTime
        );
    }

    private static void sendPendingNotification() {
        if (pendingPackageName == null) {
            return;
        }

        sendToReact(
                pendingPackageName,
                pendingTitle,
                pendingText,
                pendingAmount,
                pendingTransactionType,
                pendingNotificationKey,
                pendingPostTime
        );

        pendingPackageName = null;
        pendingTitle = null;
        pendingText = null;
        pendingAmount = null;
        pendingTransactionType = null;
        pendingNotificationKey = null;
        pendingPostTime = 0;
    }

    private static void sendToReact(
            String packageName,
            String title,
            String text,
            String amount,
            String transactionType,
            String notificationKey,
            long postTime
    ) {
        if (instance == null) {
            return;
        }

        Log.d(TAG, "SENDING EVENT TO REACT");
        Log.d(TAG, "EVENT AMOUNT: " + amount);
        Log.d(TAG, "EVENT TYPE: " + transactionType);

        JSObject data = new JSObject();
        data.put("packageName", packageName);
        data.put("title", title);
        data.put("text", text);
        data.put("amount", amount);
        data.put("transactionType", transactionType);
        data.put("notificationKey", notificationKey);
        data.put("postTime", postTime);

        instance.notifyListeners("expenseNotification", data);
    }

    @PluginMethod
    public void postTestNotification(PluginCall call) {
        try {
            Context context = getContext();

            NotificationManager manager =
                    (NotificationManager) context.getSystemService(
                            Context.NOTIFICATION_SERVICE
                    );

            if (manager == null) {
                call.reject("Notification service unavailable");
                return;
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel =
                        new NotificationChannel(
                                CHANNEL_ID,
                                "Expense Manager Test",
                                NotificationManager.IMPORTANCE_DEFAULT
                        );

                manager.createNotificationChannel(channel);
            }

            Notification.Builder builder;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(context, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(context);
            }

            builder
                    .setSmallIcon(context.getApplicationInfo().icon)
                    .setContentTitle("Payment debited Rs. 250")
                    .setContentText("Swiggy purchase")
                    .setStyle(
                            new Notification.BigTextStyle()
                                    .bigText(
                                            "Payment debited Rs. 250 to Swiggy"
                                    )
                    )
                    .setAutoCancel(true);

            manager.notify(250, builder.build());

            Log.d(TAG, "TEST PAYMENT NOTIFICATION POSTED");
            call.resolve();

        } catch (Exception e) {
            Log.e(TAG, "TEST NOTIFICATION FAILED", e);
            call.reject("Could not post test notification", e);
        }
    }
}
