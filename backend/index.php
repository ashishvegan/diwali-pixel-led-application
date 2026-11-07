<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <meta name="theme-color" content="#0a0b12">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Diwali Pixels">
    <link rel="manifest" href="manifest.json">
    <link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪔</text></svg>">
    <title>Diwali Pixel LED • Gallery Lights</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
</head>
<body>

<div class="mobile-wrapper">
    <!-- Top Header -->
    <header class="app-header">
        <div class="brand-wrapper">
            <span class="diya-icon">🪔</span>
            <div>
                <h1 class="brand-title">Diwali Pixels</h1>
                <div class="brand-subtitle">
                    <span>Gallery</span>
                    <span id="espStatusBadge" class="status-badge offline">
                        <span class="status-dot"></span> Checking...
                    </span>
                </div>
            </div>
        </div>

        <!-- Master Power Button -->
        <button id="powerBtn" class="power-toggle-btn on" title="Toggle Power" aria-label="Toggle Gallery Lights">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                <line x1="12" y1="2" x2="12" y2="12"></line>
            </svg>
        </button>
    </header>

    <!-- 48-Pixel LED Gallery Simulator -->
    <section class="simulator-container">
        <div class="simulator-header">
            <div class="simulator-title">
                <span>✦ Gallery Live Simulator</span>
                <span class="led-count-tag">48 LEDs (WS2811)</span>
            </div>
        </div>
        <div class="simulator-canvas-wrapper">
            <canvas id="ledCanvas"></canvas>
        </div>
        <div class="gallery-wire-decoration">
            <span>◄ LED 1 (Input)</span>
            <span>Gallery Arch / Garland</span>
            <span>LED 48 ►</span>
        </div>
    </section>

    <!-- Quick Slider Controls -->
    <section class="controls-panel">
        <!-- Brightness Slider -->
        <div class="control-row">
            <div class="control-label-bar">
                <span>Brightness</span>
                <span id="brightnessValue" class="control-value">78%</span>
            </div>
            <div class="slider-wrapper">
                <span class="slider-icon">🔅</span>
                <input type="range" id="brightnessSlider" min="10" max="255" value="200" step="5">
                <span class="slider-icon">🔆</span>
            </div>
        </div>

        <!-- Speed Slider -->
        <div class="control-row">
            <div class="control-label-bar">
                <span>Animation Speed</span>
                <span id="speedValue" class="control-value">50%</span>
            </div>
            <div class="slider-wrapper">
                <span class="slider-icon">🐢</span>
                <input type="range" id="speedSlider" min="5" max="100" value="50" step="1">
                <span class="slider-icon">⚡</span>
            </div>
        </div>

        <!-- Sparkles Overlay -->
        <div class="sparkle-row">
            <div class="sparkle-label">
                <span>✨</span>
                <span>Phuljhadi Sparkles Overlay</span>
            </div>
            <label class="switch">
                <input type="checkbox" id="sparkleToggle" checked>
                <span class="switch-slider"></span>
            </label>
        </div>

        <!-- Flow Direction Reverse Toggle -->
        <div class="sparkle-row">
            <div class="sparkle-label">
                <span>↔️</span>
                <span>Flip Wiring / Flow Direction</span>
            </div>
            <label class="switch">
                <input type="checkbox" id="reverseToggle">
                <span class="switch-slider"></span>
            </label>
        </div>

        <!-- Backend Random Color Flasher / Heartbeat Shuffler Toggle -->
        <div class="sparkle-row" style="background: rgba(236, 72, 153, 0.12); border: 1px solid rgba(236, 72, 153, 0.3); border-radius: 12px; padding: 10px 14px; margin-top: 6px;">
            <div class="sparkle-label" style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.3rem;">🎲</span>
                <div style="text-align: left;">
                    <div style="font-weight: 600; color: #f472b6; font-size: 0.92rem;">Random Color Flasher / Shuffler</div>
                    <div style="font-size: 0.72rem; color: #cbd5e1; margin-top: 2px;">Auto-cycles random festive colors on Heartbeat Pulse & All patterns (No reflash needed!)</div>
                </div>
            </div>
            <label class="switch">
                <input type="checkbox" id="randomColorsToggle">
                <span class="switch-slider"></span>
            </label>
        </div>
    </section>

    <!-- Tabbed Content Area -->
    <main class="content-area">
        <!-- TAB 1: Patterns Grid -->
        <div id="tab-patterns" class="tab-pane active">
            <div class="section-title">
                <span>✨</span>
                <span>Festive Gallery Patterns</span>
            </div>
            <p class="section-desc">Select any pattern to instantly animate the gallery LEDs</p>

            <div id="patternsContainer" class="patterns-grid">
                <!-- Dynamically populated by JS -->
            </div>
        </div>

        <!-- TAB 2: Colors & Presets -->
        <div id="tab-colors" class="tab-pane">
            <!-- Single Color Mode Section -->
            <div class="section-title">
                <span>🎯</span>
                <span>Set Single Color</span>
            </div>
            <p class="section-desc">Tap any color to set all 48 gallery LEDs to a single uniform shade</p>

            <div id="singleSwatchesContainer" class="single-swatches-grid">
                <!-- Dynamically populated by JS -->
            </div>

            <button id="applySolidBtn" class="solid-mode-action-btn" style="margin-top: 10px;">
                <span>💡</span>
                <span>Set Entire Gallery to Selected Single Color</span>
            </button>

            <div class="section-title" style="margin-top: 20px;">
                <span>🎨</span>
                <span>Custom Dual Colors</span>
            </div>
            <p class="section-desc">Fine-tune the primary and secondary glow hues</p>

            <div class="color-picker-section">
                <div class="color-pickers-row">
                    <!-- Primary Color -->
                    <div class="color-box-card">
                        <span class="color-box-label">Color 1 (Primary)</span>
                        <div id="color1Preview" class="color-preview-circle" style="background-color: #ff7700;">
                            <input type="color" id="color1Input" class="color-native-input" value="#ff7700">
                        </div>
                        <span id="color1Hex" class="hex-label">#FF7700</span>
                    </div>

                    <!-- Secondary Color -->
                    <div class="color-box-card">
                        <span class="color-box-label">Color 2 (Secondary)</span>
                        <div id="color2Preview" class="color-preview-circle" style="background-color: #ff0044;">
                            <input type="color" id="color2Input" class="color-native-input" value="#ff0044">
                        </div>
                        <span id="color2Hex" class="hex-label">#FF0044</span>
                    </div>
                </div>

                <div class="section-title" style="margin-top: 10px;">
                    <span>🪔</span>
                    <span>Curated Diwali Palettes</span>
                </div>
                <p class="section-desc">Tap to apply vibrant festive combinations</p>

                <div id="presetsContainer" class="presets-grid">
                    <!-- Dynamically populated by JS -->
                </div>
            </div>
        </div>

        <!-- TAB 3: System Status & Hardware Info -->
        <div id="tab-status" class="tab-pane">
            <div class="section-title">
                <span>📡</span>
                <span>Hardware & Connection</span>
            </div>
            <p class="section-desc">Real-time status of your ESP8266 gallery lighting system</p>

            <div class="status-card">
                <div class="status-row">
                    <span class="status-key">ESP8266 Controller</span>
                    <span id="statusEspOnline" class="status-val">Checking...</span>
                </div>
                <div class="status-row">
                    <span class="status-key">LED Strip Type</span>
                    <span class="status-val">WS2811 Addressable</span>
                </div>
                <div class="status-row">
                    <span class="status-key">Wiring Count</span>
                    <span class="status-val">48 Pixels (Gallery)</span>
                </div>
                <div class="status-row">
                    <span class="status-key">WiFi SSID</span>
                    <span class="status-val">Airtel_Adhyani</span>
                </div>
                <div class="status-row">
                    <span class="status-key">Active Pattern</span>
                    <span id="statusPatternName" class="status-val">Diwali Diya Flame</span>
                </div>
                <div class="status-row">
                    <span class="status-key">Config Version</span>
                    <span id="statusVersion" class="status-val">v1</span>
                </div>
                <div class="status-row">
                    <span class="status-key">Backend URL</span>
                    <span class="status-val" style="font-size: 11px;">http://www.tinkerstream.com/pixel-led</span>
                </div>
            </div>

            <div class="info-note">
                <strong>🔒 Persistent Memory (EEPROM):</strong><br>
                When your ESP8266 restarts or power goes off, it instantly restores the last active pattern and colors from flash memory without requiring an internet reconnect!
            </div>
        </div>
    </main>

    <!-- Toast Notification Popup -->
    <div id="toastNotice" class="toast-notice">
        Gallery updated ✨
    </div>

    <!-- Fixed Bottom Mobile Navigation Bar -->
    <nav class="bottom-tab-bar">
        <button class="tab-btn active" data-tab="tab-patterns">
            <span class="tab-icon">✨</span>
            <span>Patterns</span>
        </button>
        <button class="tab-btn" data-tab="tab-colors">
            <span class="tab-icon">🎨</span>
            <span>Colors</span>
        </button>
        <button class="tab-btn" data-tab="tab-status">
            <span class="tab-icon">⚙️</span>
            <span>Status</span>
        </button>
    </nav>
</div>

<script src="js/app.js"></script>
</body>
</html>

