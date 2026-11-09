import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { TodayPage } from './pages/joiner/TodayPage'
import { PeoplePage } from './pages/joiner/PeoplePage'
import { ExplorePage } from './pages/explore/ExplorePage'
import { GoalsPage } from './pages/explore/GoalsPage'
import { OrganisationPage } from './pages/explore/OrganisationPage'
import { BenefitsPage } from './pages/explore/BenefitsPage'
import { PurposePage } from './pages/explore/PurposePage'
import { ValueDetailPage, ValuesPage } from './pages/explore/ValuesPage'
import { ChatPage } from './pages/joiner/ChatPage'
import { JourneyPage } from './pages/joiner/JourneyPage'
import { ChecksPage } from './pages/joiner/ChecksPage'
import { AskPage } from './pages/joiner/AskPage'
import { ManagerHomePage } from './pages/manager/ManagerHomePage'
import { ManagerJoinerPage } from './pages/manager/ManagerJoinerPage'
import { BuddyPage } from './pages/buddy/BuddyPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/today" element={<TodayPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/journey/checks" element={<ChecksPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/explore/goals" element={<GoalsPage />} />
        <Route path="/explore/organisation" element={<OrganisationPage />} />
        <Route path="/explore/benefits" element={<BenefitsPage />} />
        <Route path="/explore/purpose" element={<PurposePage />} />
        <Route path="/explore/values" element={<ValuesPage />} />
        <Route path="/explore/values/:valueId" element={<ValueDetailPage />} />
        <Route path="/people" element={<PeoplePage />} />
        <Route path="/people/chat/:personId" element={<ChatPage />} />
        <Route path="/ask" element={<AskPage />} />
        <Route path="/manager" element={<ManagerHomePage />} />
        <Route path="/manager/joiner/:personaId" element={<ManagerJoinerPage />} />
        <Route path="/buddy" element={<BuddyPage />} />
        <Route path="*" element={<Navigate to="/today" replace />} />
      </Route>
    </Routes>
  )
}
