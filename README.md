# Babel — Sistema de Gestão Escolar Full Stack

> Plataforma acadêmica e financeira completa para instituições de ensino,
> construída com Laravel 11 e React 18 em arquitetura SPA + API REST.

![Laravel](https://img.shields.io/badge/Laravel-11-FF2D20?logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-149ECA?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?logo=mysql&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?logo=php&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Sobre o Projeto

O **Babel** foi desenvolvido para simular um ambiente real de operação escolar,
cobrindo desde o cadastro de alunos e lançamento de notas até o controle
financeiro de mensalidades e comunicação interna entre perfis.

O objetivo técnico foi construir um sistema completo de produção — com
autenticação por token, autorização granular por perfil, geração de documentos
PDF e cobertura de testes — utilizando as melhores práticas de cada camada.

---

## Arquitetura
```
babel/
├── backend/          # API Laravel — regras de negócio, autenticação, módulos
├── frontend/         # SPA React — interface, rotas, consumo da API
├── banco-de-dados/   # Schema, seeds e scripts SQL versionados
└── README.md
```

**Fluxo de autenticação e autorização:**

1. Frontend autentica via `POST /api/auth/login`
2. Token Sanctum é armazenado no cliente e enviado em cada requisição
3. API aplica middleware `perfil:admin|secretaria|coordenacao|...`
4. Módulos de domínio persistem no MySQL e expõem recursos REST
5. Frontend renderiza dashboards e operações conforme o perfil logado

---

## Módulos Implementados

| Módulo | Funcionalidades |
|---|---|
| **Autenticação** | Login, logout, troca de senha, atualização de perfil |
| **Alunos** | Cadastro, boletim, frequência, PDF de boletim |
| **Professores** | Portal, atribuições, tarefas |
| **Turmas e Matrículas** | Gestão de turmas, disciplinas, horários, matrícula em lote |
| **Acadêmico** | Lançamento de notas, cálculo de médias, relatórios |
| **Financeiro** | Mensalidades, recebimentos, estornos, inadimplência, comprovante PDF |
| **Comunicação** | Comunicados e mensagens entre perfis |
| **Gestão Geral** | Ano letivo, períodos, cursos, salas, disciplinas, usuários |

---

## Perfis de Acesso

O sistema implementa 6 perfis com dashboards e permissões independentes:

`admin` `secretaria` `coordenacao` `professor` `responsavel` `aluno`

Cada perfil possui rotas protegidas por middleware e visualiza apenas
os dados e operações pertinentes à sua função.

---

## Stack Tecnológica

### Backend
- **PHP 8.2+** com **Laravel 11**
- **Laravel Sanctum** — autenticação stateless por token
- **DomPDF** — geração de boletins e comprovantes em PDF
- **Pest** — testes automatizados

### Frontend
- **React 18** com **Vite 5**
- **React Router DOM** — roteamento por perfil
- **TanStack React Query** — gerenciamento de estado assíncrono
- **Axios** com interceptors — tratamento centralizado de token e erros
- **Recharts** — dashboards e gráficos

### Banco de Dados
- **MySQL 8+** com schema relacional orientado ao domínio escolar
- Scripts SQL versionados em `banco-de-dados/` (schema, seeds, migrations)

---

## Como Executar Localmente

### 1. Banco de dados
```bash
mysql -u root -p < banco-de-dados/001_schema.sql
mysql -u root -p babel_escola < banco-de-dados/002_seeds.sql
```

### 2. Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
# API disponível em http://localhost:8000/api
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:5173
```

> O `vite.config.js` já possui proxy de `/api` para `http://localhost:8000`.

---

## Credenciais de Demonstração

Senha padrão: `Babel@2025`

| Perfil | E-mail |
|---|---|
| Administrador | `admin@babel.edu.br` |
| Secretaria | `secretaria@babel.edu.br` |
| Coordenação | `coordenacao@babel.edu.br` |
| Professor | `roberto.alves@babel.edu.br` |
| Responsável | `mariajose@gmail.com` |
| Aluno | `lucas.santos@babel.edu.br` |

---

## Testes
```bash
cd backend
php artisan test
```

---

## Diferenciais Técnicos

- Arquitetura SPA + API REST com separação total de responsabilidades
- Autorização granular com 6 perfis independentes via middleware Laravel
- Geração de documentos PDF diretamente pelo backend
- Interceptors HTTP centralizados no frontend para token, erros e mensagens
- Schema relacional orientado ao domínio escolar com scripts versionados
- Cobertura de testes no backend com Pest

---

## Licença

MIT License. Consulte `LICENSE` para detalhes.
