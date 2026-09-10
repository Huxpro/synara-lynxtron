#include <node_api.h>

#import <AppKit/AppKit.h>
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

#include <cstring>
#include <string>

WKWebView* g_web_view = nil;
NSView* g_container = nil;
NSRect g_frame = NSZeroRect;
NSMutableDictionary<NSString*, WKWebView*>* g_web_views = nil;
NSString* g_active_tab_id = nil;
bool g_host_visible = false;
napi_threadsafe_function g_state_listener = nullptr;
napi_threadsafe_function g_copy_link_listener = nullptr;
napi_threadsafe_function g_open_window_listener = nullptr;
NSString* g_last_error = nil;
NSString* g_failed_url = nil;
static char kSynaraFaviconUrlKey;

void NotifyStateChange() {
  if (g_state_listener != nullptr) {
    napi_call_threadsafe_function(g_state_listener, nullptr, napi_tsfn_nonblocking);
  }
}

void NotifyCopyLink() {
  if (g_copy_link_listener != nullptr) {
    napi_call_threadsafe_function(g_copy_link_listener, nullptr, napi_tsfn_nonblocking);
  }
}

struct OpenWindowRequest {
  std::string url;
  std::string frame_name;
  bool has_features;
};

void NotifyOpenWindow(NSString* url, NSString* frame_name,
                      WKWindowFeatures* window_features) {
  if (g_open_window_listener == nullptr || url.length == 0) return;
  bool has_features = window_features.x != nil || window_features.y != nil ||
                      window_features.width != nil || window_features.height != nil ||
                      window_features.menuBarVisibility != nil ||
                      window_features.statusBarVisibility != nil ||
                      window_features.toolbarsVisibility != nil;
  auto* value = new OpenWindowRequest{
      url.UTF8String ?: "", frame_name.UTF8String ?: "", has_features};
  napi_status status = napi_call_threadsafe_function(
      g_open_window_listener, value, napi_tsfn_nonblocking);
  if (status != napi_ok) delete value;
}

@interface SynaraBrowserWebView : WKWebView
@end

@implementation SynaraBrowserWebView
- (void)keyDown:(NSEvent*)event {
  NSEventModifierFlags modifiers =
      event.modifierFlags & NSEventModifierFlagDeviceIndependentFlagsMask;
  if ([event.charactersIgnoringModifiers.lowercaseString isEqualToString:@"c"] &&
      (modifiers & NSEventModifierFlagCommand) != 0 &&
      (modifiers & NSEventModifierFlagShift) != 0 &&
      (modifiers & (NSEventModifierFlagControl | NSEventModifierFlagOption)) == 0) {
    NSString* url = self.URL.absoluteString;
    if (url.length > 0 && ![url isEqualToString:@"about:blank"]) {
      [[NSPasteboard generalPasteboard] clearContents];
      [[NSPasteboard generalPasteboard] setString:url forType:NSPasteboardTypeString];
      NotifyCopyLink();
      return;
    }
  }
  [super keyDown:event];
}
@end

NSString* BrowserErrorMessage(NSError* error) {
  switch (error.code) {
    case NSURLErrorCannotConnectToHost:
      return @"Connection refused.";
    case NSURLErrorCannotFindHost:
    case NSURLErrorDNSLookupFailed:
      return @"Couldn't resolve this address.";
    case NSURLErrorNotConnectedToInternet:
      return @"You're offline.";
    case NSURLErrorTimedOut:
      return @"This page took too long to respond.";
    case NSURLErrorSecureConnectionFailed:
    case NSURLErrorServerCertificateHasBadDate:
    case NSURLErrorServerCertificateUntrusted:
    case NSURLErrorServerCertificateHasUnknownRoot:
    case NSURLErrorServerCertificateNotYetValid:
      return @"A secure connection couldn't be established.";
    default:
      return @"Couldn't open this page.";
  }
}

void RecordBrowserError(NSError* error) {
  if (error.code == NSURLErrorCancelled) return;
  g_last_error = BrowserErrorMessage(error);
  NSURL* failing_url = error.userInfo[NSURLErrorFailingURLErrorKey];
  g_failed_url = failing_url.absoluteString ?: @"";
}

@interface SynaraBrowserNavigationDelegate : NSObject <WKNavigationDelegate, WKUIDelegate>
@end

@implementation SynaraBrowserNavigationDelegate
- (void)webView:(WKWebView*)webView
    decidePolicyForNavigationAction:(WKNavigationAction*)navigationAction
                    decisionHandler:(void (^)(WKNavigationActionPolicy))decisionHandler {
  NSURL* url = navigationAction.request.URL;
  NSString* scheme = url.scheme.lowercaseString;
  bool allowed = [scheme isEqualToString:@"http"] ||
                 [scheme isEqualToString:@"https"] ||
                 [scheme isEqualToString:@"about"];
  if (!allowed) {
    if (webView == g_web_view) {
      // Policy denial never committed. Preserve the live page URL/title just
      // like Electron's window-open/navigation deny path.
      g_failed_url = nil;
      g_last_error = @"This link uses a blocked external protocol.";
      NotifyStateChange();
    }
    decisionHandler(WKNavigationActionPolicyCancel);
    return;
  }
  decisionHandler(WKNavigationActionPolicyAllow);
}
- (WKWebView*)webView:(WKWebView*)webView
    createWebViewWithConfiguration:(WKWebViewConfiguration*)configuration
               forNavigationAction:(WKNavigationAction*)navigationAction
                    windowFeatures:(WKWindowFeatures*)windowFeatures {
  if (webView == g_web_view) {
    NSURL* url = navigationAction.request.URL;
    NSString* scheme = url.scheme.lowercaseString;
    if ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"] ||
        [scheme isEqualToString:@"about"]) {
    NotifyOpenWindow(url.absoluteString,
                     navigationAction.targetFrame == nil ? @"_blank" : @"_self",
                     windowFeatures);
    }
  }
  return nil;
}
- (void)observeValueForKeyPath:(NSString*)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id>*)change
                       context:(void*)context {
  if (object == g_web_view) NotifyStateChange();
}
- (void)webView:(WKWebView*)webView didStartProvisionalNavigation:(WKNavigation*)navigation {
  if (webView != g_web_view) return;
  g_last_error = nil;
  g_failed_url = nil;
  NotifyStateChange();
}
- (void)webView:(WKWebView*)webView didCommitNavigation:(WKNavigation*)navigation {
  if (webView == g_web_view) NotifyStateChange();
}
- (void)webView:(WKWebView*)webView didFinishNavigation:(WKNavigation*)navigation {
  NSString* script = @"(() => { const icon = document.querySelector('link[rel~=icon]'); try { return icon && icon.href ? new URL(icon.href, document.baseURI).href : new URL('/favicon.ico', location.href).href; } catch { return ''; } })()";
  [webView evaluateJavaScript:script
           completionHandler:^(id result, NSError* error) {
    NSString* favicon_url =
        error == nil && [result isKindOfClass:[NSString class]] ? result : @"";
    objc_setAssociatedObject(webView, &kSynaraFaviconUrlKey, favicon_url,
                             OBJC_ASSOCIATION_COPY_NONATOMIC);
    if (webView == g_web_view) NotifyStateChange();
  }];
  if (webView == g_web_view) NotifyStateChange();
}
- (void)webView:(WKWebView*)webView didFailNavigation:(WKNavigation*)navigation withError:(NSError*)error {
  if (webView != g_web_view) return;
  RecordBrowserError(error);
  NotifyStateChange();
}
- (void)webView:(WKWebView*)webView didFailProvisionalNavigation:(WKNavigation*)navigation withError:(NSError*)error {
  if (webView != g_web_view) return;
  RecordBrowserError(error);
  NotifyStateChange();
}
@end

SynaraBrowserNavigationDelegate* g_navigation_delegate = nil;

void RunOnMain(void (^block)(void)) {
  if ([NSThread isMainThread]) block();
  else dispatch_sync(dispatch_get_main_queue(), block);
}

void DestroyWebView() {
  RunOnMain(^{
    for (WKWebView* web_view in g_web_views.allValues) {
      [web_view stopLoading];
      for (NSString* keyPath in @[ @"URL", @"title", @"loading", @"canGoBack", @"canGoForward" ]) {
        [web_view removeObserver:g_navigation_delegate forKeyPath:keyPath];
      }
      web_view.navigationDelegate = nil;
      [web_view removeFromSuperview];
    }
    [g_web_views removeAllObjects];
    g_web_views = nil;
    g_web_view = nil;
    g_active_tab_id = nil;
    g_host_visible = false;
    g_navigation_delegate = nil;
    g_container = nil;
    g_frame = NSZeroRect;
    g_last_error = nil;
    g_failed_url = nil;
  });
}

WKWebView* CreateWebView(NSView* container, NSRect frame, NSURL* url) {
  WKWebViewConfiguration* configuration = [[WKWebViewConfiguration alloc] init];
  configuration.websiteDataStore = [WKWebsiteDataStore defaultDataStore];
  WKWebView* web_view =
      [[SynaraBrowserWebView alloc] initWithFrame:frame configuration:configuration];
  web_view.navigationDelegate = g_navigation_delegate;
  web_view.UIDelegate = g_navigation_delegate;
  for (NSString* keyPath in @[ @"URL", @"title", @"loading", @"canGoBack", @"canGoForward" ]) {
    [web_view addObserver:g_navigation_delegate
               forKeyPath:keyPath
                  options:NSKeyValueObservingOptionNew
                  context:nullptr];
  }
  web_view.autoresizingMask = NSViewMinXMargin | NSViewMaxYMargin;
  [container addSubview:web_view positioned:NSWindowAbove relativeTo:nil];
  [web_view loadRequest:[NSURLRequest requestWithURL:url]];
  return web_view;
}

void RemoveWebView(WKWebView* web_view) {
  if (web_view == nil) return;
  [web_view stopLoading];
  for (NSString* keyPath in @[ @"URL", @"title", @"loading", @"canGoBack", @"canGoForward" ]) {
    [web_view removeObserver:g_navigation_delegate forKeyPath:keyPath];
  }
  web_view.navigationDelegate = nil;
  web_view.UIDelegate = nil;
  [web_view removeFromSuperview];
}

NSRect ResolveFrame(NSView* container, double x, double y, double width,
                    double height) {
  return NSMakeRect(x, NSHeight(container.bounds) - y - height, width, height);
}

napi_value BooleanResult(napi_env env, bool value) {
  napi_value result;
  napi_get_boolean(env, value, &result);
  return result;
}

bool ReadDouble(napi_env env, napi_value value, double* result) {
  return napi_get_value_double(env, value, result) == napi_ok;
}

bool ReadUtf8(napi_env env, napi_value value, std::string* result) {
  size_t length = 0;
  if (napi_get_value_string_utf8(env, value, nullptr, 0, &length) != napi_ok)
    return false;
  result->resize(length + 1);
  const bool ok = napi_get_value_string_utf8(
                      env, value, result->data(), length + 1, &length) == napi_ok;
  result->resize(length);
  return ok;
}

napi_value Destroy(napi_env env, napi_callback_info) {
  DestroyWebView();
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value Attach(napi_env env, napi_callback_info info) {
  size_t argc = 7;
  napi_value args[7];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  bool is_buffer = false;
  if (argc != 7 || napi_is_buffer(env, args[0], &is_buffer) != napi_ok ||
      !is_buffer) {
    napi_throw_type_error(env, nullptr,
                          "attach requires handle, x, y, width, height, tab ID, and URL");
    return nullptr;
  }
  void* bytes = nullptr;
  size_t byte_length = 0;
  napi_get_buffer_info(env, args[0], &bytes, &byte_length);
  if (byte_length != sizeof(void*)) {
    napi_throw_range_error(env, nullptr, "unexpected native window handle size");
    return nullptr;
  }
  void* raw_view = nullptr;
  std::memcpy(&raw_view, bytes, sizeof(raw_view));
  NSView* container = (__bridge NSView*)raw_view;
  if (container == nil) {
    napi_throw_error(env, nullptr, "native window handle is null");
    return nullptr;
  }
  double x = 0, y = 0, width = 0, height = 0;
  std::string tab_id_string, url_string;
  if (!ReadDouble(env, args[1], &x) || !ReadDouble(env, args[2], &y) ||
      !ReadDouble(env, args[3], &width) || !ReadDouble(env, args[4], &height) ||
      !ReadUtf8(env, args[5], &tab_id_string) ||
      !ReadUtf8(env, args[6], &url_string) || tab_id_string.empty() ||
      width <= 0 || height <= 0) {
    napi_throw_type_error(env, nullptr, "invalid browser probe bounds or URL");
    return nullptr;
  }
  NSString* url_text = [NSString stringWithUTF8String:url_string.c_str()];
  NSString* tab_id = [NSString stringWithUTF8String:tab_id_string.c_str()];
  NSURL* url = [NSURL URLWithString:url_text];
  if (url == nil || !([url.scheme isEqualToString:@"http"] ||
                      [url.scheme isEqualToString:@"https"] ||
                      [url.scheme isEqualToString:@"about"])) {
    napi_throw_range_error(env, nullptr,
                           "browser probe URL must be HTTP(S) or about:");
    return nullptr;
  }

  __block bool attached = false;
  RunOnMain(^{
    DestroyWebView();
    NSRect frame = ResolveFrame(container, x, y, width, height);
    g_navigation_delegate = [[SynaraBrowserNavigationDelegate alloc] init];
    g_web_views = [[NSMutableDictionary alloc] init];
    g_web_view = CreateWebView(container, frame, url);
    g_web_views[tab_id] = g_web_view;
    g_active_tab_id = tab_id;
    g_host_visible = true;
    g_container = container;
    g_frame = frame;
    attached = true;
    NotifyStateChange();
  });
  return BooleanResult(env, attached);
}

napi_value SetBounds(napi_env env, napi_callback_info info) {
  size_t argc = 4;
  napi_value args[4];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  double x = 0, y = 0, width = 0, height = 0;
  if (argc != 4 || !ReadDouble(env, args[0], &x) ||
      !ReadDouble(env, args[1], &y) || !ReadDouble(env, args[2], &width) ||
      !ReadDouble(env, args[3], &height) || width <= 0 || height <= 0 ||
      g_web_view == nil || g_container == nil) {
    return BooleanResult(env, false);
  }
  __block bool updated = false;
  RunOnMain(^{
    if (g_web_views.count == 0 || g_container == nil) return;
    g_frame = ResolveFrame(g_container, x, y, width, height);
    for (WKWebView* web_view in g_web_views.allValues) web_view.frame = g_frame;
    updated = true;
  });
  return BooleanResult(env, updated);
}

napi_value SetVisible(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  bool visible = false;
  if (argc != 1 || napi_get_value_bool(env, arg, &visible) != napi_ok ||
      g_web_view == nil) {
    return BooleanResult(env, false);
  }
  __block bool updated = false;
  RunOnMain(^{
    if (g_web_view == nil) return;
    g_host_visible = visible;
    for (NSString* tab_id in g_web_views) {
      g_web_views[tab_id].hidden = !visible || ![tab_id isEqualToString:g_active_tab_id];
    }
    updated = true;
  });
  return BooleanResult(env, updated);
}

napi_value NewTab(napi_env env, napi_callback_info info) {
  size_t argc = 2;
  napi_value args[2];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  std::string tab_id_string, url_string;
  if (argc != 2 || !ReadUtf8(env, args[0], &tab_id_string) ||
      !ReadUtf8(env, args[1], &url_string) || tab_id_string.empty() ||
      g_container == nil) return BooleanResult(env, false);
  NSString* tab_id = [NSString stringWithUTF8String:tab_id_string.c_str()];
  NSURL* url = [NSURL URLWithString:[NSString stringWithUTF8String:url_string.c_str()]];
  if (url == nil) return BooleanResult(env, false);
  __block bool created = false;
  RunOnMain(^{
    if (g_container == nil || g_web_views[tab_id] != nil) return;
    if (g_web_view != nil) g_web_view.hidden = true;
    WKWebView* web_view = CreateWebView(g_container, g_frame, url);
    g_web_views[tab_id] = web_view;
    g_web_view = web_view;
    g_active_tab_id = tab_id;
    web_view.hidden = !g_host_visible;
    created = true;
    NotifyStateChange();
  });
  return BooleanResult(env, created);
}

napi_value SelectTab(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  std::string tab_id_string;
  if (argc != 1 || !ReadUtf8(env, arg, &tab_id_string))
    return BooleanResult(env, false);
  NSString* tab_id = [NSString stringWithUTF8String:tab_id_string.c_str()];
  __block bool selected = false;
  RunOnMain(^{
    WKWebView* next = g_web_views[tab_id];
    if (next == nil) return;
    if (g_web_view != nil) g_web_view.hidden = true;
    g_web_view = next;
    g_active_tab_id = tab_id;
    g_web_view.hidden = !g_host_visible;
    selected = true;
    NotifyStateChange();
  });
  return BooleanResult(env, selected);
}

napi_value CloseTab(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  std::string tab_id_string;
  if (argc != 1 || !ReadUtf8(env, arg, &tab_id_string))
    return BooleanResult(env, false);
  NSString* tab_id = [NSString stringWithUTF8String:tab_id_string.c_str()];
  __block bool closed = false;
  RunOnMain(^{
    WKWebView* web_view = g_web_views[tab_id];
    if (web_view == nil) return;
    RemoveWebView(web_view);
    [g_web_views removeObjectForKey:tab_id];
    if ([g_active_tab_id isEqualToString:tab_id]) {
      g_web_view = nil;
      g_active_tab_id = nil;
    }
    closed = true;
  });
  return BooleanResult(env, closed);
}

napi_value Navigate(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  std::string url_string;
  if (argc != 1 || !ReadUtf8(env, arg, &url_string) || g_web_view == nil)
    return BooleanResult(env, false);
  NSString* url_text = [NSString stringWithUTF8String:url_string.c_str()];
  NSURL* url = [NSURL URLWithString:url_text];
  if (url == nil || !([url.scheme isEqualToString:@"http"] ||
                      [url.scheme isEqualToString:@"https"] ||
                      [url.scheme isEqualToString:@"about"]))
    return BooleanResult(env, false);
  __block bool navigated = false;
  RunOnMain(^{
    if (g_web_view == nil) return;
    g_last_error = nil;
    g_failed_url = nil;
    [g_web_view loadRequest:[NSURLRequest requestWithURL:url]];
    navigated = true;
  });
  return BooleanResult(env, navigated);
}

napi_value GoBack(napi_env env, napi_callback_info) {
  __block bool navigated = false;
  RunOnMain(^{ if (g_web_view != nil && g_web_view.canGoBack) { [g_web_view goBack]; navigated = true; } });
  return BooleanResult(env, navigated);
}

napi_value GoForward(napi_env env, napi_callback_info) {
  __block bool navigated = false;
  RunOnMain(^{ if (g_web_view != nil && g_web_view.canGoForward) { [g_web_view goForward]; navigated = true; } });
  return BooleanResult(env, navigated);
}

napi_value Reload(napi_env env, napi_callback_info) {
  __block bool reloaded = false;
  RunOnMain(^{ if (g_web_view != nil) { [g_web_view reload]; reloaded = true; } });
  return BooleanResult(env, reloaded);
}

struct ScreenshotRequest {
  napi_deferred deferred;
  napi_threadsafe_function threadsafe_function;
};

void FinalizeScreenshotRequest(napi_env, void* data, void*) {
  delete static_cast<ScreenshotRequest*>(data);
}

void ResolveScreenshotRequest(napi_env env, napi_value, void* context,
                              void* data) {
  auto* request = static_cast<ScreenshotRequest*>(context);
  bool copied = *static_cast<bool*>(data);
  delete static_cast<bool*>(data);
  if (env == nullptr) return;
  napi_value result;
  napi_get_boolean(env, copied, &result);
  napi_resolve_deferred(env, request->deferred, result);
}

napi_value CopyScreenshotToClipboard(napi_env env, napi_callback_info) {
  auto* request = new ScreenshotRequest();
  napi_value promise;
  napi_create_promise(env, &request->deferred, &promise);
  napi_value resource_name;
  napi_create_string_utf8(env, "SynaraBrowserScreenshot", NAPI_AUTO_LENGTH,
                          &resource_name);
  napi_create_threadsafe_function(
      env, nullptr, nullptr, resource_name, 0, 1, request,
      FinalizeScreenshotRequest, request, ResolveScreenshotRequest,
      &request->threadsafe_function);
  RunOnMain(^{
    NSString* current_url = g_web_view.URL.absoluteString;
    if (g_web_view == nil || current_url.length == 0 ||
        [current_url isEqualToString:@"about:blank"]) {
      napi_call_threadsafe_function(request->threadsafe_function,
                                    new bool(false), napi_tsfn_nonblocking);
      napi_release_threadsafe_function(request->threadsafe_function,
                                       napi_tsfn_release);
      return;
    }
    [g_web_view takeSnapshotWithConfiguration:nil
                            completionHandler:^(NSImage* image, NSError* error) {
      bool copied = false;
      if (image != nil && error == nil) {
        NSPasteboard* pasteboard = [NSPasteboard generalPasteboard];
        [pasteboard clearContents];
        copied = [pasteboard writeObjects:@[ image ]];
      }
      napi_call_threadsafe_function(request->threadsafe_function,
                                    new bool(copied), napi_tsfn_nonblocking);
      napi_release_threadsafe_function(request->threadsafe_function,
                                       napi_tsfn_release);
    }];
  });
  return promise;
}

void CallStateListener(napi_env env, napi_value callback, void*, void*) {
  if (env == nullptr || callback == nullptr) return;
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  napi_call_function(env, undefined, callback, 0, nullptr, nullptr);
}

void CallOpenWindowListener(napi_env env, napi_value callback, void*, void* data) {
  OpenWindowRequest* request = static_cast<OpenWindowRequest*>(data);
  if (env != nullptr && callback != nullptr && request != nullptr) {
    napi_value undefined, value, url, frame_name, has_features;
    napi_get_undefined(env, &undefined);
    napi_create_object(env, &value);
    napi_create_string_utf8(env, request->url.c_str(), request->url.size(), &url);
    napi_set_named_property(env, value, "url", url);
    napi_create_string_utf8(env, request->frame_name.c_str(),
                            request->frame_name.size(), &frame_name);
    napi_set_named_property(env, value, "frameName", frame_name);
    napi_get_boolean(env, request->has_features, &has_features);
    napi_set_named_property(env, value, "hasFeatures", has_features);
    napi_call_function(env, undefined, callback, 1, &value, nullptr);
  }
  delete request;
}

napi_value SetStateListener(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  if (g_state_listener != nullptr) {
    napi_release_threadsafe_function(g_state_listener, napi_tsfn_abort);
    g_state_listener = nullptr;
  }
  napi_valuetype type = napi_undefined;
  if (argc != 1 || napi_typeof(env, arg, &type) != napi_ok ||
      (type != napi_function && type != napi_null && type != napi_undefined)) {
    napi_throw_type_error(env, nullptr, "state listener must be a function or null");
    return nullptr;
  }
  if (type == napi_function) {
    napi_value name;
    napi_create_string_utf8(env, "SynaraBrowserStateListener", NAPI_AUTO_LENGTH, &name);
    napi_create_threadsafe_function(env, arg, nullptr, name, 0, 1, nullptr, nullptr,
                                    nullptr, CallStateListener, &g_state_listener);
  }
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value SetCopyLinkListener(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  if (g_copy_link_listener != nullptr) {
    napi_release_threadsafe_function(g_copy_link_listener, napi_tsfn_abort);
    g_copy_link_listener = nullptr;
  }
  napi_valuetype type = napi_undefined;
  if (argc != 1 || napi_typeof(env, arg, &type) != napi_ok ||
      (type != napi_function && type != napi_null && type != napi_undefined)) {
    napi_throw_type_error(env, nullptr, "copy link listener must be a function or null");
    return nullptr;
  }
  if (type == napi_function) {
    napi_value name;
    napi_create_string_utf8(env, "SynaraBrowserCopyLinkListener", NAPI_AUTO_LENGTH, &name);
    napi_create_threadsafe_function(env, arg, nullptr, name, 0, 1, nullptr, nullptr,
                                    nullptr, CallStateListener, &g_copy_link_listener);
  }
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value SetOpenWindowListener(napi_env env, napi_callback_info info) {
  size_t argc = 1;
  napi_value arg;
  napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  if (g_open_window_listener != nullptr) {
    napi_release_threadsafe_function(g_open_window_listener, napi_tsfn_abort);
    g_open_window_listener = nullptr;
  }
  napi_valuetype type = napi_undefined;
  if (argc != 1 || napi_typeof(env, arg, &type) != napi_ok ||
      (type != napi_function && type != napi_null && type != napi_undefined)) {
    napi_throw_type_error(env, nullptr, "open window listener must be a function or null");
    return nullptr;
  }
  if (type == napi_function) {
    napi_value name;
    napi_create_string_utf8(env, "SynaraBrowserOpenWindowListener", NAPI_AUTO_LENGTH, &name);
    napi_create_threadsafe_function(env, arg, nullptr, name, 0, 1, nullptr, nullptr,
                                    nullptr, CallOpenWindowListener,
                                    &g_open_window_listener);
  }
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value GetState(napi_env env, napi_callback_info) {
  __block bool attached = false, visible = false, can_go_back = false,
      can_go_forward = false, is_loading = false;
  __block NSString* current_url = @"";
  __block NSString* current_title = @"";
  __block NSString* favicon_url = @"";
  __block NSString* tab_id = @"";
  RunOnMain(^{
    attached = g_web_view != nil;
    if (!attached) return;
    tab_id = g_active_tab_id ?: @"";
    visible = !g_web_view.hidden;
    can_go_back = g_web_view.canGoBack;
    can_go_forward = g_web_view.canGoForward;
    is_loading = g_web_view.loading;
    current_url = g_web_view.URL.absoluteString ?: @"";
    current_title = g_web_view.title ?: @"";
    favicon_url = objc_getAssociatedObject(g_web_view, &kSynaraFaviconUrlKey) ?: @"";
    if (g_last_error != nil && g_failed_url.length > 0) {
      current_url = g_failed_url;
      NSURL* failed_url = [NSURL URLWithString:g_failed_url];
      current_title = failed_url.host.length > 0 ? failed_url.host : g_failed_url;
    }
  });
  napi_value state;
  napi_create_object(env, &state);
  napi_value supported_value;
  napi_get_boolean(env, true, &supported_value);
  napi_set_named_property(env, state, "supported", supported_value);
  napi_value attached_value;
  napi_get_boolean(env, attached, &attached_value);
  napi_set_named_property(env, state, "attached", attached_value);
  auto set_bool = [&](const char* key, bool value) {
    napi_value output; napi_get_boolean(env, value, &output);
    napi_set_named_property(env, state, key, output);
  };
  auto set_string = [&](const char* key, NSString* value) {
    napi_value output;
    napi_create_string_utf8(env, value.UTF8String ?: "", NAPI_AUTO_LENGTH, &output);
    napi_set_named_property(env, state, key, output);
  };
  set_bool("visible", visible);
  set_string("tabId", tab_id);
  set_bool("canGoBack", can_go_back);
  set_bool("canGoForward", can_go_forward);
  set_bool("isLoading", is_loading);
  if (g_last_error == nil) {
    napi_value null_value;
    napi_get_null(env, &null_value);
    napi_set_named_property(env, state, "lastError", null_value);
  } else {
    set_string("lastError", g_last_error);
  }
  set_string("url", current_url);
  set_string("title", current_title);
  set_string("faviconUrl", favicon_url);
  return state;
}

napi_value Initialize(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
      {"attach", nullptr, Attach, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setBounds", nullptr, SetBounds, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setVisible", nullptr, SetVisible, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"navigate", nullptr, Navigate, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"goBack", nullptr, GoBack, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"goForward", nullptr, GoForward, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"reload", nullptr, Reload, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"newTab", nullptr, NewTab, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"selectTab", nullptr, SelectTab, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"closeTab", nullptr, CloseTab, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"copyScreenshotToClipboard", nullptr, CopyScreenshotToClipboard, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"getState", nullptr, GetState, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setStateListener", nullptr, SetStateListener, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setCopyLinkListener", nullptr, SetCopyLinkListener, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setOpenWindowListener", nullptr, SetOpenWindowListener, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"destroy", nullptr, Destroy, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 16, properties);
  return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, Initialize)
