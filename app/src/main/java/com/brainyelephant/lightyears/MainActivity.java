package com.brainyelephant.lightyears;

import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.graphics.Color;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceResponse;
import android.view.View;
import android.view.WindowInsets;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdSize;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.MobileAds;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.QueryPurchasesParams;
import com.android.billingclient.api.Purchase;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final String PRODUCT_ID = "remove_ads";
    // Test-only AdMob banner. Replace with a publisher-owned ad unit before release.
    private static final String TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
    private WebView web;
    private LinearLayout layout;
    private AdView banner;
    private BillingClient billing;
    private ProductDetails product;
    private ProductDetails.OneTimePurchaseOfferDetails offer;
    private ConsentInformation consent;
    private boolean purchased = false;
    private boolean billingReady = false;
    private boolean adsStarted = false;
    private String price = "";

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        purchased = getPreferences(Context.MODE_PRIVATE).getBoolean("ad_free_owned", false);
        layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(243,246,252));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setTextZoom(100);
        web.addJavascriptInterface(new StoreBridge(), "LYLStore");
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) { return true; }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
        });
        layout.addView(web, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);
        if (android.os.Build.VERSION.SDK_INT >= 20) {
            layout.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
                @Override public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                    layout.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                    return insets;
                }
            });
            layout.requestApplyInsets();
        }
        try {
            InputStream input = getAssets().open("index.html");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
            input.close();
            web.loadDataWithBaseURL("https://appassets.androidplatform.net/", output.toString("UTF-8"), "text/html", "UTF-8", null);
        } catch (Exception error) {
            TextView message = new TextView(this);
            message.setText("Light Years Learning could not open its bundled questions. Please reinstall the app.");
            setContentView(message);
            return;
        }
        startBilling();
    }

    private final class StoreBridge {
        @JavascriptInterface public void purchase() { runOnUiThread(() -> purchaseNoAds()); }
        @JavascriptInterface public void restore() { runOnUiThread(() -> {
            if (billingReady) queryOwnership(); else sendStatus("Google Play is not connected. Try again when online.");
        }); }
        @JavascriptInterface public void privacy() { runOnUiThread(() -> {
            if (consent != null && consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED) {
                UserMessagingPlatform.showPrivacyOptionsForm(MainActivity.this, error -> {
                    if (!purchased && consent.canRequestAds()) showBanner();
                });
            } else sendStatus("Advertising privacy controls are not required for this device at present.");
        }); }
    }

    private void js(String script) {
        if (web != null) web.post(() -> web.evaluateJavascript(script, null));
    }
    private void sendStatus(String message) {
        js("window.LYLMonetization && window.LYLMonetization.status(" + JSONObject.quote(message) + ")");
    }
    private void notifyState() {
        js("window.LYLMonetization && window.LYLMonetization.update(" + purchased + "," + billingReady + "," + JSONObject.quote(price) + ")");
    }
    private void saveOwnership(boolean owns) {
        purchased = owns;
        getPreferences(Context.MODE_PRIVATE).edit().putBoolean("ad_free_owned", owns).apply();
        if (owns) removeBanner();
        else if (consent != null && consent.canRequestAds()) showBanner();
        notifyState();
    }

    private void startBilling() {
        billing = BillingClient.newBuilder(this)
            .setListener((result, purchases) -> {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                    for (Purchase p : purchases) processPurchase(p);
                } else if (result.getResponseCode() != BillingClient.BillingResponseCode.USER_CANCELED) {
                    sendStatus("Purchase unavailable: " + result.getDebugMessage());
                }
            })
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection()
            .build();
        billing.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    sendStatus("Google Play purchases are unavailable in this test installation.");
                    startConsent(); return;
                }
                billingReady = true;
                notifyState();
                queryOwnership();
                queryProduct();
            }
            @Override public void onBillingServiceDisconnected() {
                billingReady = false;
                notifyState();
            }
        });
    }
    private void queryOwnership() {
        QueryPurchasesParams params = QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.INAPP).build();
        billing.queryPurchasesAsync(params, (result, purchases) -> {
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                boolean found = false;
                for (Purchase p : purchases) {
                    if (p.getProducts().contains(PRODUCT_ID)) {
                        if (p.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                            found = true;
                            processPurchase(p);
                        } else if (p.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                            sendStatus("Your purchase is pending. Ads will stop when payment completes.");
                        }
                    }
                }
                if (!found) saveOwnership(false); // Also handles refunded/revoked products on refresh.
            }
            startConsent(); // Do not request an ad before checking prior purchase entitlement.
        });
    }
    private void queryProduct() {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Arrays.asList(QueryProductDetailsParams.Product.newBuilder()
                .setProductId(PRODUCT_ID).setProductType(BillingClient.ProductType.INAPP).build()))
            .build();
        billing.queryProductDetailsAsync(params, (result, details) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK || details.getProductDetailsList() == null || details.getProductDetailsList().isEmpty()) {
                sendStatus("The ad-removal purchase is not available yet. It must first be created in Google Play Console.");
                return;
            }
            product = details.getProductDetailsList().get(0);
            List<ProductDetails.OneTimePurchaseOfferDetails> offers = product.getOneTimePurchaseOfferDetailsList();
            if (offers == null || offers.isEmpty()) {
                sendStatus("No active Google Play purchase offer is available.");
                return;
            }
            offer = offers.get(0);
            price = offer.getFormattedPrice();
            notifyState();
        });
    }
    private void purchaseNoAds() {
        if (purchased) { sendStatus("Ads are already removed."); return; }
        if (!billingReady || product == null || offer == null) {
            sendStatus("The ad-removal purchase is not available yet. It must be configured in Google Play Console.");
            return;
        }
        BillingFlowParams.ProductDetailsParams item = BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(product).setOfferToken(offer.getOfferToken()).build();
        BillingResult result = billing.launchBillingFlow(this,
            BillingFlowParams.newBuilder().setProductDetailsParamsList(Arrays.asList(item)).build());
        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK)
            sendStatus("Google Play could not open the purchase: " + result.getDebugMessage());
    }
    private void processPurchase(Purchase purchase) {
        if (!purchase.getProducts().contains(PRODUCT_ID)) return;
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
            sendStatus("Payment is pending. Ads will be removed after payment completes."); return;
        }
        if (purchase.getPurchaseState() != Purchase.PurchaseState.PURCHASED) return;
        // Client-only entitlement. Production release should validate purchase tokens on a trusted backend.
        saveOwnership(true);
        if (!purchase.isAcknowledged()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken()).build();
            billing.acknowledgePurchase(params, result -> {
                if (result.getResponseCode() != BillingClient.BillingResponseCode.OK)
                    sendStatus("Purchase saved. Google Play acknowledgement needs retry when connected.");
            });
        }
    }

    private void startConsent() {
        if (purchased) return;
        if (consent != null) return; // One consent refresh per launch.
        consent = UserMessagingPlatform.getConsentInformation(this);
        consent.requestConsentInfoUpdate(this, new ConsentRequestParameters.Builder().build(),
            () -> {
                UserMessagingPlatform.loadAndShowConsentFormIfRequired(this, error -> {
                    if (consent.canRequestAds()) showBanner();
                    notifyState();
                });
                if (consent.canRequestAds()) showBanner();
            }, error -> {
                if (consent.canRequestAds()) showBanner();
                notifyState();
            });
    }
    private void showBanner() {
        if (purchased || banner != null || !consent.canRequestAds()) return;
        if (!adsStarted) {
            adsStarted = true;
            new Thread(() -> MobileAds.initialize(getApplicationContext(), status -> {})).start();
        }
        banner = new AdView(this);
        banner.setAdUnitId(TEST_BANNER_ID);
        banner.setAdSize(AdSize.BANNER);
        layout.addView(banner, new LinearLayout.LayoutParams(-1, -2));
        banner.loadAd(new AdRequest.Builder().build());
    }
    private void removeBanner() {
        if (banner == null) return;
        layout.removeView(banner);
        banner.destroy();
        banner = null;
    }
    @Override protected void onResume() {
        super.onResume();
        if (banner != null) banner.resume();
        if (billingReady) queryOwnership();
    }
    @Override protected void onPause() {
        if (banner != null) banner.pause();
        super.onPause();
    }
    @Override protected void onDestroy() {
        removeBanner();
        if (billing != null) billing.endConnection();
        if (web != null) web.destroy();
        super.onDestroy();
    }
}
