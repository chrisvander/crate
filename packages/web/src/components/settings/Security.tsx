import { useUserStore } from "../../store/UserStore"

export default function Security() {
  const userDoc = useUserStore((state) => state.userDoc)
  const updateUser = useUserStore((state) => state.updateUser)

  const { uses2FA } = userDoc

  return (
    <div className="space-y-4">
      <h2>Security</h2>
      <div className="flex justify-start">
        <div className="mt-2 mb-4 form-check">
          <input
            className="float-left w-4 h-4 mt-1 mr-2 align-top bg-center bg-no-repeat bg-contain border border-gray-300 rounded-sm cursor-pointer form-check-input"
            type="checkbox"
            value=""
            checked={uses2FA}
            onInput={(e) =>
              updateUser({
                ...userDoc,
                uses2FA: (e.target as HTMLInputElement).checked,
              })
            }
            role="switch"
            id="check2FA"
          />
          <label
            className="inline-block form-check-label text-stone-800 dark:text-stone-100"
            for="check2FA"
          >
            Use 2-Factor Authentication
          </label>
        </div>
      </div>
      <span className="text-sm text-stone-800 dark:text-stone-200">
        Using 2-Factor Authentication (2FA) ensures that no one, not even Crate Network, can access
        your data. However, if no other devices can authenticate and you lose the recovery password,
        your data will not be recoverable.
      </span>
    </div>
  )
}
