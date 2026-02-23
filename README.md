# 📚 Babel — Sistema de Gestão Escolar

Sistema completo de gestão escolar com backend em **Laravel 11**, frontend em **React + Vite** e banco de dados **MySQL 8**.

---

## 📁 Estrutura do Projeto

```
babel/
├── backend/          # API Laravel 11 (PHP 8.2+)
├── frontend/         # Interface React + Vite
└── banco-de-dados/   # Scripts SQL e documentação
    ├── 001_schema.sql    # Criação de tabelas
    ├── 002_seeds.sql     # Dados de demonstração
    └── README.md         # Documentação do schema
```

---

## ⚡ Inicialização Rápida

### 1. Banco de Dados

```bash
# Criar banco e executar scripts
mysql -u root -p < banco-de-dados/001_schema.sql
mysql -u root -p babel_escola < banco-de-dados/002_seeds.sql
```

### 2. Backend (Laravel)

```bash
cd backend

# Instalar dependências
composer install

# Configurar ambiente
cp .env.example .env
php artisan key:generate

# Editar .env com suas credenciais de BD
# DB_USERNAME=root
# DB_PASSWORD=sua_senha

# Iniciar servidor
php artisan serve --port=8000
```

API disponível em: **http://localhost:8000/api**

### 3. Frontend (React + Vite)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar em desenvolvimento
npm run dev
```

Interface disponível em: **http://localhost:5173**

---

## 🔑 Credenciais de Demonstração

Todos os usuários usam a senha: **`Babel@2025`**

| E-mail | Perfil | Acesso |
|--------|--------|--------|
| admin@babel.edu.br | Administrador | Total |
| secretaria@babel.edu.br | Secretaria | Alunos, matrículas, financeiro |
| coordenacao@babel.edu.br | Coordenação | Turmas, notas, frequência |
| roberto.alves@babel.edu.br | Professor | Notas e frequência das suas turmas |
| mariajose@gmail.com | Responsável | Boletim dos filhos |
| lucas.santos@babel.edu.br | Aluno | Próprio boletim |

---

## 📦 Módulos Implementados

| Módulo | Funcionalidades |
|--------|----------------|
| **Autenticação** | Login, logout, troca de senha, perfis de acesso |
| **Alunos** | Cadastro, edição, busca, boletim, frequência, responsáveis |
| **Turmas** | Criação, grade curricular, horários, listagem de alunos |
| **Matrículas** | Matrícula, transferência, trancamento, histórico |
| **Notas** | Lançamento por turma/disciplina/período, cálculo de médias |
| **Frequência** | Lançamento de presença/falta, relatório consolidado |
| **Financeiro** | Mensalidades, recebimentos, inadimplentes, resumo financeiro |
| **Comunicação** | Comunicados segmentados, mensagens internas |
| **Dashboard** | Painel personalizado por perfil (admin, professor, responsável) |
| **Auditoria** | Registro automático de alterações críticas |

---

## 🧪 Testes

```bash
cd backend

# Executar todos os testes
php artisan test

# Ou com Pest diretamente
./vendor/bin/pest

# Ver cobertura
./vendor/bin/pest --coverage
```

Testes cobrem: autenticação, permissões por perfil, CRUD de alunos, turmas, notas, frequência e módulo financeiro.

---

## 🔐 Perfis e Permissões

| Perfil | Permissões |
|--------|-----------|
| `admin` | Acesso total a todos os módulos |
| `secretaria` | Alunos, matrículas, turmas, financeiro, comunicados |
| `coordenacao` | Turmas, leitura de notas e frequência, comunicados |
| `professor` | Lança notas e frequência das próprias turmas |
| `responsavel` | Visualiza boletim e frequência dos próprios filhos |
| `aluno` | Visualiza próprio boletim |

---

## 🛠 Tecnologias

**Backend:**
- PHP 8.2+ / Laravel 11
- Laravel Sanctum (autenticação por token)
- MySQL 8.0+

**Frontend:**
- React 18 + Vite 5
- React Router DOM 6
- Recharts (gráficos)
- Axios (HTTP client)

**Banco de Dados:**
- MySQL 8 com utf8mb4_unicode_ci
- Integridade referencial com FK
- Índices otimizados
- Campos JSON para endereços e auditoria
