<?php
/**
 * Diwali Pixel LED WS2811 - Backend REST API
 * Hosted at: http://www.tinkerstream.com/pixel-led/api.php
 * Handles synchronization between Mobile Web Application and ESP8266 controller.
 * Compatible with PHP 5.6 through PHP 8.3+
 */

// Suppress raw post deprecation notices on legacy PHP 5.6 installations
@ini_set('display_errors', 0);
@ini_set('always_populate_raw_post_data', -1);
error_reporting(0);

// Enable CORS for mobile web app cross-origin access and testing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$stateFile = __DIR__ . '/state.json';

// Default state if state.json does not exist
$defaultState = array(
    "power" => 1,                 // 1 = ON, 0 = OFF
    "pattern" => 0,               // 0 to 14 (Pattern ID)
    "pattern_name" => "Diwali Diya Flame",
    "brightness" => 200,          // 0 to 255
    "speed" => 50,                // 1 to 100
    "color1" => "#ff7700",        // Primary Festive Amber/Diya
    "color2" => "#ff0044",        // Secondary Crimson
    "sparkle" => 1,               // 0 or 1
    "reverse" => 0,               // 0 = Normal, 1 = Reversed Flow
    "random_colors" => 0,         // 1 = Backend Auto-Cycle Random Colors on every poll/pulse
    "last_random_cycle" => 0,     // Timestamp of last random color change
    "updated_at" => time(),
    "last_esp_seen" => 0,
    "version" => 1
);

/**
 * Load state safely from file
 */
function loadState($filePath, $defaults) {
    if (!file_exists($filePath)) {
        file_put_contents($filePath, json_encode($defaults));
        return $defaults;
    }
    $content = @file_get_contents($filePath);
    $data = @json_decode($content, true);
    if (!is_array($data)) {
        return $defaults;
    }
    return array_merge($defaults, $data);
}

/**
 * Save state atomically
 */
function saveState($filePath, $data) {
    $tempFile = $filePath . '.tmp.' . uniqid();
    $jsonData = json_encode($data);
    if (file_put_contents($tempFile, $jsonData) !== false) {
        if (@rename($tempFile, $filePath)) {
            return true;
        }
    }
    @unlink($tempFile);
    return file_put_contents($filePath, $jsonData) !== false;
}

$state = loadState($stateFile, $defaultState);
$action = isset($_GET['action']) ? trim($_GET['action']) : '';

// -------------------------------------------------------------
// ACTION: ESP8266 or Web Client Fetch State (GET)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET' || $action === 'get') {
    $client = isset($_GET['client']) ? trim($_GET['client']) : '';
    
    // If ESP8266 is polling, update its last-seen timestamp
    if ($client === 'esp' || isset($_GET['esp'])) {
        $state['last_esp_seen'] = time();
        saveState($stateFile, $state);
    }

    // Backend-driven Random Color Flasher:
    // Dynamically cycles Color 1 & Color 2 every 2 seconds without needing an ESP reflash!
    $isRandomMode = !empty($state['random_colors']);
    if ($isRandomMode) {
        $now = time();
        $lastCycle = isset($state['last_random_cycle']) ? (int)$state['last_random_cycle'] : 0;
        if (($now - $lastCycle) >= 2) {
            $festivePalette = array(
                "#ff0055", "#00f5d4", "#ffb703", "#7b2cbf", "#ff5400", 
                "#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#7209b7", 
                "#f72585", "#4cc9f0", "#ff007f", "#3a86ff", "#ff9e00"
            );
            $k1 = array_rand($festivePalette);
            $k2 = array_rand($festivePalette);
            if ($k1 === $k2) {
                $k2 = ($k1 + 1) % count($festivePalette);
            }
            $state['color1'] = $festivePalette[$k1];
            $state['color2'] = $festivePalette[$k2];
            $state['last_random_cycle'] = $now;
            $state['version'] = ((int)$state['version']) + 1;
            $state['updated_at'] = $now;
            saveState($stateFile, $state);
        }
    }

    $lastSeen = isset($state['last_esp_seen']) ? (int)$state['last_esp_seen'] : 0;
    $isEspOnline = (time() - $lastSeen) <= 15;
    
    echo json_encode(array(
        "status" => "success",
        "esp_online" => $isEspOnline,
        "esp_last_seen_sec_ago" => (time() - $lastSeen),
        "server_time" => time(),
        "state" => array(
            "power" => isset($state['power']) ? (int)$state['power'] : 1,
            "pattern" => isset($state['pattern']) ? (int)$state['pattern'] : 0,
            "pattern_name" => isset($state['pattern_name']) ? $state['pattern_name'] : "Diwali Diya Flame",
            "brightness" => isset($state['brightness']) ? (int)$state['brightness'] : 200,
            "speed" => isset($state['speed']) ? (int)$state['speed'] : 50,
            "color1" => isset($state['color1']) ? $state['color1'] : "#ff7700",
            "color2" => isset($state['color2']) ? $state['color2'] : "#ff0044",
            "sparkle" => isset($state['sparkle']) ? (int)$state['sparkle'] : 1,
            "reverse" => isset($state['reverse']) ? (int)$state['reverse'] : 0,
            "random_colors" => isset($state['random_colors']) ? (int)$state['random_colors'] : 0,
            "version" => isset($state['version']) ? (int)$state['version'] : 1,
            "updated_at" => isset($state['updated_at']) ? (int)$state['updated_at'] : time()
        )
    ));
    exit();
}

// -------------------------------------------------------------
// ACTION: Update State (POST)
// -------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $action === 'set') {
    $rawInput = file_get_contents('php://input');
    $payload = @json_decode($rawInput, true);

    if (!$payload && !empty($_POST)) {
        $payload = $_POST;
    }

    if (!is_array($payload)) {
        http_response_code(400);
        echo json_encode(array("status" => "error", "message" => "Invalid JSON payload"));
        exit();
    }

    $changed = false;

    if (isset($payload['power'])) {
        $state['power'] = $payload['power'] ? 1 : 0;
        $changed = true;
    }
    if (isset($payload['pattern'])) {
        $state['pattern'] = max(0, min(30, (int)$payload['pattern']));
        $changed = true;
    }
    if (isset($payload['pattern_name'])) {
        $state['pattern_name'] = substr(strip_tags((string)$payload['pattern_name']), 0, 60);
    }
    if (isset($payload['brightness'])) {
        $state['brightness'] = max(0, min(255, (int)$payload['brightness']));
        $changed = true;
    }
    if (isset($payload['speed'])) {
        $state['speed'] = max(1, min(100, (int)$payload['speed']));
        $changed = true;
    }
    if (isset($payload['color1'])) {
        $c1 = trim((string)$payload['color1']);
        if (preg_match('/^#[a-fA-F0-9]{6}$/', $c1)) {
            $state['color1'] = strtolower($c1);
            $changed = true;
        }
    }
    if (isset($payload['color2'])) {
        $c2 = trim((string)$payload['color2']);
        if (preg_match('/^#[a-fA-F0-9]{6}$/', $c2)) {
            $state['color2'] = strtolower($c2);
            $changed = true;
        }
    }
    if (isset($payload['sparkle'])) {
        $state['sparkle'] = $payload['sparkle'] ? 1 : 0;
        $changed = true;
    }
    if (isset($payload['reverse'])) {
        $state['reverse'] = $payload['reverse'] ? 1 : 0;
        $changed = true;
    }
    if (isset($payload['random_colors'])) {
        $state['random_colors'] = $payload['random_colors'] ? 1 : 0;
        if ($state['random_colors'] == 1) {
            $festivePalette = array(
                "#ff0055", "#00f5d4", "#ffb703", "#7b2cbf", "#ff5400", 
                "#06d6a0", "#118ab2", "#ef476f", "#ffd166", "#7209b7", 
                "#f72585", "#4cc9f0", "#ff007f", "#3a86ff", "#00ff88", "#ff3300"
            );
            $k1 = array_rand($festivePalette);
            $k2 = ($k1 + 4) % count($festivePalette);
            $state['color1'] = $festivePalette[$k1];
            $state['color2'] = $festivePalette[$k2];
            $state['last_random_cycle'] = time();
        }
        $changed = true;
    }

    if ($changed) {
        $currentVersion = isset($state['version']) ? (int)$state['version'] : 0;
        $state['version'] = $currentVersion + 1;
        $state['updated_at'] = time();
        saveState($stateFile, $state);
    }

    $lastSeen = isset($state['last_esp_seen']) ? (int)$state['last_esp_seen'] : 0;
    $isEspOnline = (time() - $lastSeen) <= 15;

    echo json_encode(array(
        "status" => "success",
        "message" => "Gallery LED pattern updated successfully",
        "esp_online" => $isEspOnline,
        "state" => $state
    ));
    exit();
}

http_response_code(405);
echo json_encode(array("status" => "error", "message" => "Method not supported"));
