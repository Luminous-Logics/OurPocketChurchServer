/**
 * System Role Constants
 *
 * Centralized role codes to avoid hardcoding strings throughout the application.
 * This provides type safety, autocomplete, and a single source of truth.
 *
 * @module constants/roles
 */

import { UserType } from '../types';

/**
 * System-defined role codes
 * These are core roles that cannot be modified by users
 */
export const SYSTEM_ROLES = {
  /** Super Administrator - Full system access */
  SUPER_ADMIN: 'SUPER_ADMIN',

  /** Church Administrator - Parish-level administration */
  CHURCH_ADMIN: 'CHURCH_ADMIN',

  /** Family Member - Default role for parishioners */
  FAMILY_MEMBER: 'FAMILY_MEMBER',
} as const;

/**
 * Ward role codes (system-defined)
 */
export const WARD_ROLES = {
  CONVENER: 'WARD_CONVENER',
  SECRETARY: 'WARD_SECRETARY',
  TREASURER: 'WARD_TREASURER',
  PRAYER_COORDINATOR: 'WARD_PRAYER_COORD',
  YOUTH_LEADER: 'WARD_YOUTH_LEADER',
  CATECHISM_TEACHER: 'WARD_CATECHISM',
  SOCIAL_SERVICE: 'WARD_SOCIAL_SERVICE',
  FAMILY_APOSTOLATE: 'WARD_FAMILY_APOSTOLATE',
  CHOIR_LEADER: 'WARD_CHOIR_LEADER',
  SACRISTAN: 'WARD_SACRISTAN',
} as const;

/**
 * Default role mapping for user types
 * Maps UserType enum values to their corresponding default role codes
 *
 * @example
 * const roleCode = USER_TYPE_DEFAULT_ROLES[UserType.CHURCH_ADMIN];
 * // Returns: 'CHURCH_ADMIN'
 */
export const USER_TYPE_DEFAULT_ROLES: Record<UserType, string> = {
  [UserType.SUPER_ADMIN]: SYSTEM_ROLES.SUPER_ADMIN,
  [UserType.CHURCH_ADMIN]: SYSTEM_ROLES.CHURCH_ADMIN,
  [UserType.PARISHIONER]: SYSTEM_ROLES.FAMILY_MEMBER,
};

/**
 * Helper function to get default role for a user type
 *
 * @param userType - The user type (from UserType enum)
 * @returns The corresponding role code
 *
 * @example
 * const roleCode = getDefaultRoleForUserType(UserType.CHURCH_ADMIN);
 * // Returns: 'CHURCH_ADMIN'
 */
export function getDefaultRoleForUserType(userType: UserType): string {
  return USER_TYPE_DEFAULT_ROLES[userType] || SYSTEM_ROLES.FAMILY_MEMBER;
}

/**
 * Type definition for system role codes
 * Provides type safety when working with role codes
 */
export type SystemRoleCode = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];

/**
 * Type definition for ward role codes
 */
export type WardRoleCode = typeof WARD_ROLES[keyof typeof WARD_ROLES];

/**
 * Check if a role code is a system role
 *
 * @param roleCode - The role code to check
 * @returns true if it's a system role, false otherwise
 */
export function isSystemRole(roleCode: string): boolean {
  return Object.values(SYSTEM_ROLES).includes(roleCode as SystemRoleCode);
}

/**
 * Check if a role code is a ward role
 *
 * @param roleCode - The role code to check
 * @returns true if it's a ward role, false otherwise
 */
export function isWardRole(roleCode: string): boolean {
  return Object.values(WARD_ROLES).includes(roleCode as WardRoleCode);
}
