UPDATE public.profiles
SET avatar_url = regexp_replace(
  split_part(avatar_url, '?', 1),
  '^https?://[^/]+/storage/v1/(object|render/image)/public/avatars/',
  ''
)
WHERE avatar_url ~ '^https?://[^/]+/storage/v1/(object|render/image)/public/avatars/';