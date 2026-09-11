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
export type PositionalMinimums = components['schemas']['PositionalMinimums'];
export type NotificationPreference = components['schemas']['NotificationPreference'];
export type NotificationEventType = components['schemas']['NotificationEventType'];
export type NotificationChannel = components['schemas']['NotificationChannel'];
export type Season = components['schemas']['Season'];
export type Club = components['schemas']['Club'];
export type Gameweek = components['schemas']['Gameweek'];
export type Fixture = components['schemas']['Fixture'];
export type ClubStanding = components['schemas']['ClubStanding'];
export type Player = components['schemas']['Player'];
export type Position = components['schemas']['Position'];
export type FantasyTeam = components['schemas']['FantasyTeam'];
export type Draft = components['schemas']['Draft'];
export type DraftType = components['schemas']['DraftType'];
export type DraftStatus = components['schemas']['DraftStatus'];
export type DraftPlayerPoolEntry = components['schemas']['DraftPlayerPoolEntry'];
export type DraftSelection = components['schemas']['DraftSelection'];
export type DraftSelectionPage = components['schemas']['DraftSelectionPage'];
export type AcquisitionType = components['schemas']['AcquisitionType'];
export type SquadPlayerView = components['schemas']['SquadPlayerView'];
export type ReplacementOpportunity = components['schemas']['ReplacementOpportunity'];
export type LeagueStanding = components['schemas']['LeagueStanding'];
export type HeadToHeadMatch = components['schemas']['HeadToHeadMatch'];
export type LeagueMessage = components['schemas']['LeagueMessage'];
export type RosterStatus = components['schemas']['RosterStatus'];
export type RosterPlayer = components['schemas']['RosterPlayer'];
export type GameweekRoster = components['schemas']['GameweekRoster'];
export type SeasonGoalPrediction = components['schemas']['SeasonGoalPrediction'];
export type AdminActionType = components['schemas']['AdminActionType'];
export type AdministrativeAction = components['schemas']['AdministrativeAction'];
export type AdministrativeActionPage = components['schemas']['AdministrativeActionPage'];
