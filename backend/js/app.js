/**
 * Diwali Pixel LED WS2811 - Mobile Web Application Engine
 * Renders real-time 48-LED Canvas simulator & syncs with PHP Backend API
 */

const NUM_LEDS = 48;
const API_URL = 'api.php';

// Application State
let appState = {
    power: 1,
    pattern: 0,
    pattern_name: "Diwali Diya Flame",
    brightness: 200,
    speed: 50,
    color1: "#ff7700",
    color2: "#ff0044",
    sparkle: 1,
    version: 1
};

// Patterns Definition (Must match ESP8266 internal IDs)
const PATTERNS = [
    {
        id: 0,
        name: "Diya Flame",
        tag: "Diwali Classic",
        badgeClass: "badge-festive",
        icon: "🔥",
        desc: "Warm flickering golden embers and deep flame ripples across the gallery"
    },
    {
        id: 1,
        name: "Phuljhadi Sparkler",
        tag: "Spectacular",
        badgeClass: "badge-wow",
        icon: "✨",
        desc: "Celebratory festive sparkles dancing dynamically with golden bursts"
    },
    {
        id: 2,
        name: "Rangoli Fireworks",
        tag: "Wow Effect",
        badgeClass: "badge-wow",
        icon: "🎆",
        desc: "Spectacular fireworks bursting outward from center to both ends"
    },
    {
        id: 3,
        name: "Rainbow Comet Chase",
        tag: "Vibrant Flow",
        badgeClass: "badge-smooth",
        icon: "🌈",
        desc: "Ultra-smooth spectrum gradient comets sweeping fluidly with shimmering tail"
    },
    {
        id: 4,
        name: "Meteor Rain Shower",
        tag: "Cinematic",
        badgeClass: "badge-wow",
        icon: "🌠",
        desc: "Blazing shooting stars racing through the gallery with fading light trails"
    },
    {
        id: 5,
        name: "Mystic Aurora Waves",
        tag: "Mesmerizing",
        badgeClass: "badge-smooth",
        icon: "🌌",
        desc: "Gentle breathing auroras blending peacock green, electric violet, and gold"
    },
    {
        id: 6,
        name: "Dual Wave Ripple",
        tag: "Fluid Motion",
        badgeClass: "badge-smooth",
        icon: "🌊",
        desc: "Harmonic oscillation between Color 1 and Color 2 creating 3D waves"
    },
    {
        id: 7,
        name: "Diwali Fireflies (Jugnu)",
        tag: "Organic",
        badgeClass: "badge-festive",
        icon: "🪲",
        desc: "Enchanting wandering glowing fireflies softly breathing on Diwali night"
    },
    {
        id: 8,
        name: "Festive Heartbeat Pulse",
        tag: "Dynamic",
        badgeClass: "badge-festive",
        icon: "💓",
        desc: "Rhythmic festive throb with glowing echoes radiating across the strip"
    },
    {
        id: 9,
        name: "Cyber Neon Run",
        tag: "Modern",
        badgeClass: "badge-wow",
        icon: "⚡",
        desc: "High energy neon pulses flashing along the gallery with motion blur"
    },
    {
        id: 10,
        name: "Royal Gallery Gold",
        tag: "Architectural",
        badgeClass: "badge-ambient",
        icon: "🏛️",
        desc: "Luxurious, warm static architectural illumination for elite gallery aesthetic"
    },
    {
        id: 11,
        name: "Carnival Marquee",
        tag: "Playful",
        badgeClass: "badge-festive",
        icon: "🎪",
        desc: "Traditional theater marquee chase lights with festive dual alternating steps"
    },
    {
        id: 12,
        name: "Color Drop Stacker",
        tag: "Stacker Wow",
        badgeClass: "badge-stack",
        icon: "🧱",
        desc: "One-by-one glowing LEDs drop like a slider with random colors, stacking all 48 pixels"
    },
    {
        id: 13,
        name: "Neon Pixel Chaser",
        tag: "High Speed",
        badgeClass: "badge-chaser",
        icon: "🏎️",
        desc: "High energy multi-head pixel chaser sprinting across the gallery with luminous trails"
    },
    {
        id: 14,
        name: "Solid Single Color",
        tag: "Clean Single",
        badgeClass: "badge-ambient",
        icon: "💡",
        desc: "All 48 LEDs glow uniformly in a single selected color with smooth brightness control"
    }
];

// Single Color Swatches for Quick 1-Tap Setting
const SINGLE_SWATCHES = [
    { name: "Warm Diya", hex: "#ff8c00" },
    { name: "Pure Gold", hex: "#ffd700" },
    { name: "Warm White", hex: "#ffb366" },
    { name: "Pure White", hex: "#ffffff" },
    { name: "Ruby Red", hex: "#e63946" },
    { name: "Rose Pink", hex: "#f72585" },
    { name: "Peacock Teal", hex: "#00f5d4" },
    { name: "Royal Blue", hex: "#3a86ff" },
    { name: "Electric Purple", hex: "#9d4edd" },
    { name: "Emerald", hex: "#2ec4b6" },
    { name: "Sunset Amber", hex: "#fb5607" },
    { name: "Lime Glow", hex: "#70e000" }
];

// Festive Presets
const PRESETS = [
    { name: "Laxmi Puja Gold", sub: "Amber & Saffron", c1: "#ff9100", c2: "#e01a4f", pattern: 0 },
    { name: "Peacock Festival", sub: "Cyan & Gold", c1: "#00f5d4", c2: "#ffb703", pattern: 5 },
    { name: "Phuljhadi Spark", sub: "Golden Fireworks", c1: "#ffc300", c2: "#ffffff", pattern: 1 },
    { name: "Temple Radiance", sub: "Sandalwood & Crimson", c1: "#ff6f00", c2: "#b7094c", pattern: 6 },
    { name: "Cyber Diwali", sub: "Neon Magenta & Purple", c1: "#f72585", c2: "#7209b7", pattern: 9 },
    { name: "Warm Gallery 2400K", sub: "Architectural Warm", c1: "#ffad42", c2: "#ffa024", pattern: 10 }
];

// Virtual LED Strip State for Simulator
let virtualLeds = [];
for (let i = 0; i < NUM_LEDS; i++) {
    virtualLeds.push({ r: 255, g: 119, b: 0 });
}

// State for Color Drop Stacker Simulation (Pattern 12)
let simStackTarget = NUM_LEDS - 1;
let simSliderPos = 0;
let simStackedColors = new Array(NUM_LEDS).fill(null);
let simDropColor = { r: 255, g: 140, b: 0 };
let simStackFlash = 0;

let animFrame = 0;
let saveDebounceTimer = null;
let pollTimer = null;
let canvas, ctx;

// -------------------------------------------------------------
// DOM Elements Initialization
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    canvas = document.getElementById("ledCanvas");
    if (canvas) {
        ctx = canvas.getContext("2d");
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
    }

    renderPatternCards();
    renderPresets();
    renderSingleSwatches();
    setupEventListeners();
    fetchBackendState();

    // Start 60fps real-time visualizer loop
    requestAnimationFrame(renderSimulatorLoop);

    // Poll backend every 4 seconds for ESP8266 status
    pollTimer = setInterval(fetchBackendState, 4000);
});

function resizeCanvas() {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// -------------------------------------------------------------
// Render Pattern Cards
// -------------------------------------------------------------
function renderPatternCards() {
    const container = document.getElementById("patternsContainer");
    if (!container) return;

    container.innerHTML = PATTERNS.map(p => `
        <div class="pattern-card ${appState.pattern === p.id ? 'active' : ''}" data-id="${p.id}" onclick="selectPattern(${p.id})">
            <div class="pattern-icon-box">${p.icon}</div>
            <div class="pattern-details">
                <div class="pattern-title-row">
                    <span class="pattern-name">${p.name}</span>
                    <span class="badge-tag ${p.badgeClass}">${p.tag}</span>
                </div>
                <div class="pattern-desc">${p.desc}</div>
            </div>
            <div class="active-check">✓</div>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// Render Presets
// -------------------------------------------------------------
function renderPresets() {
    const container = document.getElementById("presetsContainer");
    if (!container) return;

    container.innerHTML = PRESETS.map((preset, index) => `
        <div class="preset-chip" onclick="applyPreset(${index})">
            <div class="dual-dots">
                <div class="dot" style="background-color: ${preset.c1};"></div>
                <div class="dot" style="background-color: ${preset.c2};"></div>
            </div>
            <div>
                <div class="preset-chip-name">${preset.name}</div>
                <div class="preset-chip-sub">${preset.sub}</div>
            </div>
        </div>
    `).join('');
}

// -------------------------------------------------------------
// Render Single Color Swatches (1-Tap Solid Single Color)
// -------------------------------------------------------------
function renderSingleSwatches() {
    const container = document.getElementById("singleSwatchesContainer");
    if (!container) return;

    container.innerHTML = SINGLE_SWATCHES.map((swatch, index) => `
        <button class="swatch-btn ${appState.color1.toLowerCase() === swatch.hex.toLowerCase() ? 'active' : ''}" 
                onclick="selectSingleColor('${swatch.hex}', '${swatch.name}')" 
                title="${swatch.name}">
            <div class="swatch-circle" style="background-color: ${swatch.hex};"></div>
            <span class="swatch-name">${swatch.name}</span>
        </button>
    `).join('');
}

function selectSingleColor(hex, name) {
    haptic();
    appState.color1 = hex;
    appState.color2 = hex;
    appState.pattern = 14; // Solid Single Color
    appState.pattern_name = "Solid Single Color";
    if (!appState.power) appState.power = 1;

    updateUI();
    saveStateImmediate();
    showToast(`Solid Color: ${name} (${hex.toUpperCase()}) 💡`);
}

// -------------------------------------------------------------
// Setup Event Listeners
// -------------------------------------------------------------
function setupEventListeners() {
    // Power Toggle
    const powerBtn = document.getElementById("powerBtn");
    powerBtn.addEventListener("click", () => {
        haptic();
        appState.power = appState.power ? 0 : 1;
        updateUI();
        saveStateImmediate();
        showToast(appState.power ? "Gallery Lights ON 💡" : "Gallery Lights OFF 🌙");
    });

    // Brightness Slider
    const brightnessSlider = document.getElementById("brightnessSlider");
    brightnessSlider.addEventListener("input", (e) => {
        appState.brightness = parseInt(e.target.value);
        document.getElementById("brightnessValue").textContent = `${Math.round((appState.brightness / 255) * 100)}%`;
        queueStateSave();
    });

    // Speed Slider
    const speedSlider = document.getElementById("speedSlider");
    speedSlider.addEventListener("input", (e) => {
        appState.speed = parseInt(e.target.value);
        document.getElementById("speedValue").textContent = `${appState.speed}%`;
        queueStateSave();
    });

    // Sparkle Toggle
    const sparkleToggle = document.getElementById("sparkleToggle");
    sparkleToggle.addEventListener("change", (e) => {
        haptic();
        appState.sparkle = e.target.checked ? 1 : 0;
        queueStateSave();
        showToast(appState.sparkle ? "Sparkles Enabled ✨" : "Sparkles Disabled");
    });

    // Color Pickers
    const color1Input = document.getElementById("color1Input");
    color1Input.addEventListener("input", (e) => {
        appState.color1 = e.target.value;
        document.getElementById("color1Preview").style.backgroundColor = appState.color1;
        document.getElementById("color1Hex").textContent = appState.color1.toUpperCase();
        queueStateSave();
    });

    const color2Input = document.getElementById("color2Input");
    color2Input.addEventListener("input", (e) => {
        appState.color2 = e.target.value;
        document.getElementById("color2Preview").style.backgroundColor = appState.color2;
        document.getElementById("color2Hex").textContent = appState.color2.toUpperCase();
        queueStateSave();
    });

    // Apply Solid Color Button
    const applySolidBtn = document.getElementById("applySolidBtn");
    if (applySolidBtn) {
        applySolidBtn.addEventListener("click", () => {
            haptic();
            appState.color2 = appState.color1;
            appState.pattern = 14;
            appState.pattern_name = "Solid Single Color";
            if (!appState.power) appState.power = 1;
            updateUI();
            saveStateImmediate();
            showToast(`Solid color applied to entire gallery! 💡`);
        });
    }

    // Tab Navigation
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            haptic();
            const targetTab = btn.getAttribute("data-tab");
            
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
            const targetPane = document.getElementById(targetTab);
            if (targetPane) targetPane.classList.add("active");
        });
    });
}

// -------------------------------------------------------------
// Pattern Selection & Preset Actions
// -------------------------------------------------------------
function selectPattern(id) {
    haptic();
    appState.pattern = id;
    const pat = PATTERNS.find(p => p.id === id);
    if (pat) appState.pattern_name = pat.name;
    
    // Auto turn power on if off
    if (!appState.power) appState.power = 1;

    updateUI();
    saveStateImmediate();
    showToast(`Pattern: ${appState.pattern_name} ✨`);
}

function applyPreset(index) {
    haptic();
    const preset = PRESETS[index];
    if (!preset) return;

    appState.color1 = preset.c1;
    appState.color2 = preset.c2;
    appState.pattern = preset.pattern;
    const pat = PATTERNS.find(p => p.id === preset.pattern);
    if (pat) appState.pattern_name = pat.name;
    if (!appState.power) appState.power = 1;

    updateUI();
    saveStateImmediate();
    showToast(`Preset: ${preset.name} applied 🪔`);
}

// -------------------------------------------------------------
// UI Synchronizer
// -------------------------------------------------------------
function updateUI() {
    // Power button
    const powerBtn = document.getElementById("powerBtn");
    if (appState.power) {
        powerBtn.classList.add("on");
    } else {
        powerBtn.classList.remove("on");
    }

    // Sliders
    const brightnessSlider = document.getElementById("brightnessSlider");
    brightnessSlider.value = appState.brightness;
    document.getElementById("brightnessValue").textContent = `${Math.round((appState.brightness / 255) * 100)}%`;

    const speedSlider = document.getElementById("speedSlider");
    speedSlider.value = appState.speed;
    document.getElementById("speedValue").textContent = `${appState.speed}%`;

    // Sparkle
    document.getElementById("sparkleToggle").checked = (appState.sparkle === 1);

    // Color Pickers
    document.getElementById("color1Input").value = appState.color1;
    document.getElementById("color1Preview").style.backgroundColor = appState.color1;
    document.getElementById("color1Hex").textContent = appState.color1.toUpperCase();

    document.getElementById("color2Input").value = appState.color2;
    document.getElementById("color2Preview").style.backgroundColor = appState.color2;
    document.getElementById("color2Hex").textContent = appState.color2.toUpperCase();

    // Active Card
    document.querySelectorAll(".pattern-card").forEach(card => {
        const id = parseInt(card.getAttribute("data-id"));
        if (id === appState.pattern) {
            card.classList.add("active");
        } else {
            card.classList.remove("active");
        }
    });

    // Update Swatch Active Rings
    renderSingleSwatches();

    // Status Tab Info
    const statusPat = document.getElementById("statusPatternName");
    if (statusPat) statusPat.textContent = appState.pattern_name;
    const statusVer = document.getElementById("statusVersion");
    if (statusVer) statusVer.textContent = `v${appState.version}`;
}

// -------------------------------------------------------------
// Backend API Communication
// -------------------------------------------------------------
async function fetchBackendState() {
    try {
        const res = await fetch(`${API_URL}?action=get&t=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status === "success" && data.state) {
            // Update online badge
            const badge = document.getElementById("espStatusBadge");
            const statusEspText = document.getElementById("statusEspOnline");
            
            if (data.esp_online) {
                badge.className = "status-badge online";
                badge.innerHTML = `<span class="status-dot"></span> Gallery Online`;
                if (statusEspText) statusEspText.innerHTML = `<span style="color: #10b981;">Online (Active)</span>`;
            } else {
                badge.className = "status-badge offline";
                const sec = data.esp_last_seen_sec_ago;
                const timeText = sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`;
                badge.innerHTML = `<span class="status-dot"></span> Offline (${timeText})`;
                if (statusEspText) statusEspText.innerHTML = `<span style="color: #94a3b8;">Offline (${timeText})</span>`;
            }

            // Sync state if newer version and not actively user-editing
            if (data.state.version > appState.version && !saveDebounceTimer && !isSaving) {
                appState = { ...appState, ...data.state };
                updateUI();
            }
        }
    } catch (e) {
        console.warn("Backend fetch error:", e);
    }
}

let isSaving = false;

async function saveStateImmediate() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = null;
    isSaving = true;
    try {
        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(appState)
        });
        const data = await res.json();
        if (data.status === "success" && data.state) {
            appState.version = data.state.version;
            const statusVer = document.getElementById("statusVersion");
            if (statusVer) statusVer.textContent = `v${appState.version}`;
        }
    } catch (e) {
        console.error("Save error:", e);
    } finally {
        setTimeout(() => { isSaving = false; }, 400);
    }
}

function queueStateSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
        saveDebounceTimer = null;
        isSaving = true;
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(appState)
            });
            const data = await res.json();
            if (data.status === "success" && data.state) {
                appState.version = data.state.version;
                const statusVer = document.getElementById("statusVersion");
                if (statusVer) statusVer.textContent = `v${appState.version}`;
            }
        } catch (e) {
            console.error("Save error:", e);
        } finally {
            setTimeout(() => { isSaving = false; }, 400);
        }
    }, 250);
}

// -------------------------------------------------------------
// Real-Time 48-Pixel LED Simulation (Canvas Rendering)
// -------------------------------------------------------------
function hexToRgb(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const num = parseInt(c, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function hsvToRgb(h, s, v) {
    let r, g, b;
    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function blend(c1, c2, ratio) {
    return {
        r: Math.round(c1.r + (c2.r - c1.r) * ratio),
        g: Math.round(c1.g + (c2.g - c1.g) * ratio),
        b: Math.round(c1.b + (c2.b - c1.b) * ratio)
    };
}

function renderSimulatorLoop() {
    animFrame++;
    const t = animFrame * (appState.speed / 50) * 0.04;
    const c1 = hexToRgb(appState.color1);
    const c2 = hexToRgb(appState.color2);

    if (!appState.power) {
        // Lights OFF
        for (let i = 0; i < NUM_LEDS; i++) {
            virtualLeds[i] = { r: 10, g: 10, b: 15 };
        }
    } else {
        // Pattern Algorithm Simulation
        switch (appState.pattern) {
            case 0: // Diya Flame
                for (let i = 0; i < NUM_LEDS; i++) {
                    const flicker = Math.sin(t * 3 + i * 0.8) * 0.35 + Math.sin(t * 7 + i * 2.1) * 0.2 + 0.45;
                    const r = Math.min(255, Math.floor(c1.r * (0.65 + flicker * 0.4)));
                    const g = Math.min(255, Math.floor(c1.g * (0.4 + flicker * 0.5)));
                    const b = Math.floor(c2.b * 0.15);
                    virtualLeds[i] = { r, g, b };
                }
                break;

            case 1: // Phuljhadi Sparkler
                for (let i = 0; i < NUM_LEDS; i++) {
                    let base = blend(c1, c2, (Math.sin(t + i * 0.2) + 1) / 2);
                    if (Math.random() > 0.85) {
                        base = { r: 255, g: 255, b: 240 }; // spark
                    }
                    virtualLeds[i] = base;
                }
                break;

            case 2: // Rangoli Fireworks
                const burstPos = (t * 1.5) % 3;
                for (let i = 0; i < NUM_LEDS; i++) {
                    const distFromCenter = Math.abs(i - 23.5) / 24;
                    const wave = Math.max(0, 1 - Math.abs(distFromCenter - (burstPos % 1.2)) * 4);
                    virtualLeds[i] = blend(c1, c2, wave);
                    if (wave > 0.7 && Math.random() > 0.7) {
                        virtualLeds[i] = { r: 255, g: 255, b: 255 };
                    }
                }
                break;

            case 3: // Rainbow Comet Chase
                for (let i = 0; i < NUM_LEDS; i++) {
                    const hue = ((i * 360 / NUM_LEDS) + (t * 120)) % 360;
                    virtualLeds[i] = hsvToRgb(hue / 360, 0.95, 1.0);
                }
                break;

            case 4: // Meteor Rain Shower
                const head = Math.floor((t * 22) % (NUM_LEDS + 16));
                for (let i = 0; i < NUM_LEDS; i++) {
                    const dist = head - i;
                    if (dist >= 0 && dist < 12) {
                        const falloff = 1 - (dist / 12);
                        if (dist === 0) {
                            virtualLeds[i] = { r: 255, g: 255, b: 255 };
                        } else {
                            virtualLeds[i] = {
                                r: Math.round(c1.r * falloff),
                                g: Math.round(c1.g * falloff),
                                b: Math.round(c1.b * falloff)
                            };
                        }
                    } else {
                        virtualLeds[i] = { r: 4, g: 4, b: 12 };
                    }
                }
                break;

            case 5: // Mystic Aurora Waves
                for (let i = 0; i < NUM_LEDS; i++) {
                    const wave1 = Math.sin(t * 1.2 + i * 0.15);
                    const wave2 = Math.cos(t * 0.8 + i * 0.25);
                    const blendVal = (wave1 + wave2 + 2) / 4;
                    virtualLeds[i] = blend(c1, c2, blendVal);
                }
                break;

            case 6: // Dual Wave Ripple
                for (let i = 0; i < NUM_LEDS; i++) {
                    const wave = (Math.sin(t * 2.5 + i * 0.35) + 1) / 2;
                    virtualLeds[i] = blend(c1, c2, wave);
                }
                break;

            case 7: // Diwali Fireflies (Jugnu)
                for (let i = 0; i < NUM_LEDS; i++) {
                    const glow = Math.pow((Math.sin(t * 1.8 + i * 1.7) + 1) / 2, 4);
                    virtualLeds[i] = {
                        r: Math.round(c1.r * glow),
                        g: Math.round(c1.g * glow),
                        b: Math.round(c1.b * glow)
                    };
                }
                break;

            case 8: // Festive Heartbeat Pulse
                const beat = Math.pow(Math.sin(t * 3), 6);
                for (let i = 0; i < NUM_LEDS; i++) {
                    const ripple = Math.sin(t * 3 - (i * 0.15));
                    const intensity = Math.max(0.1, beat * 0.7 + ripple * 0.3);
                    virtualLeds[i] = {
                        r: Math.round(c1.r * intensity),
                        g: Math.round(c1.g * intensity),
                        b: Math.round(c1.b * intensity)
                    };
                }
                break;

            case 9: // Cyber Neon Run
                const runner = Math.floor((t * 28) % NUM_LEDS);
                for (let i = 0; i < NUM_LEDS; i++) {
                    if (Math.abs(i - runner) <= 2) {
                        virtualLeds[i] = c2;
                    } else {
                        virtualLeds[i] = {
                            r: Math.round(c1.r * 0.25),
                            g: Math.round(c1.g * 0.25),
                            b: Math.round(c1.b * 0.25)
                        };
                    }
                }
                break;

            case 10: // Royal Gallery Gold (Static Architectural)
                for (let i = 0; i < NUM_LEDS; i++) {
                    virtualLeds[i] = c1;
                }
                break;

            case 11: // Carnival Marquee
                const step = Math.floor(t * 5) % 3;
                for (let i = 0; i < NUM_LEDS; i++) {
                    if ((i + step) % 3 === 0) {
                        virtualLeds[i] = c1;
                    } else {
                        virtualLeds[i] = {
                            r: Math.round(c2.r * 0.2),
                            g: Math.round(c2.g * 0.2),
                            b: Math.round(c2.b * 0.2)
                        };
                    }
                }
                break;

            case 12: // Color Drop Stacker (Tetris/Slider random color drops)
                const stepRate = Math.max(1, Math.floor(5 - (appState.speed / 25)));
                if (animFrame % stepRate === 0) {
                    if (simStackFlash > 0) {
                        simStackFlash--;
                        if (simStackFlash === 0) {
                            simStackTarget = NUM_LEDS - 1;
                            simSliderPos = 0;
                            simStackedColors.fill(null);
                            simDropColor = hsvToRgb(Math.random(), 0.95, 1.0);
                        }
                    } else {
                        simSliderPos++;
                        if (simSliderPos >= simStackTarget) {
                            simStackedColors[simStackTarget] = simDropColor;
                            simStackTarget--;
                            simSliderPos = 0;
                            simDropColor = hsvToRgb(Math.random(), 0.95, 1.0); // Next random color
                            if (simStackTarget < 0) {
                                simStackFlash = 45; // All 48 stacked! Celebratory flash
                            }
                        }
                    }
                }

                if (simStackFlash > 0) {
                    for (let i = 0; i < NUM_LEDS; i++) {
                        const h = ((i * 360 / NUM_LEDS) + (animFrame * 12)) % 360;
                        virtualLeds[i] = hsvToRgb(h / 360, 0.9, 1.0);
                    }
                } else {
                    for (let i = 0; i < NUM_LEDS; i++) {
                        if (i === simSliderPos) {
                            virtualLeds[i] = { r: 255, g: 255, b: 255 }; // Bright slider head
                        } else if (simStackedColors[i] !== null) {
                            virtualLeds[i] = simStackedColors[i]; // Stacked random color
                        } else {
                            virtualLeds[i] = { r: 4, g: 4, b: 8 };
                        }
                    }
                }
                break;

            case 13: // Neon Pixel Chaser
                const cHead1 = Math.floor((t * 26) % NUM_LEDS);
                const cHead2 = (cHead1 + Math.floor(NUM_LEDS / 2)) % NUM_LEDS;
                for (let i = 0; i < NUM_LEDS; i++) {
                    const d1 = (cHead1 - i + NUM_LEDS) % NUM_LEDS;
                    const d2 = (cHead2 - i + NUM_LEDS) % NUM_LEDS;
                    if (d1 < 7) {
                        const falloff = 1 - (d1 / 7);
                        virtualLeds[i] = (d1 === 0) ? { r: 255, g: 255, b: 255 } : blend(c1, { r: 255, g: 255, b: 255 }, falloff * 0.6);
                    } else if (d2 < 7) {
                        const falloff = 1 - (d2 / 7);
                        virtualLeds[i] = (d2 === 0) ? { r: 255, g: 255, b: 255 } : blend(c2, { r: 255, g: 255, b: 255 }, falloff * 0.6);
                    } else {
                        virtualLeds[i] = { r: 4, g: 4, b: 10 };
                    }
                }
                break;

            case 14: // Solid Single Color
                for (let i = 0; i < NUM_LEDS; i++) {
                    virtualLeds[i] = c1;
                }
                break;

            default:
                for (let i = 0; i < NUM_LEDS; i++) {
                    virtualLeds[i] = c1;
                }
        }

        // Apply Sparkle Overlay if active
        if (appState.sparkle && Math.random() > 0.8) {
            const sparkleIdx = Math.floor(Math.random() * NUM_LEDS);
            virtualLeds[sparkleIdx] = { r: 255, g: 255, b: 255 };
        }
    }

    drawLedsOnCanvas();
    requestAnimationFrame(renderSimulatorLoop);
}

function drawLedsOnCanvas() {
    if (!ctx || !canvas) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    const bMult = (appState.brightness / 255);
    const spacing = width / NUM_LEDS;
    const radius = Math.max(2.5, Math.min(5, spacing * 0.38));
    const centerY = height / 2;

    for (let i = 0; i < NUM_LEDS; i++) {
        const x = spacing * i + spacing / 2;
        const led = virtualLeds[i];
        const r = Math.min(255, Math.floor(led.r * bMult));
        const g = Math.min(255, Math.floor(led.g * bMult));
        const b = Math.min(255, Math.floor(led.b * bMult));

        if (appState.power && (r + g + b > 20)) {
            // LED Glow halo
            const glowGradient = ctx.createRadialGradient(x, centerY, 1, x, centerY, radius * 3.5);
            glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
            glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.25)`);
            glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, centerY, radius * 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // LED Bulb core
        ctx.beginPath();
        ctx.arc(x, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();

        // Inner specular lens highlight
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, centerY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
        ctx.fill();
    }
}

// -------------------------------------------------------------
// Utilities
// -------------------------------------------------------------
function showToast(text) {
    const toast = document.getElementById("toastNotice");
    if (!toast) return;
    toast.innerHTML = text;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function haptic() {
    if (navigator.vibrate) {
        navigator.vibrate(25);
    }
}

