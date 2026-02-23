<?php
/**
 * Script standalone para resetar senhas no banco
 * Execute: php reset_senhas.php
 * 
 * NÃO precisa do Laravel rodando, acessa o MySQL diretamente.
 */

// ── Configuração ── ajuste se necessário
$host   = '127.0.0.1';
$db     = 'babel_escola';
$user   = 'root';
$pass   = '';          // vazio no XAMPP padrão
$nova_senha = 'Babel@2025';

echo "\n";
echo "┌──────────────────────────────────────────────────────┐\n";
echo "│         BABEL - Reset de Senhas dos Usuários         │\n";
echo "└──────────────────────────────────────────────────────┘\n\n";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "  ✓ Conectado ao banco: $db\n\n";
} catch (Exception $e) {
    echo "  ✗ Erro de conexão: " . $e->getMessage() . "\n";
    echo "  Verifique \$host, \$db, \$user e \$pass no topo do script.\n\n";
    exit(1);
}

// Gerar hash
$hash = password_hash($nova_senha, PASSWORD_BCRYPT, ['cost' => 12]);
echo "  Senha:  $nova_senha\n";
echo "  Hash:   $hash\n\n";

// Verificar hash
$ok = password_verify($nova_senha, $hash);
echo "  Verificação local: " . ($ok ? "✓ VÁLIDO" : "✗ INVÁLIDO") . "\n\n";

if (!$ok) {
    echo "  Erro: hash inválido, abortando.\n";
    exit(1);
}

// Buscar todos os usuários
$stmt = $pdo->query("SELECT id, nome, email FROM usuarios ORDER BY id");
$usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($usuarios)) {
    echo "  ✗ Nenhum usuário encontrado na tabela 'usuarios'.\n";
    exit(1);
}

echo "  Atualizando " . count($usuarios) . " usuário(s)...\n\n";

$update = $pdo->prepare("UPDATE usuarios SET senha = ? WHERE id = ?");

foreach ($usuarios as $u) {
    $update->execute([$hash, $u['id']]);
    echo "  ✓ #{$u['id']} {$u['nome']} ({$u['email']})\n";
}

echo "\n";
echo "  ✓ Todas as senhas foram atualizadas para: $nova_senha\n\n";
echo "  Agora teste o login em: http://localhost:5173\n";
echo "  E-mail: admin@babel.edu.br\n";
echo "  Senha:  $nova_senha\n\n";

