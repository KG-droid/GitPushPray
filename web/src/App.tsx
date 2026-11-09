import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { TodayPage } from './pages/joiner/TodayPage'
import { PeoplePage } from './pages/joiner/PeoplePage'
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
