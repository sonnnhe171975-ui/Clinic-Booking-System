import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

function BackButton({ fallback = '/', label = 'Back', className = '', forceFallback = false }) {
  const navigate = useNavigate()

  function handleBack() {
    if (forceFallback) {
      navigate(fallback)
      return
    }

    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(fallback)
  }

  return (
    <Button variant="outline-secondary" size="sm" onClick={handleBack} className={className}>
      ← {label}
    </Button>
  )
}

export default BackButton
