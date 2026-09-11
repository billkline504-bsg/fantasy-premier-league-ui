// Clean, named re-exports of the OpenAPI-generated schema types this client uses, so screens
// import `UserSelfDto` etc. rather than reaching into `components['schemas']['UserSelfDto']`
// everywhere. Add to this file as more schemas are consumed — do not import from
// `./generated/schema` directly outside this file and the hook modules in `./hooks/`.
import type { components } from './generated/schema';

export type UserSelfDto = components['schemas']['UserSelfDto'];
export type ProfileIcon = components['schemas']['ProfileIcon'];
export type League = components['schemas']['League'];
export type LeagueMembership = components['schemas']['LeagueMembership'];
export type LeagueConfiguration = components['schemas']['LeagueConfiguration'];
export type NotificationPreference = components['schemas']['NotificationPreference'];
export type NotificationEventType = components['schemas']['NotificationEventType'];
export type NotificationChannel = components['schemas']['NotificationChannel'];
