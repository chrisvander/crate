/**
 * User information object
 * @export
 * @interface UserInfo
 */
export type UserInfo = {
  /**
   * First name of the user
   * @type {string}
   * @memberof UserInfo
   */
  firstName: string
  /**
   * Last name of the user
   * @type {string}
   * @memberof UserInfo
   */
  lastName: string
  /**
   * User's organization
   * @type {string}
   * @memberof UserInfo
   */
  organization: string
}

/**
 * User security object
 * @export
 * @interface UserSecurity
 */
export type UserSecurity = {
  /**
   * Whether the user has 2-factor authentication
   * @type {boolean}
   * @memberof UserSecurity
   */
  uses2FA: boolean
  /**
   * Describes a mapping from device UUID to a device's public key.
   * @type {Record<string, string>}
   * @memberof UserSecurity
   */
  devices: Record<string, string>
  /**
   * Describes a mapping from device UUID to the user's data key, signed by the
   * particular device.
   * @type {Record<string, string>}
   * @memberof UserSecurity
   */
  signedDataKey: Record<string, string>
  /**
   * The user's data key, encrypted by a recovery password.
   * @type {string | null}
   * @memberof UserSecurity
   */
  recoveryKey: string | null
  /**
   * The user's unencrypted data key, stored if the user has not set up
   * 2-factor authentication.
   * @type {string | null}
   * @memberof UserSecurity
   */
  dataKey: string | null
}

export type AtprotoUser = {
  did: string
  handle: string
}

/**
 * The overall Crate user model.
 * @export
 * @interface UserModel
 */
export type UserModel = UserInfo & UserSecurity
