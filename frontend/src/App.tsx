import { Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import DownloadPage from './pages/DownloadPage'

export default function App() {
  return (
    <>
      <div className="aurora">
        <div className="aurora-blob ab1" />
        <div className="aurora-blob ab2" />
        <div className="aurora-blob ab3" />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/yuklab-olish" element={<DownloadPage />} />
        </Routes>
      </div>
    </>
  )
}
