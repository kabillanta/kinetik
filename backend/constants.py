# KinetiK Backend Constants
# Centralized magic numbers and config values

# User Roles
VALID_ROLES = ["volunteer", "organizer"]

# Event Statuses
EVENT_STATUSES = ["OPEN", "COMPLETED", "CANCELLED"]

# Application Statuses  
APPLICATION_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"]

# Scoring & Reputation
HOURS_PER_EVENT = 4
REPUTATION_PER_ACCEPTED = 50
REPUTATION_PER_COMPLETED = 20

# Limits
MAX_SKILLS_PER_USER = 50
MAX_EVENTS_PER_PAGE = 100
DEFAULT_PAGE_SIZE = 20
MAX_SEARCH_QUERY_LENGTH = 200

# Recommendation weights
SKILL_MATCH_WEIGHT = 3
LOCATION_WEIGHT = 2
ORGANIZER_HISTORY_WEIGHT = 1
