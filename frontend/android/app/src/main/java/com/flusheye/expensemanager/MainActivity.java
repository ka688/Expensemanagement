package com.flusheye.expensemanager;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final String TAG = "ExpenseMainActivity";

    @Override
    public void onCreate(Bundle savedInstanceState) {

        registerPlugin(ExpenseNotificationPlugin.class);

        Log.d(TAG, "EXPENSE NOTIFICATION PLUGIN REGISTERED");

        super.onCreate(savedInstanceState);

        Log.d(TAG, "MAIN ACTIVITY CREATED");
    }
}