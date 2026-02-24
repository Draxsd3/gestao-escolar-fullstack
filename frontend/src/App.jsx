import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { AnoLetivoProvider } from './context/AnoLetivoContext'
import LoginPage from './pages/auth/LoginPage'
import Layout from './components/layout/Layout'
import Dashboard from './pages/dashboard/Dashboard'
import AlunosLista from './pages/alunos/AlunosLista'
import AlunoDetalhe from './pages/alunos/AlunoDetalhe'
import AlunoForm from './pages/alunos/AlunoForm'
import TurmasLista from './pages/turmas/TurmasLista'
import TurmaDetalhe from './pages/turmas/TurmaDetalhe'
import MatriculasLista from './pages/turmas/MatriculasLista'
import NotasLancamento from './pages/notas/NotasLancamento'
import FrequenciaLancamento from './pages/frequencia/FrequenciaLancamento'
import FrequenciaRelatorio from './pages/frequencia/FrequenciaRelatorio'
import FinanceiroDashboard from './pages/financeiro/FinanceiroDashboard'
import Inadimplentes from './pages/financeiro/Inadimplentes'
import Mensalidades from './pages/financeiro/Mensalidades'
import PlanosFinanceiro from './pages/financeiro/Planos'
import ComunicadosLista from './pages/comunicacao/ComunicadosLista'
import MensagensLista from './pages/comunicacao/MensagensLista'
import GestaoUsuarios from './pages/admin/GestaoUsuarios'
import GestaoGeral from './pages/gestao/GestaoGeral'
import PeriodoLetivo from './pages/gestao/PeriodoLetivo'
import Salas from './pages/gestao/Salas'
import Cursos from './pages/gestao/Cursos'
import Disciplinas from './pages/gestao/Disciplinas'
import Planos from './pages/gestao/Planos'
 

/* ─── Guarda de rota protegida ─────────────────────────────── */
function RotaProtegida({ children, perfis }) {
  const { autenticado, isPerfil } = useAuth()
  if (!autenticado) return <Navigate to="/login" replace />
  if (perfis && !isPerfil(...perfis)) return <Navigate to="/" replace />
  return children
}

/* ─── Guarda de rota pública ───────────────────────────────── */
function RotaPublica({ children }) {
  const { autenticado } = useAuth()
  if (autenticado) return <Navigate to="/" replace />
  return children
}

/* ─── Rotas ────────────────────────────────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<RotaPublica><LoginPage /></RotaPublica>} />

      <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route index element={<Dashboard />} />

        <Route path="alunos" element={<AlunosLista />} />
        <Route path="alunos/novo" element={<RotaProtegida perfis={['admin','secretaria']}><AlunoForm /></RotaProtegida>} />
        <Route path="alunos/:id" element={<AlunoDetalhe />} />
        <Route path="alunos/:id/editar" element={<RotaProtegida perfis={['admin','secretaria']}><AlunoForm /></RotaProtegida>} />

        <Route path="turmas" element={<TurmasLista />} />
        <Route path="turmas/:id" element={<TurmaDetalhe />} />

        <Route path="matriculas" element={<RotaProtegida perfis={['admin','secretaria','coordenacao']}><MatriculasLista /></RotaProtegida>} />
        <Route path="notas" element={<RotaProtegida perfis={['admin','professor','coordenacao']}><NotasLancamento /></RotaProtegida>} />
        <Route path="frequencia" element={<RotaProtegida perfis={['admin','professor']}><FrequenciaLancamento /></RotaProtegida>} />
        <Route path="frequencia/relatorio" element={<RotaProtegida perfis={['admin','professor','coordenacao']}><FrequenciaRelatorio /></RotaProtegida>} />

        <Route path="financeiro" element={<RotaProtegida perfis={['admin','secretaria']}><FinanceiroDashboard /></RotaProtegida>} />
        <Route path="financeiro/mensalidades" element={<RotaProtegida perfis={['admin','secretaria']}><Mensalidades /></RotaProtegida>} />
        <Route path="financeiro/inadimplentes" element={<RotaProtegida perfis={['admin','secretaria']}><Inadimplentes /></RotaProtegida>} />
        <Route path="financeiro/planos" element={<RotaProtegida perfis={['admin','secretaria']}><PlanosFinanceiro /></RotaProtegida>} />

        <Route path="comunicados" element={<ComunicadosLista />} />
        <Route path="mensagens" element={<MensagensLista />} />

        <Route path="admin/usuarios" element={<RotaProtegida perfis={['admin']}><GestaoUsuarios /></RotaProtegida>} />

        <Route path="gestao-geral" element={<RotaProtegida perfis={['admin']}><GestaoGeral /></RotaProtegida>} />
        <Route path="gestao-geral/periodo-letivo" element={<RotaProtegida perfis={['admin']}><PeriodoLetivo /></RotaProtegida>} />
        <Route path="gestao-geral/salas" element={<RotaProtegida perfis={['admin']}><Salas /></RotaProtegida>} />
        <Route path="gestao-geral/cursos" element={<RotaProtegida perfis={['admin']}><Cursos /></RotaProtegida>} />
        <Route path="gestao-geral/disciplinas" element={<RotaProtegida perfis={['admin']}><Disciplinas /></RotaProtegida>} />
        <Route path="gestao-geral/planos" element={<RotaProtegida perfis={['admin']}><Planos /></RotaProtegida>} />
        
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

/* ─── Root ─────────────────────────────────────────────────── */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnoLetivoProvider>
          <AppRoutes />
        </AnoLetivoProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
