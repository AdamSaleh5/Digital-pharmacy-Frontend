import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Medications from './pages/Medications'
import MedicationDetails from './pages/MedicationDetails'
import Pharmacy from './pages/Pharmacy'
import AddUser from './pages/AddUser'
import AddAdmin from './pages/AddAdmin'
import AddAgent from './pages/AddAgent'
import Login from './pages/Login'
import Countries from './pages/Countries'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="medications" element={<Medications />} />
          <Route path="medications/:id" element={<MedicationDetails />} />
          <Route path="pharmacy" element={<Pharmacy />} />
          <Route path="add-user" element={<AddUser />} />
          <Route path="add-admin" element={<ProtectedRoute allowRoles={['Administrator']}><AddAdmin /></ProtectedRoute>} />
          <Route path="add-agent" element={<ProtectedRoute allowRoles={['Admin', 'Administrator']}><AddAgent /></ProtectedRoute>} />
          <Route path="countries" element={<ProtectedRoute allowRoles={['Administrator']}><Countries /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
