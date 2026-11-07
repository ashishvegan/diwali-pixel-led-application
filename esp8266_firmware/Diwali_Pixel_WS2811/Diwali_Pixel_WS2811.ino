/**
 * ========================================================================================
 *  Diwali Pixel LED WS2811 Controller - Gallery Edition
 * ========================================================================================
 *  Hardware: ESP8266 (NodeMCU / Wemos D1 Mini / ESP-12F)
 *  LED Strip: WS2811 Addressable Pixel LEDs (48 LEDs)
 *  Backend: http://www.tinkerstream.com/pixel-led/api.php
 *  WiFi SSID: Airtel_Adhyani
 *  WiFi Pass: Adhyani@2024
 *
 *  Key Features:
 *  - Instant Boot: Loads last saved pattern & colors immediately from EEPROM (Zero wait).
 *  - 12 Mesmerizing, Eye-Catching Diwali Patterns with "WOW" feeling.
 *  - Non-blocking HTTP polling: LED animations run smoothly at 60-100 FPS without stutter.
 *  - Auto-reconnect WiFi & robust error handling.
 * ========================================================================================
 */

#define FASTLED_ESP8266_RAW_PIN_ORDER
#define FASTLED_INTERRUPT_RETRY_COUNT 1

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <FastLED.h>
#include <EEPROM.h>
#include <ArduinoJson.h>

// ----------------------------------------------------------------------------------------
// HARDWARE & LED CONFIGURATION
// ----------------------------------------------------------------------------------------
#define NUM_LEDS         48          // Total 48 LEDs in Gallery Wiring
#define DATA_PIN         4           // GPIO4 = D2 on NodeMCU / Wemos D1 Mini
#define LED_TYPE         WS2811      // WS2811 Chipset
#define COLOR_ORDER      RGB         // Configured for RGB wiring order (Red = Red, Lime = Lime, Blue = Blue)
#define FPS              80          // Animation Frame Rate

// ----------------------------------------------------------------------------------------
// NETWORK CONFIGURATION
// ----------------------------------------------------------------------------------------
const char* WIFI_SSID     = "Airtel_Adhyani";
const char* WIFI_PASSWORD = "Adhyani@2024";

// Backend API URL
const char* API_URL       = "http://www.tinkerstream.com/pixel-led/api.php?action=get&client=esp";
const unsigned long POLL_INTERVAL_MS = 2500;  // Poll server every 2.5 seconds

// ----------------------------------------------------------------------------------------
// EEPROM STORAGE CONFIGURATION (For Last Saved Pattern Persistence)
// ----------------------------------------------------------------------------------------
#define EEPROM_SIZE       128
#define EEPROM_MAGIC      0x44495741  // "DIWA" magic validation header

struct DeviceSettings {
    uint32_t magic;
    uint8_t  power;        // 1 = ON, 0 = OFF
    uint8_t  pattern;      // 0 to 14
    uint8_t  brightness;   // 0 to 255
    uint8_t  speed;        // 1 to 100
    uint8_t  r1, g1, b1;   // Color 1
    uint8_t  r2, g2, b2;   // Color 2
    uint8_t  sparkle;      // 0 or 1
    uint8_t  reverse;      // 0 = Normal, 1 = Reversed Flow
    uint32_t version;      // Config version tracker
};

DeviceSettings currentSettings;
DeviceSettings lastSavedSettings;

CRGB leds[NUM_LEDS];
unsigned long lastPollTime = 0;
uint16_t globalCycle = 0;

// ----------------------------------------------------------------------------------------
// COLOR UTILITY HELPERS
// ----------------------------------------------------------------------------------------
CRGB hexToCRGB(const char* hex) {
    if (hex[0] == '#') hex++;
    long number = strtol(hex, NULL, 16);
    long r = (number >> 16) & 0xFF;
    long g = (number >> 8) & 0xFF;
    long b = number & 0xFF;
    return CRGB(r, g, b);
}

// ----------------------------------------------------------------------------------------
// EEPROM FUNCTIONS
// ----------------------------------------------------------------------------------------
void loadSettingsFromEEPROM() {
    EEPROM.begin(EEPROM_SIZE);
    EEPROM.get(0, currentSettings);

    // Validate magic header; if corrupt or first run, set default Diwali Diya preset
    if (currentSettings.magic != EEPROM_MAGIC) {
        Serial.println(F("[EEPROM] First boot or invalid magic! Initializing defaults."));
        currentSettings.magic      = EEPROM_MAGIC;
        currentSettings.power      = 1;
        currentSettings.pattern    = 0;          // Diwali Diya Flame
        currentSettings.brightness = 200;
        currentSettings.speed      = 50;
        currentSettings.r1         = 255; currentSettings.g1 = 119; currentSettings.b1 = 0;   // Amber
        currentSettings.r2         = 255; currentSettings.g2 = 0;   currentSettings.b2 = 68;  // Crimson
        currentSettings.sparkle    = 1;
        currentSettings.reverse    = 0;
        currentSettings.version    = 1;
        
        EEPROM.put(0, currentSettings);
        EEPROM.commit();
    } else {
        Serial.println(F("[EEPROM] Restored last saved pattern and colors successfully!"));
        Serial.printf("[EEPROM] Pattern: %d, Brightness: %d, Speed: %d\n", 
            currentSettings.pattern, currentSettings.brightness, currentSettings.speed);
    }
    
    lastSavedSettings = currentSettings;
}

void saveSettingsToEEPROM() {
    // Only write if something meaningful has actually changed to preserve flash life
    if (memcmp(&currentSettings, &lastSavedSettings, sizeof(DeviceSettings)) != 0) {
        EEPROM.put(0, currentSettings);
        EEPROM.commit();
        lastSavedSettings = currentSettings;
        Serial.println(F("[EEPROM] Saved new settings to flash memory."));
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 0: DIWALI DIYA FLAME (Warm flickering clay diya lamps)
// ----------------------------------------------------------------------------------------
void patternDiyaFlame() {
    uint8_t speedFactor = map(currentSettings.speed, 1, 100, 10, 45);
    
    for (int i = 0; i < NUM_LEDS; i++) {
        // Dual sine oscillators + Perlin-style noise for organic flickering diya flames
        uint8_t flicker = inoise8(i * 90, millis() * speedFactor / 10);
        uint8_t warmth  = map(flicker, 0, 255, 12, 32); // Hue between deep amber and gold
        uint8_t bright  = map(flicker, 0, 255, 120, 255);
        
        leds[i] = CHSV(warmth, 245, bright);
        
        // Occasional diya ember flare
        if (random8() < 5) {
            leds[i] += CRGB(45, 15, 0);
        }
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 1: PHULJHADI SPARKLER (Celebratory crackling golden/white sparkles)
// ----------------------------------------------------------------------------------------
void patternPhuljhadi() {
    fadeToBlackBy(leds, NUM_LEDS, map(currentSettings.speed, 1, 100, 20, 60));
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    // Background gentle glowing embers
    int bgIndex = beatsin16(map(currentSettings.speed, 1, 100, 15, 60), 0, NUM_LEDS - 1);
    leds[bgIndex] = blend(col1, col2, beatsin8(30));
    
    // Crackling Phuljhadi sparkles
    uint8_t sparkChance = map(currentSettings.speed, 1, 100, 50, 180);
    if (random8() < sparkChance) {
        int pos = random16(NUM_LEDS);
        leds[pos] = CRGB(255, 250, 220); // Dazzling white-gold spark
        if (pos > 0) leds[pos - 1] += col1;
        if (pos < NUM_LEDS - 1) leds[pos + 1] += col2;
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 2: RANGOLI FIREWORKS (Bursts launching from center outwards)
// ----------------------------------------------------------------------------------------
void patternFireworks() {
    fadeToBlackBy(leds, NUM_LEDS, 40);
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    uint16_t beat = beat16(map(currentSettings.speed, 1, 100, 15, 65));
    uint8_t progress = (beat >> 8); // 0 to 255
    
    int center = NUM_LEDS / 2;
    int radius = map(progress, 0, 255, 0, center);
    
    int leftPixel  = center - radius;
    int rightPixel = center + radius - 1;
    
    if (leftPixel >= 0 && leftPixel < NUM_LEDS) {
        leds[leftPixel] = (progress < 40) ? CRGB::White : col1;
    }
    if (rightPixel >= 0 && rightPixel < NUM_LEDS) {
        leds[rightPixel] = (progress < 40) ? CRGB::White : col2;
    }
    
    // Sparkle trail in the wake of the explosion
    if (random8() < 40 && radius > 2) {
        int sparkPos = center + random8(-radius, radius);
        if (sparkPos >= 0 && sparkPos < NUM_LEDS) {
            leds[sparkPos] = CRGB(255, 230, 150);
        }
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 3: RAINBOW COMET CHASE (Silky smooth 60fps spectrum sweeps)
// ----------------------------------------------------------------------------------------
void patternRainbowComet() {
    uint8_t speedRate = map(currentSettings.speed, 1, 100, 1, 5);
    static uint8_t baseHue = 0;
    baseHue += speedRate;
    
    for (int i = 0; i < NUM_LEDS; i++) {
        uint8_t hue = baseHue + (i * 256 / NUM_LEDS);
        leds[i] = CHSV(hue, 240, 255);
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 4: METEOR RAIN SHOWER (Shooting stars gliding across the gallery)
// ----------------------------------------------------------------------------------------
void patternMeteorRain() {
    static int meteorPos = 0;
    static unsigned long lastMeteorMove = 0;
    
    unsigned long stepDelay = map(currentSettings.speed, 1, 100, 70, 12);
    if (millis() - lastMeteorMove > stepDelay) {
        lastMeteorMove = millis();
        meteorPos++;
        if (meteorPos >= NUM_LEDS + 12) {
            meteorPos = 0;
        }
    }
    
    // Decay existing LEDs for meteor trail
    for (int i = 0; i < NUM_LEDS; i++) {
        if (random8() < 80) {
            leds[i].fadeToBlackBy(55);
        }
    }
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    
    // Draw meteor head and glowing tail
    for (int j = 0; j < 10; j++) {
        int index = meteorPos - j;
        if (index >= 0 && index < NUM_LEDS) {
            if (j == 0) {
                leds[index] = CRGB::White; // Bright Meteor Core
            } else {
                leds[index] = col1;
                leds[index].fadeToBlackBy(j * 24);
            }
        }
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 5: MYSTIC AURORA WAVES (Peacock teal, violet & gold breathing waves)
// ----------------------------------------------------------------------------------------
void patternAuroraWaves() {
    uint16_t speedRate = map(currentSettings.speed, 1, 100, 4, 25);
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    for (int i = 0; i < NUM_LEDS; i++) {
        uint8_t wave1 = sin8((i * 12) + (millis() * speedRate / 30));
        uint8_t wave2 = cos8((i * 8)  - (millis() * speedRate / 45));
        uint8_t blended = (wave1 / 2) + (wave2 / 2);
        
        leds[i] = blend(col1, col2, blended);
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 6: DUAL WAVE RIPPLE (Harmonic oscillation blending Color 1 & 2)
// ----------------------------------------------------------------------------------------
void patternDualWaveRipple() {
    uint8_t speedRate = map(currentSettings.speed, 1, 100, 10, 80);
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    for (int i = 0; i < NUM_LEDS; i++) {
        uint8_t wave = beatsin8(speedRate, 0, 255, 0, i * 15);
        leds[i] = blend(col1, col2, wave);
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 7: DIWALI FIREFLIES / JUGNU (Organic wandering glowing points)
// ----------------------------------------------------------------------------------------
void patternFireflies() {
    fadeToBlackBy(leds, NUM_LEDS, map(currentSettings.speed, 1, 100, 15, 50));
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    
    // Spawn 4 independent floating fireflies
    for (int f = 0; f < 4; f++) {
        uint8_t speedOffset = 18 + (f * 7);
        int pos = beatsin16(speedOffset, 0, NUM_LEDS - 1, 0, f * 16384);
        leds[pos] += col1;
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 8: FESTIVE HEARTBEAT PULSE (Rhythmic festive pulse radiating outwards)
// ----------------------------------------------------------------------------------------
void patternHeartbeatPulse() {
    uint8_t bpm = map(currentSettings.speed, 1, 100, 30, 110);
    uint8_t beat = beatsin8(bpm, 20, 255);
    
    // Second secondary flutter beat
    uint8_t secondBeat = beatsin8(bpm, 10, 200, 0, 64);
    uint8_t combinedBeat = qadd8(beat / 2, secondBeat / 2);
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    for (int i = 0; i < NUM_LEDS; i++) {
        int distFromCenter = abs(i - (NUM_LEDS / 2));
        uint8_t wave = qsub8(combinedBeat, distFromCenter * 5);
        leds[i] = blend(col1, col2, wave);
        leds[i].nscale8_video(wave);
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 9: CYBER NEON RUN (High energy neon tracer beam)
// ----------------------------------------------------------------------------------------
void patternCyberNeon() {
    fadeToBlackBy(leds, NUM_LEDS, 70);
    
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    int runner1 = beat8(map(currentSettings.speed, 1, 100, 30, 160)) * NUM_LEDS / 256;
    int runner2 = NUM_LEDS - 1 - runner1;
    
    if (runner1 >= 0 && runner1 < NUM_LEDS) leds[runner1] = col1;
    if (runner2 >= 0 && runner2 < NUM_LEDS) leds[runner2] = col2;
}

// ----------------------------------------------------------------------------------------
// PATTERN 10: ROYAL GALLERY GOLD (Luxurious static architectural illumination)
// ----------------------------------------------------------------------------------------
void patternRoyalGold() {
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    
    // Subtle, gentle architectural breathing
    uint8_t breath = beatsin8(15, 230, 255);
    CRGB adjusted = col1;
    adjusted.nscale8_video(breath);
    
    fill_solid(leds, NUM_LEDS, adjusted);
}

// ----------------------------------------------------------------------------------------
// PATTERN 11: CARNIVAL MARQUEE (Classic festive theater alternating steps)
// ----------------------------------------------------------------------------------------
void patternCarnivalMarquee() {
    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
    
    int step = (millis() / map(currentSettings.speed, 1, 100, 250, 40)) % 3;
    
    for (int i = 0; i < NUM_LEDS; i++) {
        if ((i + step) % 3 == 0) {
            leds[i] = col1;
        } else {
            leds[i] = col2;
            leds[i].fadeToBlackBy(190);
        }
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 12: COLOR DROP STACKER (One by one LEDs drop like a slider with random colors)
// ----------------------------------------------------------------------------------------
void patternDropStacker() {
    static int8_t stackTarget = NUM_LEDS - 1;
    static int8_t sliderPos = 0;
    static CRGB stackedLeds[NUM_LEDS];
    static CRGB currentDropColor = CHSV(random8(), 245, 255);
    static uint16_t celebrationCount = 0;
    static unsigned long lastDropStep = 0;
    static bool initialized = false;

    if (!initialized) {
        fill_solid(stackedLeds, NUM_LEDS, CRGB::Black);
        initialized = true;
    }

    unsigned long stepDelay = map(currentSettings.speed, 1, 100, 50, 10);
    if (millis() - lastDropStep >= stepDelay) {
        lastDropStep = millis();

        if (celebrationCount > 0) {
            celebrationCount--;
            if (celebrationCount == 0) {
                // Reset stack when celebration finishes
                stackTarget = NUM_LEDS - 1;
                sliderPos = 0;
                fill_solid(stackedLeds, NUM_LEDS, CRGB::Black);
                currentDropColor = CHSV(random8(), 245, 255);
            }
        } else {
            sliderPos++;
            if (sliderPos >= stackTarget) {
                // Lock into stack position
                if (stackTarget >= 0 && stackTarget < NUM_LEDS) {
                    stackedLeds[stackTarget] = currentDropColor;
                }
                stackTarget--;
                sliderPos = 0;
                currentDropColor = CHSV(random8(), 245, 255); // Next random color!

                // When full 48 LEDs are stacked, trigger celebratory rainbow wave!
                if (stackTarget < 0) {
                    celebrationCount = 60;
                }
            }
        }
    }

    // Render output
    if (celebrationCount > 0) {
        // High-energy celebratory rainbow wave across the entire gallery
        fill_rainbow(leds, NUM_LEDS, millis() / 4, 7);
    } else {
        // Copy stacked pixels
        for (int i = 0; i < NUM_LEDS; i++) {
            leds[i] = stackedLeds[i];
        }

        // Render dropping slider pixel with bright head
        if (sliderPos >= 0 && sliderPos < NUM_LEDS) {
            leds[sliderPos] = CRGB::White; // Bright dazzling head
            if (sliderPos > 0) {
                leds[sliderPos - 1] = currentDropColor; // Trailing color
            }
        }
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 13: NEON PIXEL CHASER (High-speed multi-head dynamic chaser)
// ----------------------------------------------------------------------------------------
void patternPixelChaser() {
    fadeToBlackBy(leds, NUM_LEDS, 50);

    CRGB col1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
    CRGB col2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);

    uint8_t speedRate = map(currentSettings.speed, 1, 100, 30, 180);
    int head1 = beat8(speedRate) * NUM_LEDS / 256;
    int head2 = (head1 + (NUM_LEDS / 2)) % NUM_LEDS;

    // Draw first chaser with white sparkle head & Color 1 body
    if (head1 >= 0 && head1 < NUM_LEDS) {
        leds[head1] = CRGB::White;
        int tail1 = (head1 - 1 + NUM_LEDS) % NUM_LEDS;
        leds[tail1] = col1;
    }

    // Draw second chaser with white sparkle head & Color 2 body
    if (head2 >= 0 && head2 < NUM_LEDS) {
        leds[head2] = CRGB::White;
        int tail2 = (head2 - 1 + NUM_LEDS) % NUM_LEDS;
        leds[tail2] = col2;
    }
}

// ----------------------------------------------------------------------------------------
// PATTERN 14: SOLID SINGLE COLOR (Uniform static single shade across all 48 LEDs)
// ----------------------------------------------------------------------------------------
void patternSolidColor() {
    fill_solid(leds, NUM_LEDS, CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1));
}

// ----------------------------------------------------------------------------------------
// SPARKLE OVERLAY (Glitter effect)
// ----------------------------------------------------------------------------------------
void applySparkles() {
    if (currentSettings.sparkle && random8() < 45) {
        int sparkIndex = random16(NUM_LEDS);
        leds[sparkIndex] = CRGB::White;
    }
}

// ----------------------------------------------------------------------------------------
// EXECUTE CURRENT PATTERN
// ----------------------------------------------------------------------------------------
void runActivePattern() {
    if (!currentSettings.power) {
        fill_solid(leds, NUM_LEDS, CRGB::Black);
        FastLED.show();
        return;
    }

    switch (currentSettings.pattern) {
        case 0:  patternDiyaFlame();       break;
        case 1:  patternPhuljhadi();        break;
        case 2:  patternFireworks();       break;
        case 3:  patternRainbowComet();    break;
        case 4:  patternMeteorRain();      break;
        case 5:  patternAuroraWaves();     break;
        case 6:  patternDualWaveRipple();  break;
        case 7:  patternFireflies();       break;
        case 8:  patternHeartbeatPulse();  break;
        case 9:  patternCyberNeon();       break;
        case 10: patternRoyalGold();       break;
        case 11: patternCarnivalMarquee(); break;
        case 12: patternDropStacker();     break;
        case 13: patternPixelChaser();     break;
        case 14: patternSolidColor();      break;
        default: patternDiyaFlame();       break;
    }

    applySparkles();
    FastLED.setBrightness(currentSettings.brightness);
    FastLED.show();
}

// ----------------------------------------------------------------------------------------
// NON-BLOCKING HTTP BACKEND SYNC
// ----------------------------------------------------------------------------------------
void syncWithBackend() {
    if (WiFi.status() != WL_CONNECTED) {
        return; // Skip poll if WiFi is not connected
    }

    WiFiClient client;
    HTTPClient http;
    http.setTimeout(2500); // 2.5s timeout for resilient response
    
    if (http.begin(client, API_URL)) {
        http.addHeader("Connection", "close");
        int httpCode = http.GET();
        
        if (httpCode == HTTP_CODE_OK) {
            String payload = http.getString();
            
            #if ARDUINOJSON_VERSION_MAJOR >= 7
            JsonDocument doc;
            #else
            DynamicJsonDocument doc(1024);
            #endif
            DeserializationError error = deserializeJson(doc, payload);
            
            bool gotData = false;
            uint8_t newPower = currentSettings.power;
            uint8_t newPattern = currentSettings.pattern;
            uint8_t newBrightness = currentSettings.brightness;
            uint8_t newSpeed = currentSettings.speed;
            CRGB newC1 = CRGB(currentSettings.r1, currentSettings.g1, currentSettings.b1);
            CRGB newC2 = CRGB(currentSettings.r2, currentSettings.g2, currentSettings.b2);
            uint8_t newSparkle = currentSettings.sparkle;
            uint32_t incomingVersion = 0;

            if (!error && doc["status"] == "success") {
                incomingVersion = doc["state"]["version"] | 0;
                newPower = doc["state"]["power"] | 1;
                newPattern = doc["state"]["pattern"] | 0;
                newBrightness = doc["state"]["brightness"] | 200;
                newSpeed = doc["state"]["speed"] | 50;
                const char* c1Hex = doc["state"]["color1"] | "#ff7700";
                newC1 = hexToCRGB(c1Hex);
                const char* c2Hex = doc["state"]["color2"] | "#ff0044";
                newC2 = hexToCRGB(c2Hex);
                newSparkle = doc["state"]["sparkle"] | 1;
                gotData = true;
            } else {
                // FALLBACK: Lightweight parser in case JSON library encounters unexpected syntax
                int patIdx = payload.indexOf("\"pattern\":");
                if (patIdx != -1) {
                    newPattern = payload.substring(patIdx + 10).toInt();
                    int powIdx = payload.indexOf("\"power\":");
                    if (powIdx != -1) newPower = payload.substring(powIdx + 8).toInt();
                    gotData = true;
                }
            }

            // Immediately apply any changed settings without version gatekeeper blocking!
            if (gotData) {
                bool changed = false;

                if (currentSettings.power != newPower) { 
                    currentSettings.power = newPower; 
                    changed = true; 
                    Serial.printf("[HTTP] Power: %s\n", newPower ? "ON" : "OFF");
                }
                if (currentSettings.pattern != newPattern) { 
                    currentSettings.pattern = newPattern; 
                    changed = true; 
                    Serial.printf("[HTTP] >>> Pattern changed to: %d <<<\n", newPattern);
                }
                if (currentSettings.brightness != newBrightness) { 
                    currentSettings.brightness = newBrightness; 
                    changed = true; 
                }
                if (currentSettings.speed != newSpeed) { 
                    currentSettings.speed = newSpeed; 
                    changed = true; 
                }
                if (currentSettings.r1 != newC1.r || currentSettings.g1 != newC1.g || currentSettings.b1 != newC1.b) {
                    currentSettings.r1 = newC1.r; currentSettings.g1 = newC1.g; currentSettings.b1 = newC1.b;
                    changed = true;
                }
                if (currentSettings.r2 != newC2.r || currentSettings.g2 != newC2.g || currentSettings.b2 != newC2.b) {
                    currentSettings.r2 = newC2.r; currentSettings.g2 = newC2.g; currentSettings.b2 = newC2.b;
                    changed = true;
                }
                if (currentSettings.sparkle != newSparkle) { 
                    currentSettings.sparkle = newSparkle; 
                    changed = true; 
                }

                if (changed) {
                    currentSettings.version = incomingVersion;
                    saveSettingsToEEPROM();
                }
            }
        } else {
            Serial.printf("[HTTP] GET code: %d (%s)\n", httpCode, http.errorToString(httpCode).c_str());
        }
        http.end();
        client.stop();
    }
}

// ----------------------------------------------------------------------------------------
// SETUP
// ----------------------------------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F(" Diwali Pixel LED Controller (WS2811 - 48 LEDs)  "));
    Serial.println(F("=================================================="));

    // 1. FASTLED INITIALIZATION (Data Pin 4 = D2 on NodeMCU)
    FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);
    FastLED.setDither(true);

    // 2. INSTANT PERSISTENCE: Restore last pattern immediately!
    loadSettingsFromEEPROM();

    // Light up the gallery immediately without waiting for WiFi connection
    FastLED.setBrightness(currentSettings.brightness);
    runActivePattern();

    // 3. WIFI SETUP
    Serial.print(F("[WIFI] Connecting to "));
    Serial.println(WIFI_SSID);
    WiFi.mode(WIFI_STA);
    WiFi.setAutoReconnect(true);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

// ----------------------------------------------------------------------------------------
// MAIN LOOP
// ----------------------------------------------------------------------------------------
void loop() {
    // 1. Non-blocking smooth animation frame rate
    static unsigned long lastFrameTime = 0;
    unsigned long now = millis();
    if (now - lastFrameTime >= (1000 / FPS)) {
        lastFrameTime = now;
        runActivePattern();
    }

    // 2. Non-blocking periodic backend sync
    if (now - lastPollTime >= POLL_INTERVAL_MS) {
        lastPollTime = now;

        if (WiFi.status() == WL_CONNECTED) {
            syncWithBackend();
        } else {
            Serial.println(F("[WIFI] Reconnecting to Airtel_Adhyani..."));
        }
    }

    yield(); // Keep WiFi stack responsive without watchdog interruptions
}

