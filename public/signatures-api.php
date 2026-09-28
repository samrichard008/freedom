<?php
/**
 * 5 Million Signature Petition - cPanel MySQL API Bridge
 *
 * This file allows your Vercel web application to connect safely to your cPanel MySQL Database.
 * This completely bypasses port 3306 firewall blocks because it runs locally.
 *
 * INSTRUCTIONS FOR YOU (மச்சானுக்கான விளக்கம்):
 * 1. Download this file (signatures-api.php).
 * 2. Upload this file directly inside your cPanel "public_html" folder using cPanel File Manager.
 * 3. Make sure your database, username, and password are correct below.
 * 4. That's it! Your Vercel app will now automatically save signatures to your cPanel MySQL database.
 */

// Allow cross-origin requests from your Vercel app
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// MySQL cPanel Database Connection Details
$host = 'localhost'; // Since this script runs on the same server, localhost is 100% open and fast!
$db   = 'oneplane_freedom';
$user = 'oneplane_freedom';
$pass = '19850108@ASDasd';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     echo json_encode(["success" => false, "error" => "cPanel MySQL connection failed: " . $e->getMessage()]);
     exit;
}

// 1. Auto-create 'signatures' table if it doesn't exist (Sri Lankan names support UTF8mb4 Sinhala/Tamil)
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS signatures (
      id VARCHAR(50) PRIMARY KEY,
      full_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      nic VARCHAR(50) UNIQUE NOT NULL,
      phone VARCHAR(50) NOT NULL,
      district VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
      comment TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      signature_data_url LONGTEXT,
      created_at VARCHAR(50) NOT NULL,
      verified BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
} catch (\PDOException $e) {
    // Ignore errors if already setup
}

$method = $_SERVER['REQUEST_METHOD'];

// Handle Signature Query / GET Request
if ($method === 'GET') {
    // 1. Check if we want to run the Bunny Storage Import Action
    if (isset($_GET['action']) && $_GET['action'] === 'import_bunny') {
        $bunny_url = 'https://sg.storage.bunnycdn.com/gnanasara-petition/signatures.json';
        $access_key = 'e09085cd-4065-4aa7-a543641e2577-a063-4a05';
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $bunny_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'AccessKey: ' . $access_key,
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$response) {
            echo json_encode(["success" => false, "error" => "Failed to fetch signatures from Bunny CDN. HTTP Status: " . $httpCode]);
            exit;
        }
        
        $signatures = json_decode($response, true);
        if (!is_array($signatures)) {
            echo json_encode(["success" => false, "error" => "Invalid JSON data from Bunny CDN."]);
            exit;
        }
        
        $imported = 0;
        $skipped = 0;
        
        // Prepare INSERT query using ON DUPLICATE KEY UPDATE to avoid crashes/duplicates
        $stmt = $pdo->prepare('INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id');
        
        $pdo->beginTransaction();
        try {
            foreach ($signatures as $sig) {
                $id = $sig['id'] ?? '';
                $fullName = $sig['fullName'] ?? '';
                $nic = strtoupper(trim($sig['nic'] ?? ''));
                $phone = $sig['phone'] ?? '';
                $district = $sig['district'] ?? '';
                $comment = $sig['comment'] ?? '';
                $signatureDataUrl = $sig['signatureDataUrl'] ?? null;
                $createdAt = $sig['createdAt'] ?? date('c');
                $verified = isset($sig['verified']) ? ($sig['verified'] ? 1 : 0) : 1;
                
                if (!$id || !$nic) {
                    $skipped++;
                    continue;
                }
                
                $stmt->execute([$id, $fullName, $nic, $phone, $district, $comment, $signatureDataUrl, $createdAt, $verified]);
                $imported++;
            }
            $pdo->commit();
            echo json_encode(["success" => true, "message" => "Migration complete!", "imported" => $imported, "skipped" => $skipped]);
            exit;
        } catch (\Exception $e) {
            $pdo->rollBack();
            echo json_encode(["success" => false, "error" => "Database transaction failed: " . $e->getMessage()]);
            exit;
        }
    }
    
    // 2. Check if we want to get database status count
    if (isset($_GET['action']) && $_GET['action'] === 'count') {
        try {
            $stmt = $pdo->query('SELECT COUNT(*) as total FROM signatures');
            $row = $stmt->fetch();
            echo json_encode(["success" => true, "total_signatures" => intval($row['total'] ?? 0)]);
            exit;
        } catch (\PDOException $e) {
            echo json_encode(["success" => false, "error" => $e->getMessage()]);
            exit;
        }
    }

    // Default GET: Fetch signatures
    try {
        $stmt = $pdo->query('SELECT id, full_name as fullName, nic, phone, district, comment, signature_data_url as signatureDataUrl, created_at as createdAt, verified FROM signatures ORDER BY created_at DESC');
        $rows = $stmt->fetchAll();
        
        // Ensure verified field is boolean
        foreach ($rows as &$row) {
            $row['verified'] = (bool)$row['verified'];
        }
        
        echo json_encode(["success" => true, "signatures" => $rows]);
    } catch (\PDOException $e) {
        echo json_encode(["success" => false, "error" => "Fetch failed: " . $e->getMessage()]);
    }
} 
// Handle Adding Signature / POST Request
elseif ($method === 'POST') {
    // Read JSON body
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    if (!$input) {
        echo json_encode(["success" => false, "error" => "Invalid JSON input."]);
        exit;
    }
    
    // Secure API key validation to make sure nobody else can write to your DB
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';
    
    if ($authHeader !== 'Bearer 5m_sig_petition_key_2026') {
        echo json_encode(["success" => false, "error" => "Unauthorized connection request."]);
        exit;
    }

    $id = $input['id'] ?? '';
    $fullName = trim($input['fullName'] ?? '');
    $nic = strtoupper(trim($input['nic'] ?? ''));
    $phone = trim($input['phone'] ?? '');
    $district = trim($input['district'] ?? '');
    $comment = trim($input['comment'] ?? '');
    $signatureDataUrl = $input['signatureDataUrl'] ?? '';
    $createdAt = $input['createdAt'] ?? date('c');
    $verified = isset($input['verified']) ? ($input['verified'] ? 1 : 0) : 1;

    if (!$fullName || !$nic || !$phone || !$district) {
        echo json_encode(["success" => false, "error" => "Required data fields are missing."]);
        exit;
    }

    try {
        // Double check duplicate NIC to avoid database index crashes
        $stmt = $pdo->prepare('SELECT id FROM signatures WHERE UPPER(nic) = ?');
        $stmt->execute([$nic]);
        if ($stmt->fetch()) {
            echo json_encode(["success" => false, "error" => "මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition."]);
            exit;
        }

        // Insert
        $stmt = $pdo->prepare('INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $fullName, $nic, $phone, $district, $comment, $signatureDataUrl, $createdAt, $verified]);
        
        echo json_encode(["success" => true, "message" => "Signature successfully saved to cPanel MySQL!"]);
    } catch (\PDOException $e) {
        if ($e->getCode() == 23000) {
            echo json_encode(["success" => false, "error" => "මෙම ජාතික හැඳුනුම්පත් අංකයෙන් (NIC) දැනටමත් මෙම පෙත්සම අත්සන් කර ඇත / This NIC has already signed this petition."]);
        } else {
            echo json_encode(["success" => false, "error" => "Database write error: " . $e->getMessage()]);
        }
    }
} else {
    echo json_encode(["success" => false, "error" => "Request method not supported."]);
}
