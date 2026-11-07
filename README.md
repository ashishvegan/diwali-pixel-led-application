# 🪔 Diwali Pixel LED Controller (ESP8266 + WS2811 48-LEDs)

A complete, production-ready smart lighting system designed for gallery and home festive decor. Features a **mobile-first, no-login web application**, a **lightweight PHP cloud backend**, and an **ESP8266 FastLED firmware** with instant non-volatile EEPROM memory and 12 eye-catching Diwali patterns.

---

## 🌟 Key Features

- **Instant Gallery Lighting (Zero-Wait Boot)**:
  - On power-on, the ESP8266 immediately loads the last saved pattern and colors from flash EEPROM within **10 milliseconds**—your gallery lights up before WiFi even connects!
- **Mobile-First Web App (No Login Required)**:
  - Responsive, dark-mode luxury Diwali aesthetic with glassmorphism and golden neon accents.
  - **Live 48-Pixel LED Gallery Simulator**: See the exact 48 LEDs dance in real-time on your phone screen at 60 FPS before and during physical sync.
  - Haptic touch feedback, brightness sliders, animation speed control, and sparkle toggles.
- **15 Eye-Catching "WOW" Festive Patterns**:
  1. **Diya Flame**: Warm flickering clay lamps with golden ember flares.
  2. **Phuljhadi Sparkler**: Celebratory crackling white and golden sparkles.
  3. **Rangoli Fireworks**: Explosive dual-shockwave bursts radiating from center to edges.
  4. **Rainbow Comet Chase**: Ultra-smooth 80 FPS full-spectrum comet sweeps.
  5. **Meteor Rain Shower**: Cinematic falling shooting stars with fading trails.
  6. **Mystic Aurora Waves**: Peacock teal, royal violet, and golden harmonic ripples.
  7. **Dual Wave Ripple**: 3D trigonometric oscillation blending Color 1 and Color 2.
  8. **Diwali Fireflies (Jugnu)**: Organic wandering fireflies softly breathing in the night.
  9. **Festive Heartbeat Pulse**: Rhythmic acoustic Diwali beats radiating across the gallery.
  10. **Cyber Neon Run**: High-energy dual neon tracers bouncing across the strip.
  11. **Royal Gallery Gold**: Architectural warm ambient static lighting for upscale evenings.
  12. **Carnival Marquee**: Classic festive alternating theater chase.
  13. **Color Drop Stacker (Tetris/Slider)**: One-by-one glowing LEDs drop like a slider with random colors, stacking all 48 pixels until a celebratory rainbow flash triggers!
  14. **Neon Pixel Chaser**: Multi-head high-speed chasers speeding across the gallery with fading comet tails.
  15. **Solid Single Color**: Pure, uniform single shade across all 48 LEDs with instant 1-tap palette swatches.
- **Dedicated Single Color Setting**:
  - 1-tap quick swatches (Warm Diya, Pure Gold, Warm White 2400K, Pure White, Ruby Red, Peacock Teal, etc.) to set the entire gallery to a single shade instantly.
- **Non-Blocking Architecture**:
  - The ESP8266 animation loop runs at 80 FPS without any micro-stutters or pauses during server sync.

---

## 📂 Project Structure

```
Diwali.Pixel.LED.ESP8266/
├── backend/                                # Upload to http://www.tinkerstream.com/pixel-led/
│   ├── index.php                          # Mobile-first Web Application
│   ├── api.php                            # REST API for ESP8266 and Web Controller
│   ├── state.json                         # Current lighting state store
│   ├── css/
│   │   └── style.css                      # Luxury glassmorphism & neon theme
│   └── js/
│       └── app.js                         # Real-time 48-LED canvas simulator & sync engine
├── esp8266_firmware/
│   └── Diwali_Pixel_WS2811/
│       └── Diwali_Pixel_WS2811.ino        # FastLED ESP8266 firmware (NodeMCU / D1 Mini)
└── README.md
```

---

## ⚡ Hardware Wiring Diagram (48 WS2811 LEDs)

```
        +-------------------------------------------------------+
        |                 External Power Supply                 |
        |              (12V DC for 12V WS2811 pixels            |
        |               or 5V DC for 5V WS2811 pixels)          |
        +-------------------------------------------------------+
                | (+)                                  | (-) GND
                |                                      |
                |          +--------------------+      |
                |          |   ESP8266 NodeMCU  |      |
                |          |                    |      |
                |          |                GND |------+ (COMMON GROUND)
                |          |                    |
                |          |     GPIO4 (Pin D2) |---+ (Data Out)
                |          +--------------------+   |
                |                                   |
                |                               [330Ω Resistor]
                |                                   |
                v (+)                               v (Data In)
        +-------------------------------------------------------+
        |     WS2811 Addressable Pixel LED Strip (48 LEDs)      |
        |  [ +12V / +5V ]     [ DATA IN ]       [ GND ]         |
        +-------------------------------------------------------+
```

### Wiring Notes:
1. **Common Ground is Critical**: Connect the **GND** of the ESP8266 directly to the **GND (-)** of the LED power supply. Without common ground, the data signal will experience erratic flashing.
2. **Data Pin**: Connect ESP8266 **Pin D2 (GPIO 4)** to the **Data Input (DIN)** of the first WS2811 pixel. A **330Ω to 470Ω resistor** in series between D2 and DIN protects the first LED from voltage spikes.
3. **Power Requirement**: 48 LEDs at full white draw up to ~2.8A. A **12V / 5V 3A (or 5A) power adapter** is recommended for bright gallery illumination.
4. **Color Order**: Most 12V WS2811 bullet pixels use `RGB` or `BRG`. The code is pre-set to `#define COLOR_ORDER RGB` (Red = Red, Lime = Green, Blue = Blue). If your specific strip has swapped colors, you can change this line in the `.ino` file to `BRG` or `GRB`.

---

## 🚀 Deployment Instructions

### 1. Deploy the PHP Backend

1. Upload the entire contents of the `backend/` folder to your server:
   ```
   http://www.tinkerstream.com/pixel-led/
   ```
2. Verify file permissions: Ensure `state.json` is writable by PHP (`chmod 666 state.json` or `chmod 775` on the folder).
3. Test the API:
   - Open in your browser: `http://www.tinkerstream.com/pixel-led/api.php?action=get`
   - You should see a clean JSON response with `status: "success"` and the default Diwali settings.
4. Open the Web App:
   - Visit `http://www.tinkerstream.com/pixel-led/` on your smartphone browser.
   - You will see the mobile controller with the live 48-pixel LED simulator.

---

### 2. Flash the ESP8266 Controller

1. Install **Arduino IDE** (version 1.8.19 or 2.x).
2. Add ESP8266 Board Manager URL in **File > Preferences > Additional Boards Manager URLs**:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Go to **Tools > Board > Boards Manager**, search for `esp8266`, and install it.
4. Go to **Sketch > Include Library > Manage Libraries...** and install:
   - **FastLED** by Daniel Garcia (v3.6+ or newer)
   - **ArduinoJson** by Benoît Blanchon (v6.x or v7.x)
5. Open `esp8266_firmware/Diwali_Pixel_WS2811/Diwali_Pixel_WS2811.ino`.
6. Confirm the pre-configured WiFi settings:
   ```cpp
   const char* WIFI_SSID     = "Airtel_Adhyani";
   const char* WIFI_PASSWORD = "Adhyani@2024";
   const char* API_URL       = "http://www.tinkerstream.com/pixel-led/api.php?action=get&client=esp";
   ```
7. Select your board under **Tools > Board**:
   - `NodeMCU 1.0 (ESP-12E Module)` or `LOLIN(WEMOS) D1 R2 & mini`
   - CPU Frequency: `80 MHz` (or `160 MHz`)
   - Flash Size: `4MB (FS:2MB OTA:~1019KB)`
   - Port: Select your USB COM port
8. Click **Upload**.
9. Open the Serial Monitor at **115200 baud** to view real-time boot status, EEPROM restoration, and WiFi connection logs.

---

## 📱 Using the Mobile Web Application

- **Open on Mobile**: Open `http://www.tinkerstream.com/pixel-led/` directly from your phone. You can tap **Add to Home Screen** on iOS Safari or Android Chrome to launch it like a native app.
- **Pattern Selector**: Tap any of the 12 cards to switch patterns instantly.
- **Color Customization**: Tap the **Colors** tab to pick custom primary and secondary hex colors or apply one of the curated Diwali palettes (Laxmi Puja Gold, Peacock Festival, Phuljhadi Spark, etc.).
- **Live Simulator**: The 48-bulb strip at the top animates synchronously with the selected mode.
- **Auto Save**: Any change you make automatically pushes to the PHP backend, which the ESP8266 picks up within ~2 seconds and persists to EEPROM flash memory.

