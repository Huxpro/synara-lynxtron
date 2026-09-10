#include <node_api.h>
#import <AVFoundation/AVFoundation.h>
#include <algorithm>
#include <atomic>
#include <cmath>
#include <cstdint>
#include <mutex>
#include <vector>

namespace {
constexpr double kTargetRate = 24000.0;
constexpr size_t kHeaderBytes = 44;
AVAudioEngine* g_engine = nil;
std::vector<float> g_samples;
std::mutex g_mutex;
double g_input_rate = 0;
size_t g_max_bytes = 0;
bool g_overflowed = false;
std::atomic<float> g_level{0};
CFAbsoluteTime g_started_at = 0;

napi_value Undefined(napi_env env) { napi_value v; napi_get_undefined(env, &v); return v; }
napi_value Boolean(napi_env env, bool input) { napi_value v; napi_get_boolean(env, input, &v); return v; }
napi_value String(napi_env env, const char* input) { napi_value v; napi_create_string_utf8(env, input, NAPI_AUTO_LENGTH, &v); return v; }

const char* PermissionStatus() {
  switch ([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio]) {
    case AVAuthorizationStatusAuthorized: return "granted";
    case AVAuthorizationStatusDenied: return "denied";
    case AVAuthorizationStatusRestricted: return "restricted";
    case AVAuthorizationStatusNotDetermined: return "not-determined";
  }
  return "unknown";
}

void StopEngine() {
  if (g_engine == nil) return;
  [g_engine.inputNode removeTapOnBus:0];
  [g_engine stop];
  g_engine = nil;
}

napi_value GetState(napi_env env, napi_callback_info) {
  napi_value state; napi_create_object(env, &state);
  napi_set_named_property(env, state, "supported", Boolean(env, true));
  napi_set_named_property(env, state, "recording", Boolean(env, g_engine != nil));
  napi_set_named_property(env, state, "permission", String(env, PermissionStatus()));
  napi_value level; napi_create_double(env, g_level.load(), &level);
  napi_set_named_property(env, state, "level", level);
  return state;
}

struct PermissionRequest { napi_threadsafe_function callback = nullptr; bool granted = false; };
void CallPermissionJavascript(napi_env env, napi_value callback, void*, void* data) {
  auto* request = static_cast<PermissionRequest*>(data);
  if (env != nullptr && callback != nullptr) {
    napi_value undefined = Undefined(env);
    napi_value granted = Boolean(env, request->granted);
    napi_call_function(env, undefined, callback, 1, &granted, nullptr);
  }
  napi_release_threadsafe_function(request->callback, napi_tsfn_release);
  delete request;
}
napi_value RequestPermission(napi_env env, napi_callback_info info) {
  size_t argc = 1; napi_value callback; napi_get_cb_info(env, info, &argc, &callback, nullptr, nullptr);
  napi_valuetype type;
  if (argc != 1 || napi_typeof(env, callback, &type) != napi_ok || type != napi_function) {
    napi_throw_type_error(env, nullptr, "requestPermission requires a callback"); return nullptr;
  }
  auto* request = new PermissionRequest();
  napi_value name = String(env, "SynaraVoicePermission");
  napi_create_threadsafe_function(env, callback, nullptr, name, 0, 1, nullptr, nullptr, nullptr, CallPermissionJavascript, &request->callback);
  [AVCaptureDevice requestAccessForMediaType:AVMediaTypeAudio completionHandler:^(BOOL granted) {
    request->granted = granted == YES;
    if (napi_call_threadsafe_function(request->callback, request, napi_tsfn_nonblocking) != napi_ok) {
      napi_release_threadsafe_function(request->callback, napi_tsfn_abort); delete request;
    }
  }];
  return Undefined(env);
}

napi_value Start(napi_env env, napi_callback_info info) {
  size_t argc = 1; napi_value arg; napi_get_cb_info(env, info, &argc, &arg, nullptr, nullptr);
  double max_bytes = 0;
  if (argc != 1 || napi_get_value_double(env, arg, &max_bytes) != napi_ok || !std::isfinite(max_bytes) || max_bytes <= kHeaderBytes) {
    napi_throw_type_error(env, nullptr, "start requires a positive WAV byte limit"); return nullptr;
  }
  if (g_engine != nil) { napi_throw_error(env, nullptr, "Voice recording is already running."); return nullptr; }
  if ([AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio] != AVAuthorizationStatusAuthorized) {
    napi_throw_error(env, nullptr, "Microphone access was denied."); return nullptr;
  }
  AVAudioEngine* engine = [[AVAudioEngine alloc] init];
  AVAudioInputNode* input = engine.inputNode;
  AVAudioFormat* format = [input outputFormatForBus:0];
  if (format.channelCount == 0 || format.sampleRate <= 0) { napi_throw_error(env, nullptr, "No microphone was found."); return nullptr; }
  { std::lock_guard<std::mutex> lock(g_mutex); g_samples.clear(); g_input_rate = format.sampleRate; g_max_bytes = static_cast<size_t>(max_bytes); g_overflowed = false; }
  [input installTapOnBus:0 bufferSize:4096 format:format block:^(AVAudioPCMBuffer* buffer, AVAudioTime*) {
    const auto frames = buffer.frameLength; const auto channels = buffer.format.channelCount; float* const* data = buffer.floatChannelData;
    if (frames == 0 || channels == 0 || data == nullptr) return;
    std::lock_guard<std::mutex> lock(g_mutex);
    const size_t max_samples = (g_max_bytes - kHeaderBytes) / sizeof(int16_t);
    const size_t projected = static_cast<size_t>(std::ceil((g_samples.size() + frames) * kTargetRate / g_input_rate));
    if (projected > max_samples) { g_overflowed = true; return; }
    const size_t start = g_samples.size(); g_samples.resize(start + frames);
    double energy = 0;
    for (AVAudioFrameCount frame = 0; frame < frames; ++frame) {
      float mixed = 0; for (AVAudioChannelCount channel = 0; channel < channels; ++channel) mixed += data[channel][frame];
      const float sample = mixed / static_cast<float>(channels);
      g_samples[start + frame] = sample; energy += sample * sample;
    }
    g_level.store(std::min(1.0f, static_cast<float>(std::sqrt(energy / frames) * 3.2)));
  }];
  NSError* error = nil;
  if (![engine startAndReturnError:&error]) {
    [input removeTapOnBus:0];
    napi_throw_error(env, nullptr, error.localizedDescription.UTF8String ?: "The microphone could not be opened."); return nullptr;
  }
  g_engine = engine; g_started_at = CFAbsoluteTimeGetCurrent(); g_level.store(0); return Undefined(env);
}

void U16(std::vector<uint8_t>* out, uint16_t v) { out->push_back(v & 0xff); out->push_back((v >> 8) & 0xff); }
void U32(std::vector<uint8_t>* out, uint32_t v) { for (int s = 0; s < 32; s += 8) out->push_back((v >> s) & 0xff); }
void ASCII(std::vector<uint8_t>* out, const char* value, size_t length) { out->insert(out->end(), value, value + length); }

napi_value Stop(napi_env env, napi_callback_info) {
  if (g_engine == nil) return Undefined(env);
  const double duration_ms = std::max(1.0, (CFAbsoluteTimeGetCurrent() - g_started_at) * 1000.0);
  StopEngine();
  std::vector<float> input; double input_rate = 0; bool overflowed = false;
  { std::lock_guard<std::mutex> lock(g_mutex); input.swap(g_samples); input_rate = g_input_rate; overflowed = g_overflowed; g_input_rate = 0; g_max_bytes = 0; g_overflowed = false; g_level.store(0); }
  if (overflowed) { napi_throw_range_error(env, nullptr, "Voice note is too large."); return nullptr; }
  if (input.empty() || input_rate <= 0) return Undefined(env);
  const size_t count = static_cast<size_t>(std::floor(input.size() * kTargetRate / input_rate));
  if (count == 0) return Undefined(env);
  std::vector<uint8_t> wav; wav.reserve(kHeaderBytes + count * 2);
  ASCII(&wav, "RIFF", 4); U32(&wav, static_cast<uint32_t>(36 + count * 2)); ASCII(&wav, "WAVEfmt ", 8);
  U32(&wav, 16); U16(&wav, 1); U16(&wav, 1); U32(&wav, 24000); U32(&wav, 48000); U16(&wav, 2); U16(&wav, 16);
  ASCII(&wav, "data", 4); U32(&wav, static_cast<uint32_t>(count * 2));
  for (size_t index = 0; index < count; ++index) {
    const double position = index * input_rate / kTargetRate; const size_t left = std::min(static_cast<size_t>(position), input.size() - 1); const size_t right = std::min(left + 1, input.size() - 1); const double fraction = position - left;
    const float sample = std::clamp(static_cast<float>(input[left] + (input[right] - input[left]) * fraction), -1.0f, 1.0f);
    U16(&wav, static_cast<uint16_t>(static_cast<int16_t>(std::lrint(sample * 32767.0f))));
  }
  napi_value result; napi_create_object(env, &result); napi_value buffer; void* copied = nullptr;
  napi_create_buffer_copy(env, wav.size(), wav.data(), &copied, &buffer); napi_set_named_property(env, result, "wav", buffer);
  napi_value duration; napi_create_double(env, duration_ms, &duration); napi_set_named_property(env, result, "durationMs", duration); return result;
}

napi_value Cancel(napi_env env, napi_callback_info) {
  StopEngine(); std::lock_guard<std::mutex> lock(g_mutex); g_samples.clear(); g_input_rate = 0; g_max_bytes = 0; g_overflowed = false; g_level.store(0); g_started_at = 0; return Undefined(env);
}
napi_value Initialize(napi_env env, napi_value exports) {
  napi_property_descriptor methods[] = {
    {"getState", nullptr, GetState, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"requestPermission", nullptr, RequestPermission, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"start", nullptr, Start, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"stop", nullptr, Stop, nullptr, nullptr, nullptr, napi_default, nullptr},
    {"cancel", nullptr, Cancel, nullptr, nullptr, nullptr, napi_default, nullptr},
  };
  napi_define_properties(env, exports, 5, methods); return exports;
}
}
NAPI_MODULE(NODE_GYP_MODULE_NAME, Initialize)
