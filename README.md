# 📚 Babel — Sistema de Gestão Escolar

Sistema de gestão escolar desenvolvido com **Laravel 11 (backend)**, **React + Vite (frontend)** e **MySQL 8 (banco de dados)**.

O projeto simula um sistema real utilizado por escolas, com controle de usuários, turmas, notas, frequência e financeiro.

---

# 🚀 Tecnologias Utilizadas

## Backend
- PHP 8.2+
- Laravel 11
- Laravel Sanctum (autenticação por token)
- MySQL 8

## Frontend
- React 18
- Vite 5
- React Router DOM
- Axios
- Recharts

---

# 📁 Estrutura do Projeto

    babel/
    ├── backend/          # API Laravel
    ├── frontend/         # Aplicação React
    └── banco-de-dados/   # Scripts SQL

---

# 🔐 Autenticação e Perfis

O sistema possui autenticação com controle de acesso por perfil.

Perfis disponíveis:

- Administrador
- Secretaria
- Coordenação
- Professor
- Responsável
- Aluno

Cada perfil possui permissões específicas dentro do sistema.

---

# 📦 Funcionalidades

## 👤 Gestão de Usuários
- Login e logout
- Controle de acesso por perfil
- Alteração de senha

## 🎓 Gestão de Alunos
- Cadastro e edição
- Associação com responsáveis
- Histórico escolar
- Visualização de boletim

## 🏫 Turmas
- Criação e edição
- Associação de alunos
- Associação de professores

## 📝 Notas
- Lançamento por disciplina
- Cálculo automático de média
- Visualização por aluno

## 📅 Frequência
- Registro de presença/falta
- Relatório por período

## 💰 Financeiro
- Controle de mensalidades
- Registro de pagamentos
- Listagem de inadimplentes

## 📢 Comunicação
- Envio de comunicados
- Visualização por perfil

## 📊 Dashboard
- Painel personalizado para cada tipo de usuário

---

# 🧪 Testes

O backend possui testes automatizados para validar:

- Autenticação
- Permissões por perfil
- Operações principais (alunos, turmas, notas e financeiro)

Para executar:

    cd backend
    php artisan test

---

# ⚙️ Como Executar o Projeto

## 1️⃣ Banco de Dados

    mysql -u root -p < banco-de-dados/001_schema.sql
    mysql -u root -p babel_escola < banco-de-dados/002_seeds.sql

---

## 2️⃣ Backend

    cd backend
    composer install
    cp .env.example .env
    php artisan key:generate

    # Configurar acesso ao banco no .env
    php artisan serve

API disponível em:
http://localhost:8000/api

---

## 3️⃣ Frontend

    cd frontend
    npm install
    npm run dev

Aplicação disponível em:
http://localhost:5173

---

# 🎯 Objetivo do Projeto

Este projeto demonstra:

- Desenvolvimento fullstack
- Integração entre API e frontend
- Organização de código
- Controle de acesso por perfil
- Estrutura de sistema aplicado ao contexto escolar
