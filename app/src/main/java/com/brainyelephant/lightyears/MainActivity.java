package com.brainyelephant.lightyears;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;
import android.graphics.Color;
import android.view.WindowInsets;
import android.view.View;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

public class MainActivity extends Activity {
    private WebView web;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(243,246,252));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setTextZoom(100);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
        });
        setContentView(web);
        if (android.os.Build.VERSION.SDK_INT >= 20) {
            web.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                    return insets;
                }
            });
            web.requestApplyInsets();
        }
        try {
            InputStream input = getAssets().open("index.html");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; int count;
            while ((count=input.read(buffer)) != -1) output.write(buffer,0,count);
            input.close();
            web.loadDataWithBaseURL("https://appassets.androidplatform.net/",output.toString("UTF-8"),"text/html","UTF-8",null);
        } catch (Exception error) {
            android.widget.TextView message = new android.widget.TextView(this);
            message.setText("Light Years Learning could not open its bundled questions. Please reinstall the app.");
            setContentView(message);
        }
    }
    @Override protected void onDestroy() { if(web!=null) web.destroy(); super.onDestroy(); }
}
