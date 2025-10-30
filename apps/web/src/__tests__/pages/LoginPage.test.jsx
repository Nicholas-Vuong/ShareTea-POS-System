import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import LoginPage from '../../pages/LoginPage.jsx'

const setAuthMock = vi.fn()
const startLoadingMock = vi.fn()
const setErrorMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('../../stores/authStore.js', () => {
  const mock = () => ({
    setAuth: setAuthMock,
    startLoading: startLoadingMock,
    setError: setErrorMock,
    loading: false,
    error: null
  })

  mock.getState = () => mock()

  return {
    useAuthStore: mock,
    default: mock
  }
})

const clientPostMock = vi.fn()

vi.mock('../../api/client.js', () => ({
  default: {
    post: clientPostMock
  }
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: null })
  }
})

describe('LoginPage', () => {
  beforeEach(() => {
    setAuthMock.mockReset()
    startLoadingMock.mockReset()
    setErrorMock.mockReset()
    clientPostMock.mockReset()
    navigateMock.mockReset()
  })

  it('renders login form', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('submits credentials and navigates by role', async () => {
    clientPostMock.mockResolvedValue({
      data: {
        token: 'abc',
        user: { email: 'maria@example.com', role: 'Manager', name: 'Maria' }
      }
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'maria@example.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(setAuthMock).toHaveBeenCalled()
    })

    expect(navigateMock).toHaveBeenCalledWith('/manager', { replace: true })
  })
})
