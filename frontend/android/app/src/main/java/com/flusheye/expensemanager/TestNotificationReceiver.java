package com.flusheye.expensemanager;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class TestNotificationReceiver extends BroadcastReceiver {

    private static final String CHANNEL_ID =
            "expense_test_channel";

    @Override
    public void onReceive(
            Context context,
            Intent intent
    ) {

        NotificationManager manager =
                (NotificationManager)
                        context.getSystemService(
                                Context.NOTIFICATION_SERVICE
                        );

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {

            NotificationChannel channel =
                    new NotificationChannel(
                            CHANNEL_ID,
                            "Expense Test",
                            NotificationManager.IMPORTANCE_HIGH
                    );

            manager.createNotificationChannel(channel);
        }

        NotificationCompat.Builder builder =
                new NotificationCompat.Builder(
                        context,
                        CHANNEL_ID
                )
                        .setSmallIcon(
                                android.R.drawable.ic_dialog_info
                        )
                        .setContentTitle(
                                "BOI"
                        )
                        .setContentText(
                                "Rs.40.00 debited A/c and credited to ANIL KESARWANI via UPI Ref No  on 01Oct26."
                        )
                        .setStyle(
                                new NotificationCompat.BigTextStyle()
                                        .bigText(
                                                "Rs.40.00 debited A/c and credited to ANIL KESARWANI via UPI Ref No  on 01Oct26."
                                        )
                        )
                        .setPriority(
                                NotificationCompat.PRIORITY_HIGH
                        );

        manager.notify(
                98765,
                builder.build()
        );
    }
}