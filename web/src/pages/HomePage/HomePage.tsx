import { MetaTags } from '@redwoodjs/web'
import { useAuth } from '@redwoodjs/auth'

const HomePage = () => {
  const { currentUser, isAuthenticated } = useAuth()

  return (
    <>
      <MetaTags title="Home" description="Home page" />

      {isAuthenticated && <h1>Welcome, {currentUser?.name}</h1>}
      {!isAuthenticated && <h1>You&apos;re not logged in</h1>}
    </>
  )
}

export default HomePage
