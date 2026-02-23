# Babel – Backend (Laravel 11)

## Requisitos
- PHP 8.2+
- Composer
- MySQL 8.0+

## Instalação

```bash
cd babel/backend

# 1. Instalar dependências
composer install

# 2. Configurar variáveis de ambiente
cp .env.example .env
php artisan key:generate

# 3. Configurar banco de dados no .env
# DB_DATABASE=babel_escola
# DB_USERNAME=seu_usuario
# DB_PASSWORD=sua_senha

# 4. Executar migrations
php artisan migrate

# 5. Executar seeds (dados de demonstração)
php artisan db:seed

# 6. Iniciar servidor
php artisan serve --port=8000
```

A API estará disponível em: http://localhost:8000/api

## Estrutura de Endpoints

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | /api/auth/login | Login |
| GET  | /api/auth/me | Dados do usuário logado |
| POST | /api/auth/logout | Logout |

### Módulos principais (requerem Bearer token)
- **GET/POST** `/api/alunos` – Listagem e cadastro
- **GET/PUT** `/api/alunos/{id}` – Detalhes e edição
- **GET** `/api/alunos/{id}/boletim` – Boletim completo
- **GET/POST** `/api/turmas` – Turmas
- **GET/POST** `/api/matriculas` – Matrículas
- **GET/POST** `/api/notas/lancar` – Lançamento de notas
- **GET/POST** `/api/frequencia/lancar` – Frequência
- **GET** `/api/financeiro/resumo` – Resumo financeiro
- **GET** `/api/financeiro/inadimplentes` – Inadimplentes
- **POST** `/api/financeiro/recebimento` – Registrar pagamento
- **GET** `/api/comunicados` – Comunicados
- **GET/POST** `/api/mensagens` – Mensagens internas
- **GET** `/api/dashboard/admin` – Dashboard administrativo

## Perfis e Permissões

| Perfil | Acesso |
|--------|--------|
| admin | Acesso total |
| secretaria | Alunos, matrículas, turmas, financeiro |
| coordenacao | Turmas, notas (leitura), frequência (leitura) |
| professor | Lançar notas e frequência das próprias turmas |
| responsavel | Boletim e frequência dos próprios filhos |
| aluno | Próprio boletim |

## Testes

```bash
# Rodar todos os testes
php artisan test
# ou
./vendor/bin/pest
```
