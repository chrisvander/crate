import type { AtprotoUser, UserModel } from "@crate/types"
import { create } from "zustand"
import AuthAPI from "../api/AuthAPI"

interface UserState {
  authenticating: boolean
  signedIn: boolean
  user: AtprotoUser | null
  userDoc: UserModel | null
  login: (handle: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (update: Partial<UserModel>) => Promise<void>
}

export const useUserStore = create<UserState>((set) => ({
  authenticating: true,
  signedIn: false,
  user: null,
  userDoc: null,
  login: AuthAPI.login,
  logout: async () => {
    await AuthAPI.logout()
    set({ signedIn: false, user: null, userDoc: null })
  },
  updateUser: async (update) => {
    set({ userDoc: await AuthAPI.updateUser(update) })
  },
}))

AuthAPI.getSession()
  .then((session) => {
    useUserStore.setState({
      authenticating: false,
      signedIn: !!session,
      user: session?.user ?? null,
      userDoc: session?.userDoc ?? null,
    })
  })
  .catch(() => useUserStore.setState({ authenticating: false }))
