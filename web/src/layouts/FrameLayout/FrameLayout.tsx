import { useAuth } from '@redwoodjs/auth'
import { Toaster } from '@redwoodjs/web/toast'
import { useState } from 'react'

type FrameLayoutProps = {
  children?: React.ReactNode
}

const FrameLayout = ({ children }: FrameLayoutProps) => {
  const [menuOpen, changeMenuOpen] = useState(false)
  const { loading, isAuthenticated, logIn, logOut } = useAuth()

  if (loading) {
    // auth is rehydrating
    return null
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster />
      <header>
        <nav className="bg-white shadow dark:bg-gray-800">
          <div className="container px-6 py-4 mx-auto">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-gray-700"></div>

                <div className="flex md:hidden">
                  <button
                    type="button"
                    className="text-gray-500 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 focus:outline-none focus:text-gray-600 dark:focus:text-gray-400"
                    aria-label="toggle menu"
                    onClick={() => changeMenuOpen(!menuOpen)}
                  >
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path
                        fillRule="evenodd"
                        d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div
                className={`flex-1 md:flex md:items-center md:justify-between ${
                  menuOpen ? 'block' : 'hidden'
                }`}
              >
                <div className="flex flex-col -mx-4 md:flex-row md:items-center md:mx-8"></div>

                <div className="flex items-center mt-4 md:mt-0 space-x-4">
                  <button
                    className="bg-gray-100"
                    onClick={async () => {
                      if (isAuthenticated) {
                        await logOut()
                      } else {
                        await logIn()
                      }
                    }}
                  >
                    {isAuthenticated ? 'Log out' : 'Log in'}
                  </button>
                  <button
                    type="button"
                    className="flex items-center focus:outline-none"
                    aria-label="toggle profile dropdown"
                  >
                    <div className="w-8 h-8 overflow-hidden border-2 border-gray-400 rounded-full">
                      <img
                        src=""
                        className="object-cover w-full h-full"
                        alt="avatar"
                      />
                    </div>

                    <h3 className="mx-2 text-sm font-medium text-gray-700 dark:text-gray-200 md:hidden">
                      User Name
                    </h3>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
      <main className="w-full flex-grow p-3 overflow-auto dark:bg-gray-700 dark:text-gray-50">
        {children}
      </main>
      <footer className="shadow dark:text-gray-400 dark:bg-gray-800 body-font">
        <div className="container px-5 py-8 mx-auto flex items-center sm:flex-row flex-col">
          <div className="flex title-font font-medium items-center md:justify-start justify-center dark:text-white">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="w-10 h-10 text-white p-2 bg-indigo-500 rounded-full"
              viewBox="0 0 24 24"
            >
              <path d="M14.526 6.10576C15.0265 6.33917 15.2667 6.88343 15.0625 7.3214L9.88541 18.4237C9.68118 18.8616 9.10985 19.0275 8.60931 18.7941C8.10877 18.5607 7.86857 18.0164 8.0728 17.5784L13.2499 6.47616C13.4541 6.03819 14.0254 5.87235 14.526 6.10576Z"></path>
            </svg>
          </div>
          <p className="text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l-2 dark:sm:border-gray-700 sm:py-2 sm:mt-0 mt-4"></p>
        </div>
      </footer>
    </div>
  )
}

export default FrameLayout
