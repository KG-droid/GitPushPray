import type { SvgIconProps } from '@mui/material'
import AccessibilityNewRounded from '@mui/icons-material/AccessibilityNewRounded'
import AutoStoriesRounded from '@mui/icons-material/AutoStoriesRounded'
import BadgeRounded from '@mui/icons-material/BadgeRounded'
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded'
import CelebrationRounded from '@mui/icons-material/CelebrationRounded'
import ChatRounded from '@mui/icons-material/ChatRounded'
import CodeRounded from '@mui/icons-material/CodeRounded'
import CoffeeRounded from '@mui/icons-material/CoffeeRounded'
import EmojiEventsRounded from '@mui/icons-material/EmojiEventsRounded'
import EventRounded from '@mui/icons-material/EventRounded'
import FavoriteRounded from '@mui/icons-material/FavoriteRounded'
import FlagRounded from '@mui/icons-material/FlagRounded'
import ForumRounded from '@mui/icons-material/ForumRounded'
import GavelRounded from '@mui/icons-material/GavelRounded'
import GroupsRounded from '@mui/icons-material/GroupsRounded'
import HandshakeRounded from '@mui/icons-material/HandshakeRounded'
import HeadsetMicRounded from '@mui/icons-material/HeadsetMicRounded'
import HomeRounded from '@mui/icons-material/HomeRounded'
import InsightsRounded from '@mui/icons-material/InsightsRounded'
import KeyRounded from '@mui/icons-material/KeyRounded'
import LaptopMacRounded from '@mui/icons-material/LaptopMacRounded'
import MoodRounded from '@mui/icons-material/MoodRounded'
import PaymentsRounded from '@mui/icons-material/PaymentsRounded'
import PersonRounded from '@mui/icons-material/PersonRounded'
import PlaceRounded from '@mui/icons-material/PlaceRounded'
import RedeemRounded from '@mui/icons-material/RedeemRounded'
import ScheduleRounded from '@mui/icons-material/ScheduleRounded'
import SchoolRounded from '@mui/icons-material/SchoolRounded'
import ShieldRounded from '@mui/icons-material/ShieldRounded'
import StorefrontRounded from '@mui/icons-material/StorefrontRounded'
import VerifiedRounded from '@mui/icons-material/VerifiedRounded'
import WavingHandRounded from '@mui/icons-material/WavingHandRounded'
import ForestRounded from '@mui/icons-material/ForestRounded'
import type { ComponentType } from 'react'

const icons: Record<string, ComponentType<SvgIconProps>> = {
  accessibility_new: AccessibilityNewRounded,
  auto_stories: AutoStoriesRounded,
  badge: BadgeRounded,
  calendar: CalendarMonthRounded,
  celebration: CelebrationRounded,
  chat: ChatRounded,
  code: CodeRounded,
  coffee: CoffeeRounded,
  emoji_events: EmojiEventsRounded,
  event: EventRounded,
  favorite: FavoriteRounded,
  flag: FlagRounded,
  forum: ForumRounded,
  gavel: GavelRounded,
  groups: GroupsRounded,
  handshake: HandshakeRounded,
  headset: HeadsetMicRounded,
  home: HomeRounded,
  insights: InsightsRounded,
  key: KeyRounded,
  laptop: LaptopMacRounded,
  mood: MoodRounded,
  payments: PaymentsRounded,
  person: PersonRounded,
  place: PlaceRounded,
  redeem: RedeemRounded,
  schedule: ScheduleRounded,
  school: SchoolRounded,
  shield: ShieldRounded,
  storefront: StorefrontRounded,
  verified: VerifiedRounded,
  waving_hand: WavingHandRounded,
  eco: ForestRounded,
}

/** Maps the icon names used in the step catalogue to MUI icons. */
export function StepIcon({ name, ...props }: { name: string } & SvgIconProps) {
  const Icon = icons[name] ?? CelebrationRounded
  return <Icon {...props} />
}
