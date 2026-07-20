import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AppDashboard from './pages/AppDashboard'
import SharedProfile from './pages/SharedProfile'
import MedicalIDCard from './components/MedicalIDCard'

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/medical-id" element={<MedicalIDCard />} />
          <Route path="/app/*" element={<AppDashboard />} />
          <Route path="/shared/:token" element={<SharedProfile />} />
        </Routes>
      </Router>
    </>
  )
}

export default App
