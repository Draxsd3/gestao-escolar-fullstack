# Babel | Sistema de Gestao Escolar Full Stack

Projeto full stack para gestao academica e financeira escolar, com backend em Laravel e frontend em React.
O sistema foi construido para simular um ambiente real de operacao escolar com controle de acesso por perfil, processos academicos, comunicacao interna e rotinas financeiras.

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Visao Geral

**Babel** centraliza os fluxos principais de uma instituicao de ensino em uma unica plataforma:

- autenticacao e autorizacao por perfis
- cadastro e acompanhamento de alunos, professores e turmas
- lancamento de notas e frequencia
- modulo financeiro com mensalidades, recebimentos e estornos
- dashboards por tipo de usuario

## Para Recrutadores

Este projeto evidencia experiencia pratica em:

- desenvolvimento full stack (API REST + SPA)
- arquitetura por modulos com separacao frontend/backend
- modelagem relacional SQL para dominio escolar
- controle de acesso por papeis com regras de autorizacao
- qualidade de entrega com testes no backend e padroes de codigo

## Stack Tecnologica

### Backend
- PHP 8.2+
- Laravel 11
- Laravel Sanctum (autenticacao por token)
- DomPDF (geracao de boletim e comprovantes em PDF)
- Pest (testes)

### Frontend
- React 18
- Vite 5
- React Router DOM
- Axios
- TanStack React Query
- Recharts

### Banco de Dados
- MySQL 8+
- Scripts SQL versionados em `banco-de-dados/`

## Arquitetura do Projeto

```text
babel/
|- backend/          # API Laravel (regras de negocio, autenticacao, modulos)
|- frontend/         # SPA React (interface, rotas e consumo da API)
|- banco-de-dados/   # schema, seeds e scripts SQL incrementais
`- README.md
```

## Modulos Implementados

- **Autenticacao e perfis**: login, logout, troca de senha, atualizacao de perfil e middlewares por perfil (`admin`, `secretaria`, `coordenacao`, `professor`, `responsavel`, `aluno`).
- **Alunos**: cadastro, edicao, detalhamento, boletim, frequencia e PDF de boletim.
- **Professores**: cadastro, portal do professor, atribuicoes e tarefas.
- **Turmas e matriculas**: gestao de turmas, disciplinas, horarios e matriculas individuais/em lote.
- **Academico**: lancamento de notas, calculo de medias, frequencia e relatorios.
- **Financeiro**: planos, geracao de mensalidades, recebimentos, estornos, inadimplencia e comprovante PDF.
- **Comunicacao**: comunicados e mensagens entre usuarios.
- **Gestao geral**: administracao de ano letivo, periodos, cursos, salas, disciplinas e usuarios.

## Demonstracao Visual

### 1) Selecao de Portais
![Selecao de portais](docs/screenshots/01-selecao-portais.png)

### 2) Login por Perfil (Admin)
![Login admin](docs/screenshots/02-login-admin.png)

### 3) Dashboard Administrativo
![Dashboard administrativo](docs/screenshots/03-dashboard-admin.png)

### 4) Mensagens Internas
![Mensagens internas](docs/screenshots/04-mensagens-internas.png)

### 5) Gestao de Tarefas
![Gestao de tarefas](docs/screenshots/05-tarefas-professor.png)

## Fluxo Tecnico (Resumo)

1. Frontend React autentica via `/api/auth/login`.
2. Token Sanctum e armazenado no cliente e enviado nas chamadas seguintes.
3. API Laravel aplica autorizacao por middleware `perfil:*`.
4. Modulos de dominio persistem dados no MySQL e expoem recursos REST.
5. Frontend renderiza dashboards e telas de operacao conforme o perfil logado.

## Como Executar Localmente

### 1) Banco de dados

```bash
mysql -u root -p < banco-de-dados/001_schema.sql
mysql -u root -p babel_escola < banco-de-dados/002_seeds.sql
```

Opcional: aplique scripts adicionais de evolucao em `banco-de-dados/` (003+).

### 2) Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

API local: `http://localhost:8000/api`

### 3) Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

App local: `http://localhost:5173`

> O `vite.config.js` ja possui proxy de `/api` para `http://localhost:8000`.

## Credenciais de Demonstracao

Senha padrao dos usuarios seed: `Babel@2025`

- `admin@babel.edu.br` (Administrador)
- `secretaria@babel.edu.br` (Secretaria)
- `coordenacao@babel.edu.br` (Coordenacao)
- `roberto.alves@babel.edu.br` (Professor)
- `mariajose@gmail.com` (Responsavel)
- `lucas.santos@babel.edu.br` (Aluno)

## Testes

Backend:

```bash
cd backend
php artisan test
```

## Diferenciais de Engenharia

- API organizada por controllers e regras de permissao de acesso
- estrutura de banco orientada ao dominio escolar
- frontend com separacao de paginas por modulo
- interceptors HTTP para tratamento de token, mensagens e erros
- suporte a geracao de documentos PDF (boletim e comprovante)

## Estrutura de Pastas (Detalhe)

- `backend/app/Http/Controllers`: endpoints da API por contexto de negocio
- `backend/app/Models`: entidades da aplicacao
- `backend/routes/api.php`: definicao de rotas REST e middlewares
- `frontend/src/pages`: telas organizadas por dominio
- `frontend/src/services`: cliente HTTP e servicos de apoio
- `banco-de-dados`: schema inicial, seeds e scripts incrementais

## Licenca

Este projeto esta sob licenca MIT. Consulte `LICENSE` para detalhes.
