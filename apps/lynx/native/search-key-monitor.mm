#include <node_api.h>

#import <AppKit/AppKit.h>

#include <cstring>
#include <string>
#include <utility>

namespace {

id g_monitor = nil;
napi_threadsafe_function g_callback = nullptr;
CGRect g_composer_bounds = CGRectZero;
bool g_has_composer_bounds = false;

struct KeyEventPayload {
  std::string key;
  bool shift;
};

void StopMonitor() {
  if (g_monitor != nil) {
    [NSEvent removeMonitor:g_monitor];
    g_monitor = nil;
  }
  if (g_callback != nullptr) {
    napi_release_threadsafe_function(g_callback, napi_tsfn_abort);
    g_callback = nullptr;
  }
}

void CallJavascript(napi_env env, napi_value callback, void*, void* data) {
  if (data == nullptr) return;
  auto* event = static_cast<KeyEventPayload*>(data);
  if (env == nullptr || callback == nullptr) {
    delete event;
    return;
  }
  napi_value payload;
  napi_create_object(env, &payload);
  napi_value key;
  napi_create_string_utf8(env, event->key.c_str(), event->key.size(), &key);
  napi_set_named_property(env, payload, "key", key);
  napi_value shift;
  napi_get_boolean(env, event->shift, &shift);
  napi_set_named_property(env, payload, "shiftKey", shift);
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  napi_call_function(env, undefined, callback, 1, &payload, nullptr);
  delete event;
}

napi_value Stop(napi_env env, napi_callback_info) {
  StopMonitor();
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value SetComposerBounds(napi_env env, napi_callback_info info) {
  size_t argc = 4;
  napi_value args[4];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  if (argc != 4) {
    napi_throw_type_error(env, nullptr, "setComposerBounds requires x, y, width, and height");
    return nullptr;
  }
  double x = 0, y = 0, width = 0, height = 0;
  if (napi_get_value_double(env, args[0], &x) != napi_ok ||
      napi_get_value_double(env, args[1], &y) != napi_ok ||
      napi_get_value_double(env, args[2], &width) != napi_ok ||
      napi_get_value_double(env, args[3], &height) != napi_ok) {
    napi_throw_type_error(env, nullptr, "setComposerBounds requires numeric bounds");
    return nullptr;
  }
  g_composer_bounds = CGRectMake(x, y, width, height);
  g_has_composer_bounds = width > 0 && height > 0;
  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value Start(napi_env env, napi_callback_info info) {
  size_t argc = 3;
  napi_value args[3];
  napi_get_cb_info(env, info, &argc, args, nullptr, nullptr);
  bool is_buffer = false;
  if (argc != 3 || napi_is_buffer(env, args[0], &is_buffer) != napi_ok ||
      !is_buffer) {
    napi_throw_type_error(env, nullptr, "start requires a native window handle Buffer, callback, and terminal-mode boolean");
    return nullptr;
  }
  napi_valuetype callback_type;
  napi_typeof(env, args[1], &callback_type);
  if (callback_type != napi_function) {
    napi_throw_type_error(env, nullptr, "start requires a callback");
    return nullptr;
  }
  bool terminal_mode = false;
  if (napi_get_value_bool(env, args[2], &terminal_mode) != napi_ok) {
    napi_throw_type_error(env, nullptr, "start requires a terminal-mode boolean");
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
  NSView* target_view = (__bridge NSView*)raw_view;
  if (target_view == nil) {
    napi_throw_error(env, nullptr, "native window handle is null");
    return nullptr;
  }

  StopMonitor();
  napi_value resource_name;
  napi_create_string_utf8(env, "SynaraSearchKeyMonitor", NAPI_AUTO_LENGTH,
                          &resource_name);
  napi_create_threadsafe_function(env, args[1], nullptr, resource_name, 0, 1,
                                  nullptr, nullptr, nullptr, CallJavascript,
                                  &g_callback);

  __weak NSWindow* target_window = target_view.window;
  g_monitor = [NSEvent
      addLocalMonitorForEventsMatchingMask:(NSEventMaskKeyDown | NSEventMaskLeftMouseDown)
                                 handler:^NSEvent*(NSEvent* event) {
    if (event.window != target_window) return event;
    if (event.type == NSEventTypeLeftMouseDown) {
      if (!terminal_mode || !g_has_composer_bounds) return event;
      NSPoint point = [target_view convertPoint:event.locationInWindow fromView:nil];
      const double top = target_view.isFlipped
          ? point.y
          : target_view.bounds.size.height - point.y;
      if (!CGRectContainsPoint(g_composer_bounds, CGPointMake(point.x, top))) {
        return event;
      }
      auto* payload = new KeyEventPayload{"FocusComposer", false};
      if (napi_call_threadsafe_function(g_callback, payload, napi_tsfn_nonblocking) !=
          napi_ok) {
        delete payload;
        return event;
      }
      // The focused Terminal textarea otherwise receives the same mouse-down
      // after the Composer focus command and immediately retakes first
      // responder. Consume only clicks inside the reported Composer editor
      // bounds; footer controls and all other window input continue normally.
      return nil;
    }
    const bool control =
        (event.modifierFlags & NSEventModifierFlagControl) != 0;
    const bool command =
        (event.modifierFlags & NSEventModifierFlagCommand) != 0;
    const char* key = nullptr;
    if (terminal_mode && command && event.keyCode == 15) {
      key = (event.modifierFlags & NSEventModifierFlagShift) != 0
                ? "ForceReload"
                : "Reload";
    }
    else if (terminal_mode && command && event.keyCode == 3) key = "Find";
    else if (terminal_mode && control && event.keyCode == 8) key = "ControlC";
    else if (terminal_mode && control && event.keyCode == 37) key = "ControlL";
    else switch (event.keyCode) {
      case 36: if (terminal_mode) key = "Enter"; break;
      case 123: if (terminal_mode) key = "ArrowLeft"; break;
      case 124: if (terminal_mode) key = "ArrowRight"; break;
      case 125: key = "ArrowDown"; break;
      case 126: key = "ArrowUp"; break;
      case 48: key = "Tab"; break;
      case 53: key = "Escape"; break;
      default: break;
    }
    std::string resolved_key;
    if (key != nullptr) {
      resolved_key = key;
    } else {
      return event;
    }
    const bool shift =
        (event.modifierFlags & NSEventModifierFlagShift) != 0;
    auto* payload = new KeyEventPayload{resolved_key, shift};
    if (napi_call_threadsafe_function(g_callback, payload, napi_tsfn_nonblocking) !=
        napi_ok) {
      delete payload;
      return event;
    }
    return nil;
  }];

  napi_value undefined;
  napi_get_undefined(env, &undefined);
  return undefined;
}

napi_value Initialize(napi_env env, napi_value exports) {
  napi_property_descriptor properties[] = {
      {"start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr},
      {"setComposerBounds", nullptr, SetComposerBounds, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 3, properties);
  return exports;
}

}  // namespace

NAPI_MODULE(NODE_GYP_MODULE_NAME, Initialize)
