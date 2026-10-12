package com.flusheye.expensemanager;

import android.app.Notification;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExpenseNotificationListener
        extends NotificationListenerService {

    private static final String TAG =
            "ExpenseNotification";

    // Examples:
    // Rs.40.00
    // Rs 450
    // INR 1,250.50
    // ₹567


   private static final Pattern AMOUNT_PATTERN =
        Pattern.compile(
                "(?:₹\\s*|rs\\.?\\s*|inr\\s*)([0-9]+(?:,[0-9]{3})*(?:\\.[0-9]{1,2})?)",
                Pattern.CASE_INSENSITIVE
        );

    // BOI style:
    // credited to ANIL KESARWANI via UPI
    private static final Pattern UPI_PAYEE_PATTERN =
            Pattern.compile(
                    "credited\\s+to\\s+(.+?)\\s+via\\s+upi",
                    Pattern.CASE_INSENSITIVE
            );

    // Examples:
    // on 01Oct26
    // on 01 Oct 26
    // on 01/10/26
    private static final Pattern DATE_PATTERN =
            Pattern.compile(
                    "\\bon\\s+(\\d{1,2}\\s*[A-Za-z]{3}\\s*\\d{2}|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})",
                    Pattern.CASE_INSENSITIVE
            );

    @Override
    public void onListenerConnected() {

        super.onListenerConnected();

        Log.d(
                TAG,
                "LISTENER CONNECTED"
        );
    }

    @Override
    public void onNotificationPosted(
            StatusBarNotification sbn
    ) {

        try {

            if (sbn == null ||
                    sbn.getNotification() == null) {

                return;
            }

            String packageName =
                    sbn.getPackageName();

            Notification notification =
                    sbn.getNotification();
            Log.d(TAG, "ALL NOTIFICATION EXTRAS: " +
                   notification.extras.toString());

            CharSequence titleValue =
                    notification.extras.getCharSequence(
                            "android.title"
                    );

            CharSequence textValue =
                    notification.extras.getCharSequence(
                            "android.text"
                    );

            CharSequence bigTextValue =
                    notification.extras.getCharSequence(
                            "android.bigText"
                    );
                Log.d(TAG, "TITLE EXTRA: " + titleValue);
                Log.d(TAG, "TEXT EXTRA: " + textValue);
                Log.d(TAG, "BIG TEXT EXTRA: " + bigTextValue);
            String title =
                    titleValue != null
                            ? titleValue.toString()
                            : "";

            String text =
                    textValue != null
                            ? textValue.toString()
                            : "";

            String bigText =
                    bigTextValue != null
                            ? bigTextValue.toString()
                            : "";

            String notificationText =
                    !bigText.isEmpty()
                            ? bigText
                            : text;

            String combinedText =
                    (
                            title +
                            " " +
                            text +
                            " " +
                            bigText
                    ).trim();

            String lowerText =
                    combinedText.toLowerCase();

            Log.d(
                    TAG,
                    "NOTIFICATION RECEIVED: " +
                    packageName +
                    " | " +
                    title +
                    " | " +
                    notificationText
            );

            /*
             * --------------------------------
             * PAYMENT DETECTION
             * --------------------------------
             */

            

        boolean isMoneyReceived =
                lowerText.contains("money received") ||
                lowerText.contains("received ₹") ||
                lowerText.contains("received rs") ||
                lowerText.contains("credited to your bank account") ||
                lowerText.contains("amount credited") ||
                lowerText.contains("has sent ₹");

        boolean isMoneySent =
                lowerText.contains("debited") ||
                lowerText.contains("debit") ||
                lowerText.contains("sent to") ||
                lowerText.contains("paid to") ||
                lowerText.contains("payment successful") ||
                lowerText.contains("transaction successful") ||
                lowerText.contains("transferred to") ||
                lowerText.contains("upi txn");

        boolean hasPaymentKeyword =
                isMoneyReceived || isMoneySent;

        if (!hasPaymentKeyword) {
        return;
        }

            /*
             * --------------------------------
             * AMOUNT
             * --------------------------------
             */

            Matcher amountMatcher =
                    AMOUNT_PATTERN.matcher(
                            combinedText
                    );

            if (!amountMatcher.find()) {

                Log.d(
                        TAG,
                        "PAYMENT FOUND BUT NO AMOUNT"
                );

                return;
            }

            String amountText =
                 amountMatcher.group(1).replace(",", "");

                Log.d(TAG, "DETECTED PAYMENT AMOUNT: " + amountText);

            /*
             * --------------------------------
             * UPI PAYEE
             * --------------------------------
             */

            String payee = "";

            Matcher payeeMatcher =
                    UPI_PAYEE_PATTERN.matcher(
                            combinedText
                    );

            if (payeeMatcher.find()) {

                payee =
                        payeeMatcher.group(1).trim();

                Log.d(
                        TAG,
                        "DETECTED PAYEE: " +
                        payee
                );
            }

            /*
             * --------------------------------
             * DATE
             * --------------------------------
             */

            String transactionDate = "";

            Matcher dateMatcher =
                    DATE_PATTERN.matcher(
                            combinedText
                    );

            if (dateMatcher.find()) {

                transactionDate =
                        dateMatcher.group(1).trim();

                Log.d(
                        TAG,
                        "DETECTED DATE: " +
                        transactionDate
                );
            }

            /*
             * --------------------------------
             * SEND TO REACT
             * --------------------------------
             */

            String transactionType =
                isMoneyReceived ? "income" : "expense";

                ExpenseNotificationPlugin.sendNotification(
                        packageName,
                        title,
                        notificationText,
                        amountText,
                        transactionType,
                        sbn.getKey(),
                        sbn.getPostTime()
                );

        } catch (Exception e) {

            Log.e(
                    TAG,
                    "ERROR: " +
                    e.getMessage(),
                    e
            );
        }
    }

    @Override
    public void onNotificationRemoved(
            StatusBarNotification sbn
    ) {
        // Nothing needed here.
    }
}